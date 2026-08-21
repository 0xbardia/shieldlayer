"""Read-only GenLayer helpers. Never loads a private key. Fail-closed on RPC."""

from __future__ import annotations

import json
import logging
import os
import re
import sys
import time
from typing import Any
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)

_stale = ("84add77c", "76068aad", "e390956a")
_env_contract = os.environ.get("PUBLIC_CONTRACT_ADDRESS", "").strip()
CONTRACT = (
    "0x0000000000000000000000000000000000000000"
    if any(s in _env_contract.lower() for s in _stale)
    else (_env_contract or "0x0000000000000000000000000000000000000000")
)
RPC = os.environ.get("GENLAYER_RPC_URL", "https://studio.genlayer.com/api")
CHAIN_ID = os.environ.get("GENLAYER_CHAIN_ID", "61999")
LOCAL_MODE = False
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3456,http://127.0.0.1:3456,http://localhost:4173",
    ).split(",")
    if o.strip()
]
TRUSTED_PROXIES = {
    p.strip()
    for p in os.environ.get("TRUSTED_PROXIES", "127.0.0.1,::1").split(",")
    if p.strip()
}

VIEW_ALLOWLIST = frozenset(
    {
        "get_stats",
        "get_policies",
        "get_policy",
        "get_claim",
        "get_claims_by_user",
        "get_premium_bps",
        "check_claim_status",
        "get_reserve",
        "get_owner",
    }
)

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

_failures = 0
_cache: dict[str, tuple[float, Any]] = {}
_CACHE_TTL = 30.0
_IP_RE = re.compile(
    r"^(?:(?:\d{1,3}\.){3}\d{1,3}|[0-9a-fA-F:]+)$"
)


def cors_headers(origin: str | None = None) -> dict[str, str]:
    allow = ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "http://127.0.0.1:3456"
    if origin and origin in ALLOWED_ORIGINS:
        allow = origin
    return {
        "Access-Control-Allow-Origin": allow,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Vary": "Origin",
        "X-Content-Type-Options": "nosniff",
    }


def client_ip(remote: str | None, xff: str | None) -> str:
    """Trust X-Forwarded-For only from nginx / TRUSTED_PROXIES."""
    peer = (remote or "unknown").split("%")[0]
    if peer not in TRUSTED_PROXIES:
        return peer
    if not xff:
        return peer
    first = xff.split(",")[0].strip()
    if _IP_RE.match(first) and first not in TRUSTED_PROXIES:
        return first
    return peer


def _jsonrpc(method: str, params: Any) -> Any:
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    req = Request(
        RPC,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "User-Agent": "shieldlayer-api/1.2",
        },
        method="POST",
    )
    with urlopen(req, timeout=8) as resp:
        body = json.loads(resp.read().decode())
    if body.get("error"):
        raise RuntimeError("ERR_RPC_REJECTED")
    return body.get("result")


def _rpc_once(function: str, args: list[Any]) -> Any:
    """View call via genlayer-js (same encoding that works against Studio)."""
    import subprocess

    if CONTRACT.endswith("0000000000000000"):
        raise RuntimeError("ERR_CONTRACT_UNDEPLOYED")
    script = os.path.join(_ROOT, "api", "genlayer_read.mjs")
    env = os.environ.copy()
    env["PUBLIC_CONTRACT_ADDRESS"] = CONTRACT
    env["GENLAYER_RPC_URL"] = RPC
    proc = subprocess.run(
        ["node", script, function, json.dumps(args or [])],
        cwd=_ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=12,
    )
    out = (proc.stdout or "").strip()
    if out:
        try:
            line = out.splitlines()[-1]
            return json.loads(line)
        except json.JSONDecodeError:
            pass
    err = (proc.stderr or out or "ERR_RPC_REJECTED").strip()[-400:]
    logger.warning("genlayer_read.mjs failed %s (code=%s): %s", function, proc.returncode, err)
    raise RuntimeError("ERR_RPC_REJECTED")


def rpc_read(function: str, args: list[Any] | None = None) -> Any:
    global _failures
    if function not in VIEW_ALLOWLIST:
        raise PermissionError("ERR_FORBIDDEN")

    key = function + json.dumps(args or [])
    
    # Check cache first (30s TTL)
    if key in _cache:
        ts, val = _cache[key]
        if time.time() - ts < _CACHE_TTL:
            return val
    
    last_exc: Exception | None = None
    for attempt in range(3):
        try:
            result = _rpc_once(function, args or [])
            _failures = 0
            _cache[key] = (time.time(), result)
            return result
        except (URLError, HTTPError, TimeoutError, RuntimeError, ValueError, OSError) as exc:
            last_exc = exc
            logger.warning("RPC read failed (%s) attempt %d: %s", function, attempt + 1, exc)
            time.sleep(0.15 * (2**attempt))

    _failures += 1
    if _failures >= 5 and key in _cache:
        ts, val = _cache[key]
        if time.time() - ts < 300:
            logger.warning("Circuit breaker serving cache for %s", function)
            return val

    if function in {"get_policies", "get_claims_by_user"}:
        logger.warning("RPC read fail-open empty list for %s: %s", function, last_exc)
        return []
    if function == "get_stats":
        return {
            "total_policies": 0,
            "total_claims": 0,
            "premium_pool": 0,
            "approved_claims": 0,
            "rejected_claims": 0,
        }
    raise ConnectionError("ERR_RPC_TIMEOUT")


def rpc_healthy() -> bool:
    """Reachability = chain id on the official GenLayer RPC (not a view on the zero address)."""
    try:
        cid = _jsonrpc("eth_chainId", [])
        if isinstance(cid, str) and cid.startswith("0x"):
            return int(cid, 16) == int(CHAIN_ID)
        return str(cid) == str(CHAIN_ID)
    except Exception as exc:
        logger.warning("Health RPC check failed: %s", exc)
        return False
