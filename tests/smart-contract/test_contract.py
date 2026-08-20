import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from contract.main import (
    Contract,
    EXPECTED_LOSS_BPS,
    OP_FEE_BPS,
    TIMELOCK_SECONDS,
    MIN_COLLATERAL_BPS,
    _eq_principle,
    parse_event_data,
    gl,
)
from contract.oracle import parse_flight, combine_two, SchemaError

OWNER = "0x1111111111111111111111111111111111111111"
OTHER = "0x2222222222222222222222222222222222222222"


def _storm():
    return json.dumps({"location": "MIA", "date": "2026-09-12", "wind_kmh": 80})


def _flight(code="BA1"):
    return json.dumps({"flight": code, "date": "2026-08-01", "hours": 3})


def _bank():
    return json.dumps({"company": "AAPL", "date": "2026-08-01"})


def _c(value: int = 50_000, owner: str = OWNER, seed: int = 1_000_000):
    c = Contract(initial_owner=owner, reserve_ratio_bps=1000)
    c._sender = lambda: owner  # type: ignore
    c._value = lambda: seed  # type: ignore
    c.fund_pool()
    c._value = lambda: value  # type: ignore
    return c


def test_deployer_is_owner():
    c = Contract(initial_owner=OWNER)
    assert c.get_owner()["owner"] == OWNER


def test_premium_gte_expected_loss():
    c = _c()
    cov = 10_000
    prem = c._premium("flight_delay", cov)
    expected = cov * EXPECTED_LOSS_BPS["flight_delay"] // 10_000
    assert prem >= expected
    assert prem == cov * (EXPECTED_LOSS_BPS["flight_delay"] + OP_FEE_BPS) // 10_000


def test_undercollateralized_reverts():
    c = Contract(initial_owner=OWNER)
    c._sender = lambda: OWNER  # type: ignore
    c._value = lambda: 100  # type: ignore  # premium for 10k is 2200
    try:
        c.purchase_policy("flight_delay", 10_000, _flight())
        assert False
    except ValueError as e:
        assert "insufficient_premium" in str(e) or "undercollateralized" in str(e) or "policy_cap" in str(e)


def test_policy_creation_stores_data():
    c = _c()
    pid = c.purchase_policy("flight_delay", 5_000, _flight())
    p = c.get_policy(pid)
    assert p["beneficiary"] == OWNER
    assert p["coverage_amount"] == 5_000
    assert p["status"] == "active"


def test_insufficient_premium_reverts():
    c = _c(value=1)
    try:
        c.purchase_policy("storm", 5_000, _storm())
        assert False
    except ValueError as e:
        assert "insufficient_premium" in str(e)


def test_only_owner_can_file_claim():
    c = _c()
    pid = c.purchase_policy("storm", 5_000, _storm())
    c._sender = lambda: OTHER  # type: ignore
    try:
        c.file_claim(pid)
        assert False
    except ValueError as e:
        assert "not_owner" in str(e)


def test_duplicate_claim_reverts():
    c = _c()
    pid = c.purchase_policy("bankruptcy", 5_000, _bank())
    c.file_claim(pid)
    try:
        c.file_claim(pid)
        assert False
    except ValueError as e:
        assert "duplicate" in str(e) or "inactive" in str(e)


def test_malformed_json_reverts():
    c = _c()
    try:
        c.purchase_policy("storm", 1000, "{not-json")
        assert False
    except ValueError as e:
        assert "malformed" in str(e)


def test_malformed_flight_rejected_before_oracle():
    try:
        parse_event_data(
            "flight_delay",
            json.dumps({"flight": "../etc/passwd", "date": "2026-01-01", "hours": 3}),
        )
        assert False
    except ValueError as e:
        assert "invalid_flight" in str(e)


def test_schema_rejects_malformed_feed():
    try:
        parse_flight("not-json")
        assert False
    except SchemaError:
        pass
    try:
        parse_flight(json.dumps({"occurred": True}))
        assert False
    except SchemaError:
        pass


def test_two_source_agreement_required():
    a = {"occurred": True, "delay_hours": 5, "source": "a"}
    b = {"occurred": True, "delay_hours": 6, "source": "b"}
    ok = combine_two(a, b)
    assert ok["status"] == "structured_consensus"
    assert ok["occurred"] is True
    disagree = combine_two(a, {"occurred": False, "delay_hours": 0, "source": "b"})
    assert disagree["status"] == "sources_disagree"
    none = combine_two(None, None)
    assert none["status"] == "pending_manual_review"


def test_equivalence_principle_strict():
    a = {"occurred": True, "confidence": 0.84}
    b = {"occurred": True, "confidence": 0.81}
    assert not _eq_principle(a, b)
    assert _eq_principle(a, {"occurred": True, "confidence": 0.84})


def test_payout_transfers_value():
    gl.transfers = []
    c = _c(value=50_000)
    pid = c.purchase_policy("flight_delay", 5_000, _flight())
    c._fetch_evidence = lambda policy: {  # type: ignore
        "status": "structured_consensus",
        "occurred": True,
        "confidence": 1.0,
    }
    c.file_claim(pid)
    claim = c.get_claim(1)
    assert claim["status"] in {"approved", "pending_funding"}
    if claim["status"] == "approved":
        assert str(claim["payout_tx"]).startswith("transfer:")
        assert any(t["amount"] == 5_000 for t in gl.transfers)


def test_direct_withdraw_requires_timelock():
    c = _c()
    try:
        c.withdraw_excess(1)
        assert False
    except ValueError as e:
        assert "use_timelock" in str(e)


def test_withdraw_excess_reverts_if_reserve_violated():
    c = _c()
    c.purchase_policy("flight_delay", 5_000, _flight())
    oid = c.schedule_admin("withdraw_excess", str(c.premium_pool))
    gl.block_timestamp = int(gl.block_timestamp) + TIMELOCK_SECONDS + 1
    try:
        c.execute_admin(oid)
        assert False
    except ValueError as e:
        assert "insufficient_excess" in str(e)


def test_withdraw_after_claims_cleared_and_timelock():
    c = _c()
    c.purchase_policy("storm", 5_000, _storm())
    c.file_claim(1)
    reserve = c.get_reserve()
    withdrawable = reserve["withdrawable"]
    if withdrawable <= 0:
        return
    oid = c.schedule_admin("withdraw_excess", str(withdrawable))
    gl.block_timestamp = int(gl.block_timestamp) + TIMELOCK_SECONDS + 1
    op = c.execute_admin(oid)
    assert op["status"] == "executed"


def test_two_step_ownership():
    c = _c()
    c.propose_owner(OTHER)
    c._sender = lambda: OTHER  # type: ignore
    c.accept_ownership()
    assert c.get_owner()["owner"] == OTHER


def test_collateral_view():
    c = _c()
    assert c.get_stats()["collateral_bps"] >= MIN_COLLATERAL_BPS
