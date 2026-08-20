import sys
import time
from pathlib import Path

from fastapi.testclient import TestClient
from eth_account import Account
from eth_account.messages import encode_defunct

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from api.index import app
from api._signing import encode_write_message

client = TestClient(app)


def test_health_reports_chain():
    r = client.get("/api/health")
    assert r.status_code in (200, 503)
    body = r.json()
    assert body["chainId"] == "61999"
    assert body["localMode"] is False
    assert "redis" in body
    assert body["brand"] == "ShieldLayer"
    assert body["slogan"] == "Protection, On-Chain"
    assert "access-control-allow-origin" in {k.lower() for k in r.headers.keys()}


def test_stats_schema_or_timeout_code():
    r = client.get("/api/stats")
    assert r.status_code in (200, 503)
    body = r.json()
    if r.status_code == 200:
        for k in ("total_policies", "total_claims", "premium_pool"):
            assert k in body
    else:
        assert body["error"] == "ERR_RPC_TIMEOUT"


def test_policies_requires_address():
    r = client.get("/api/policies")
    assert r.status_code == 400
    assert r.json()["error"] == "ERR_ADDRESS_REQUIRED"


def test_policy_invalid_id():
    r = client.get("/api/policies/999999")
    assert r.status_code in (404, 200, 503)


def test_cors_headers():
    r = client.options("/api/health")
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin")


def test_invalid_json_post_400():
    r = client.post("/api/read", content="not-json", headers={"Content-Type": "application/json"})
    assert r.status_code == 400
    assert r.json()["error"] == "ERR_INVALID_PAYLOAD"


def test_rate_limit_headers():
    r = client.get("/api/stats")
    assert "x-ratelimit-limit" in {k.lower() for k in r.headers.keys()}


def test_read_missing_function():
    r = client.post("/api/read", json={"args": []})
    assert r.status_code == 400


def test_write_via_read_forbidden():
    r = client.post("/api/read", json={"function": "purchase_policy", "args": []})
    assert r.status_code == 403
    assert r.json()["error"] == "ERR_FORBIDDEN"


def test_claims_requires_address():
    r = client.get("/api/claims")
    assert r.status_code == 400


def test_claims_invalid_address():
    r = client.get("/api/claims?address=not-an-address")
    assert r.status_code == 400
    assert r.json()["error"] == "ERR_INVALID_ADDRESS"


def test_tx_rejects_unbound_message():
    acct = Account.create()
    msg = "not-the-canonical-payload"
    sig = acct.sign_message(encode_defunct(text=msg)).signature.hex()
    r = client.post(
        "/api/tx",
        json={
            "function": "purchase_policy",
            "args": ["storm", 1000, "{}"],
            "value": 25,
            "address": acct.address,
            "message": msg,
            "signature": sig,
            "nonce": str(int(time.time() * 1000)),
        },
    )
    assert r.status_code == 403
    assert r.json()["error"] == "ERR_MESSAGE_MISMATCH"


def test_tx_replay_rejected():
    acct = Account.create()
    nonce = str(int(time.time() * 1000))
    args = ["storm", 1000, '{"location":"MIA","date":"2026-09-12","wind_kmh":80}']
    msg = encode_write_message(
        function="purchase_policy",
        args=args,
        value="25",
        nonce=nonce,
        contract="0x0000000000000000000000000000000000000000",
    )
    sig = acct.sign_message(encode_defunct(text=msg)).signature.hex()
    payload = {
        "function": "purchase_policy",
        "args": args,
        "value": 25,
        "address": acct.address,
        "message": msg,
        "signature": sig,
        "nonce": nonce,
    }
    first = client.post("/api/tx", json=payload)
    assert first.status_code == 403
    assert first.json()["error"] == "ERR_RELAY_DISABLED"
    second = client.post("/api/tx", json=payload)
    assert second.status_code == 403
    assert second.json()["error"] == "ERR_REPLAY"


def test_tx_never_returns_internal_exception_text():
    r = client.post("/api/tx", json={"function": "purchase_policy"})
    assert r.status_code in (400, 403)
    assert "Traceback" not in r.text
    assert r.json()["error"].startswith("ERR_")
