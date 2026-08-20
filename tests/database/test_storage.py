import json
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from contract.main import Contract

OWNER = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"


def _seeded():
    c = Contract(initial_owner=OWNER)
    c._sender = lambda: OWNER  # type: ignore
    c._value = lambda: 1_000_000  # type: ignore
    c.fund_pool()
    c._value = lambda: 50_000  # type: ignore
    return c


def test_policy_crud_persists():
    c = _seeded()
    pid = c.purchase_policy(
        "storm", 1000, json.dumps({"location": "MIA", "date": "2026-09-12", "wind_kmh": 80})
    )
    assert c.get_policy(pid)["policy_id"] == pid


def test_claim_references_policy():
    c = _seeded()
    pid = c.purchase_policy(
        "storm", 1000, json.dumps({"location": "MIA", "date": "2026-09-12", "wind_kmh": 80})
    )
    cid = c.file_claim(pid)
    assert c.get_claim(cid)["policy_id"] == pid


def test_concurrent_writes():
    c = _seeded()
    errs = []

    def buy(i):
        try:
            c.purchase_policy(
                "flight_delay",
                100,
                json.dumps({"flight": f"BA{i+1}", "date": "2026-08-01", "hours": 3}),
            )
        except Exception as e:
            errs.append(e)

    threads = [threading.Thread(target=buy, args=(i,)) for i in range(8)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert c.get_stats()["total_policies"] == 8
    assert not errs


def test_migration_simulation():
    c = Contract(initial_owner=OWNER)
    c.total_policies = 1
    assert c.get_stats()["total_policies"] == 1
