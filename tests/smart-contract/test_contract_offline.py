"""Offline pytest harness for the ShieldLayer contract.

Uses a minimal in-memory ``genlayer`` stub so the full contract module can
be imported and exercised without a GenLayer node. Temi review fixes:
  #1 temporal validation (no purchase after covered event)
  #2 validator consensus on ALL payout-driving values (incl. confidence)
  #3 dual-source independent verification wired into settlement
"""

import importlib
import json
import sys
import types
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# Install the stub BEFORE importing contract.main
_stub = importlib.import_module("tests.genlayer_stub") if (
    ROOT / "tests" / "__init__.py"
).exists() else None
if _stub is None:
    sys.path.insert(0, str(ROOT / "tests"))
    _stub = importlib.import_module("genlayer_stub")

sys.modules["genlayer"] = _stub

main = importlib.import_module("contract.main")
gl = main.gl

OWNER = "0x1111111111111111111111111111111111111111"
USER = "0x2222222222222222222222222222222222222222"


def future_date(days=7):
    return (datetime.now(timezone.utc) + timedelta(days=days)).strftime("%Y-%m-%d")


def past_date(days=1):
    return (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")


def storm_data(date=None, wind=80):
    return json.dumps({"location": "MIA", "date": date or future_date(), "wind_kmh": wind})


def flight_data(date=None):
    return json.dumps({"flight": "BA249", "date": date or future_date(), "hours": 3})


class Ctx:
    """Per-test execution context: sender + msg.value."""

    def __init__(self, sender=USER, value=0):
        self.sender = sender
        self.value = value

    def __enter__(self):
        gl.message.sender_address = main.Address(self.sender)
        gl.message.value = self.value
        return self

    def __exit__(self, *exc):
        gl.message.sender_address = main.Address()
        gl.message.value = 0


@pytest.fixture
def contract():
    c = main.ShieldLayer(initial_owner=OWNER, reserve_ratio_bps=1000)
    # Offline: keep a plain-int "balance" that tracks credited funds
    c._sync_balance_accounting = lambda: setattr(
        c, "balance", int(c.premium_pool) + int(c.treasury_balance)
    )
    c._native_send = lambda to_hex, amount: int(amount) > 0
    c._sync_balance_accounting()
    with Ctx(OWNER, 10_000_000):
        c.fund_pool()
    return c


def _advance_past_event(contract, pid, monkeypatch):
    """Monkeypatch _now() to just after the policy event start."""
    key = main._id_key(pid)
    rec = json.loads(contract.policies[key])
    start = main._event_start_ts(json.loads(rec["event_data"])["date"])
    monkeypatch.setattr(main, "_now", lambda: start + 3600)


def purchase(c, ptype="storm", coverage=1000, data=None, value=None, sender=USER):
    premium = c._calculate_premium(ptype, coverage)
    with Ctx(sender, premium if value is None else value):
        return c.purchase_policy(ptype, coverage, data or storm_data())


# ---------------------------------------------------------------------------
# Temi Fix #1 — temporal validation
# ---------------------------------------------------------------------------
def test_cannot_purchase_after_event(contract):
    with pytest.raises(Exception, match="event_already_started"):
        purchase(contract, "storm", 1000, storm_data(past_date()), value=220)


def test_cannot_purchase_event_starting_now(contract):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    with pytest.raises(Exception, match="event_already_started"):
        purchase(contract, "storm", 1000, storm_data(today), value=220)


def test_can_purchase_future_event(contract):
    pid = purchase(contract)
    assert pid > 0
    policy = contract.get_policy(pid)
    assert policy["status"] == "active"


# ---------------------------------------------------------------------------
# Temi Fix #2 — validator consensus on confidence
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Dual-source helpers (Temi Fix #3 building blocks)
# ---------------------------------------------------------------------------
def test_dual_source_agreement_takes_min_confidence():
    a = {"status": "structured_consensus", "occurred": True, "confidence": 90}
    b = {"status": "structured_consensus", "occurred": True, "confidence": 70}
    out = main._dual_source(a, b)
    assert out["occurred"] is True
    assert out["confidence"] == 70
    assert out["sources_agreed"] is True


def test_dual_source_disagreement_goes_manual_review():
    a = {"status": "structured_consensus", "occurred": True, "confidence": 90}
    b = {"status": "structured_consensus", "occurred": False, "confidence": 100}
    out = main._dual_source(a, b)
    assert out["status"] == "pending_manual_review"


def test_dual_source_failure_goes_manual_review():
    a = dict(main.MANUAL_REVIEW)
    b = {"status": "structured_consensus", "occurred": True, "confidence": 80}
    assert main._dual_source(a, b)["status"] == "pending_manual_review"
    assert main._dual_source(b, dict(main.ORACLE_ERROR))["status"] == "pending_manual_review"


def test_eval_flight_from_json_delayed():
    params = {"hours": 3}
    data = {"data": [{"departure": {"delay": 240}}]}
    out = main._eval_flight_from_json(params, data)
    assert out["occurred"] is True
    assert out["delay_minutes"] == 240


def test_eval_flight_from_json_not_delayed():
    params = {"hours": 3}
    data = {"data": [{"departure": {"delay": 30}}]}
    out = main._eval_flight_from_json(params, data)
    assert out["occurred"] is False


def test_eval_flight_from_json_empty_is_manual_review():
    assert main._eval_flight_from_json({"hours": 3}, {"data": []})["status"] == (
        "pending_manual_review"
    )
    assert main._eval_flight_from_json({"hours": 3}, {})["status"] == "pending_manual_review"


def test_eval_bankruptcy_edgar_hit_and_miss():
    hit = {"hits": {"total": {"value": 5}, "hits": [{"_source": {"display_names": "Apple Inc. (AAPL)"}}]}}
    out = main._eval_bankruptcy_from_edgar({"company": "AAPL"}, hit)
    assert out["occurred"] is True
    miss = {"hits": {"total": {"value": 0}, "hits": []}}
    out = main._eval_bankruptcy_from_edgar({"company": "AAPL"}, miss)
    assert out["occurred"] is False


# ---------------------------------------------------------------------------
# Lifecycle / economics
# ---------------------------------------------------------------------------
def test_insufficient_premium(contract):
    with pytest.raises(Exception, match="insufficient_premium"):
        purchase(contract, value=10)


def test_policy_cap_exceeded(contract):
    pool = int(contract.premium_pool)
    max_cov = pool * main.POLICY_CAP_BPS // 10000
    with pytest.raises(Exception, match="policy_cap_exceeded"):
        purchase(contract, coverage=max_cov * 2 + 1)


def test_duplicate_claim_prevented(contract, monkeypatch):
    monkeypatch.setattr(
        main, "fetch_evidence",
        lambda snap: {
            "status": "pending_manual_review",
            "occurred": False,
            "confidence": 0,
        },
    )
    pid = purchase(contract)
    key = main._id_key(pid)
    rec = json.loads(contract.policies[key])
    start = main._event_start_ts(json.loads(rec["event_data"])["date"])
    monkeypatch.setattr(main, "_now", lambda: start + 3600)
    with Ctx(USER):
        first = contract.file_claim(pid)  # -> pending_manual_review
        assert contract.get_policy(pid)["status"] == "pending_manual_review"
        # Policy status check comes before duplicate-claim guard; verify the
        # claim_id is set, which is the actual duplicate protection.
        assert contract.get_policy(pid)["claim_id"] == first
        # Re-filing while status is active again (simulating reactivation)
        # must still hit duplicate_claim because claim_id is recorded.
        rec = json.loads(contract.policies[key])
        rec["status"] = "active"
        contract.policies[key] = json.dumps(rec)
        with pytest.raises(Exception, match="duplicate_claim"):
            contract.file_claim(pid)


def test_full_lifecycle(contract, monkeypatch):
    # offline stub: emulate successful native transfer
    monkeypatch.setattr(
        main.ShieldLayer, "_native_send", lambda self, to_hex, amount: True
    )
    monkeypatch.setattr(
        main, "fetch_evidence",
        lambda snap: {
            "status": "dual_source_consensus",
            "occurred": True,
            "confidence": 85,
            "sources_agreed": True,
        },
    )
    pid = purchase(contract, coverage=500)
    policy = contract.get_policy(pid)
    assert policy["policy_id"] == pid
    assert policy["status"] == "active"

    # claim before event start must fail
    with Ctx(USER):
        with pytest.raises(Exception, match="claim_too_early"):
            contract.file_claim(pid)

    # simulate event passing
    _advance_past_event(contract, pid, monkeypatch)

    with Ctx(USER):
        cid = contract.file_claim(pid)
    claim = contract.get_claim(cid)
    assert claim["claim_id"] == cid
    assert claim["status"] == "approved"
    assert claim["payout"] == 500
    assert contract.get_stats()["approved_claims"] >= 1
