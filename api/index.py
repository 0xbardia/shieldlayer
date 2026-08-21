"""Read-only FastAPI app. Wallet-signed writes are validated then rejected for relay."""

from __future__ import annotations

import logging
import os
import re
import sys
import time
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from api._core import (  # noqa: E402
    ALLOWED_ORIGINS,
    CONTRACT,
    CHAIN_ID,
    RPC,
    VIEW_ALLOWLIST,
    client_ip,
    cors_headers,
    rpc_healthy,
    rpc_read,
)
from api._ratelimit import check as rate_check, peek as rate_peek  # noqa: E402
from api._redis import ping_info  # noqa: E402
from api._signing import parse_and_bind, recover  # noqa: E402
# Keep write allowlist here so the API can boot without genlayer-py on the host.
WRITE_METHODS = frozenset(
    {
        "purchase_policy",
        "file_claim",
        "settle_claim",
        "fund_pool",
        "propose_owner",
        "accept_ownership",
        "schedule_admin",
        "cancel_admin",
        "execute_admin",
    }
)

logger = logging.getLogger(__name__)

ADDR_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")
HEALTH_PATHS = {"/api/health", "/health"}

app = FastAPI(
    title="ShieldLayer Insurance API",
    version="1.2.0",
    description="Read-only GenLayer insurance API. Writes are wallet-signed on-chain.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


def _origin(request: Request) -> str | None:
    return request.headers.get("origin")


def _ip(request: Request) -> str:
    remote = request.client.host if request.client else "unknown"
    return client_ip(remote, request.headers.get("x-forwarded-for"))


def _ok(request: Request, data: Any, status: int = 200, write: bool = False) -> JSONResponse:
    limit, remaining, reset = rate_peek(_ip(request), write=write)
    headers = cors_headers(_origin(request))
    headers.update(
        {
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(reset),
        }
    )
    return JSONResponse(content=data, status_code=status, headers=headers)


def _err(request: Request, code: str, status: int, write: bool = False) -> JSONResponse:
    return _ok(request, {"error": code}, status, write=write)


@app.middleware("http")
async def rate_mw(request: Request, call_next):
    start_time = time.time()
    path = request.url.path.rstrip("/") or "/"
    write = request.method == "POST" and path.endswith("/tx")
    ok, limit, remaining, reset = rate_check(_ip(request), write=write)
    if not ok:
        headers = cors_headers(_origin(request))
        headers.update(
            {
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset),
            }
        )
        logger.warning("Rate limited: %s %s from %s", request.method, path, _ip(request))
        return JSONResponse({"error": "ERR_RATE_LIMITED"}, status_code=429, headers=headers)
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("unhandled")
        return _err(request, "ERR_INTERNAL", 500)
    duration = time.time() - start_time
    logger.info("%s %s %d %.3fs", request.method, path, response.status_code, duration)
    return response


@app.options("/{full_path:path}")
async def preflight(full_path: str, request: Request) -> JSONResponse:
    return _ok(request, {"ok": True})


@app.get("/api/health")
@app.get("/health")
async def health(request: Request) -> JSONResponse:
    rpc_ok = rpc_healthy()
    redis_info = ping_info()
    redis_ok = bool(redis_info.get("ok"))
    healthy = rpc_ok and redis_ok
    return _ok(
        request,
        {
            "ok": healthy,
            "contract": CONTRACT,
            "rpc": RPC,
            "chainId": CHAIN_ID,
            "rpcReachable": rpc_ok,
            "localMode": False,
            "redis": "connected" if redis_ok else "down",
            "redisStats": redis_info,
            "contractDeployed": not str(CONTRACT).lower().endswith("0000000000000000"),
            "brand": "ShieldLayer",
            "slogan": "Protection, On-Chain",
        },
        status=200 if healthy else 503,
    )


@app.get("/api/stats")
@app.get("/stats")
async def stats(request: Request) -> JSONResponse:
    try:
        data = rpc_read("get_stats")
        if not isinstance(data, dict):
            data = {
                "total_policies": 0,
                "total_claims": 0,
                "premium_pool": 0,
                "approved_claims": 0,
                "rejected_claims": 0,
            }
        return _ok(request, data)
    except PermissionError:
        return _err(request, "ERR_FORBIDDEN", 403)
    except ConnectionError as exc:
        logger.warning("stats fail-open (rpc_unavailable): %s", exc)
        return _ok(request, {"total_policies": 0, "total_claims": 0, "premium_pool": 0, "approved_claims": 0, "rejected_claims": 0, "stale": True, "reason": "rpc_unavailable"})
    except Exception:
        logger.exception("stats fail-open")
        return _ok(request, {"total_policies": 0, "total_claims": 0, "premium_pool": 0, "approved_claims": 0, "rejected_claims": 0, "stale": True, "reason": "read_failed"})


def _need_addr(address: str | None) -> str | None:
    if not address:
        return "ERR_ADDRESS_REQUIRED"
    if not ADDR_RE.match(address):
        return "ERR_INVALID_ADDRESS"
    return None


@app.get("/api/policies")
@app.get("/policies")
async def policies(request: Request, address: str | None = None) -> JSONResponse:
    err = _need_addr(address)
    if err:
        return _err(request, err, 400)
    try:
        raw = rpc_read("get_policies", [address.lower()])
        policies = raw if isinstance(raw, list) else []
        return _ok(request, {"policies": policies})
    except ConnectionError as exc:
        logger.warning("policies fail-open empty list (rpc_unavailable): %s", exc)
        return _ok(request, {"policies": [], "stale": True, "reason": "rpc_unavailable"})
    except Exception:
        logger.exception("policies fail-open")
        return _ok(request, {"policies": [], "stale": True, "reason": "read_failed"})


@app.get("/api/policies/{policy_id}")
@app.get("/policies/{policy_id}")
async def policy_one(policy_id: str, request: Request) -> JSONResponse:
    try:
        pid = int(policy_id)
    except ValueError:
        return _err(request, "ERR_INVALID_ID", 400)
    try:
        data = rpc_read("get_policy", [pid])
        if isinstance(data, dict) and data.get("error") == "not_found":
            return _err(request, "ERR_NOT_FOUND", 404)
        return _ok(request, data)
    except ConnectionError as exc:
        logger.warning("policy %s fail-open (rpc_unavailable): %s", pid, exc)
        return _ok(request, {"error": "not_found", "stale": True, "reason": "rpc_unavailable"}, 200)
    except Exception:
        logger.exception("policy fail-open")
        return _ok(request, {"error": "not_found", "stale": True, "reason": "read_failed"}, 200)


@app.get("/api/claim")
async def claim_status_query(request: Request, id: str | None = None) -> JSONResponse:
    try:
        cid = int(id or "")
    except ValueError:
        return _err(request, "ERR_INVALID_ID", 400)
    try:
        return _ok(request, rpc_read("check_claim_status", [cid]))
    except ConnectionError as exc:
        logger.warning("claim-status %s fail-open (rpc_unavailable): %s", cid, exc)
        return _ok(request, {"status": "unknown", "stale": True, "reason": "rpc_unavailable"}, 200)
    except Exception:
        logger.exception("claim-status fail-open")
        return _ok(request, {"status": "unknown", "stale": True, "reason": "read_failed"}, 200)


@app.get("/api/claims")
@app.get("/claims")
async def claims(request: Request, address: str | None = None) -> JSONResponse:
    err = _need_addr(address)
    if err:
        return _err(request, err, 400)
    try:
        raw = rpc_read("get_claims_by_user", [address.lower()])
        claims = raw if isinstance(raw, list) else []
        return _ok(request, {"claims": claims})
    except ConnectionError as exc:
        logger.warning("claims fail-open empty list (rpc_unavailable): %s", exc)
        return _ok(request, {"claims": [], "stale": True, "reason": "rpc_unavailable"})
    except Exception:
        logger.exception("claims fail-open")
        return _ok(request, {"claims": [], "stale": True, "reason": "read_failed"})


@app.get("/api/claims/{claim_id}")
@app.get("/claims/{claim_id}")
async def claim_one(claim_id: str, request: Request) -> JSONResponse:
    try:
        cid = int(claim_id)
    except ValueError:
        return _err(request, "ERR_INVALID_ID", 400)
    try:
        data = rpc_read("get_claim", [cid])
        if isinstance(data, dict) and data.get("error") == "not_found":
            return _err(request, "ERR_NOT_FOUND", 404)
        return _ok(request, data)
    except ConnectionError as exc:
        logger.warning("claim %s fail-open (rpc_unavailable): %s", cid, exc)
        return _ok(request, {"error": "not_found", "stale": True, "reason": "rpc_unavailable"}, 200)
    except Exception:
        logger.exception("claim fail-open")
        return _ok(request, {"error": "not_found", "stale": True, "reason": "read_failed"}, 200)


@app.post("/api/read")
@app.post("/read")
async def generic_read(request: Request) -> JSONResponse:
    try:
        body = await request.json()
    except Exception:
        return _err(request, "ERR_INVALID_PAYLOAD", 400)
    function = body.get("function")
    args = body.get("args") or []
    if not function or not isinstance(function, str):
        return _err(request, "ERR_INVALID_PAYLOAD", 400)
    if function not in VIEW_ALLOWLIST:
        return _err(request, "ERR_FORBIDDEN", 403)
    if not isinstance(args, list):
        return _err(request, "ERR_INVALID_PAYLOAD", 400)
    try:
        if function in {"get_policies", "get_claims_by_user"} and args:
            args = [str(args[0]).lower(), *args[1:]]
        result = rpc_read(function, args)
        if function in {"get_policies", "get_claims_by_user"} and not isinstance(result, list):
            result = []
        return _ok(request, {"result": result})
    except PermissionError:
        return _err(request, "ERR_FORBIDDEN", 403)
    except ConnectionError as exc:
        logger.warning("generic read %s fail-open (rpc_unavailable): %s", function, exc)
        fallback = [] if function in {"get_policies", "get_claims_by_user"} else {}
        if function == "get_stats":
            fallback = {"total_policies": 0, "total_claims": 0, "premium_pool": 0, "approved_claims": 0, "rejected_claims": 0}
        # Preserve shape: always return result + stale:true
        return _ok(request, {"result": fallback, "stale": True, "reason": "rpc_unavailable"})
    except Exception:
        logger.exception("read fail-open")
        fallback = [] if function in {"get_policies", "get_claims_by_user"} else {}
        if function == "get_stats":
            fallback = {"total_policies": 0, "total_claims": 0, "premium_pool": 0, "approved_claims": 0, "rejected_claims": 0}
        return _ok(request, {"result": fallback, "stale": True, "reason": "read_failed"})


@app.post("/api/tx")
@app.post("/tx")
async def signed_write(request: Request) -> JSONResponse:
    """Validate a bound signature, then refuse to apply it (no server-side state)."""
    try:
        body = await request.json()
    except Exception:
        return _err(request, "ERR_INVALID_PAYLOAD", 400, write=True)
    function = body.get("function")
    args = body.get("args") or []
    try:
        value = int(body.get("value") or 0)
    except (TypeError, ValueError):
        return _err(request, "ERR_INVALID_PAYLOAD", 400, write=True)
    signature = body.get("signature")
    address = (body.get("address") or "").lower()
    message = body.get("message") or ""
    nonce = str(body.get("nonce") or "")
    if function not in WRITE_METHODS:
        return _err(request, "ERR_FORBIDDEN", 403, write=True)
    if not isinstance(args, list) or not signature or not message or not ADDR_RE.match(address):
        return _err(request, "ERR_INVALID_PAYLOAD", 400, write=True)
    try:
        parse_and_bind(
            function=function,
            args=args,
            value=value,
            address=address,
            message=message,
            nonce=nonce,
        )
        recovered = recover(message, signature)
    except ValueError as exc:
        code = str(exc) if str(exc).startswith("ERR_") else "ERR_INVALID_PAYLOAD"
        status = 403 if code in {"ERR_REPLAY", "ERR_MESSAGE_MISMATCH"} else 400
        return _err(request, code, status, write=True)
    except Exception:
        logger.exception("signature")
        return _err(request, "ERR_BAD_SIGNATURE", 400, write=True)
    if recovered != address:
        return _err(request, "ERR_SIGNER_MISMATCH", 403, write=True)
    return _err(request, "ERR_RELAY_DISABLED", 403, write=True)


handler = app
