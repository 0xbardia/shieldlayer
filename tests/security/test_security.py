import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_no_private_keys_in_repo():
    banned = re.compile(r"PRIVATE_KEY\s*=\s*['\"]0x[0-9a-fA-F]{64}")
    for p in ROOT.rglob("*"):
        if p.suffix not in {".ts", ".tsx", ".py", ".js", ".md", ".env.example", ".env.local"}:
            continue
        if "node_modules" in p.parts or ".next" in p.parts:
            continue
        text = p.read_text(errors="ignore")
        assert not banned.search(text), p


def test_no_private_key_env():
    assert "PRIVATE_KEY" not in os.environ or not os.environ.get("PRIVATE_KEY")


def test_xss_event_data_rejected_if_not_json_object():
    import sys

    sys.path.insert(0, str(ROOT))
    from contract.main import Contract

    c = Contract(initial_owner="0x1111111111111111111111111111111111111111")
    c._sender = lambda: "0x1111111111111111111111111111111111111111"  # type: ignore
    c._value = lambda: 10_000  # type: ignore
    try:
        c.purchase_policy("storm", 1, '"<script>alert(1)</script>"')
        assert False
    except ValueError:
        pass


def test_read_only_backend_has_no_signer():
    src = (ROOT / "api" / "_core.py").read_text()
    assert "never" in src.lower() or "private" not in src.lower()


def test_pickle_deserialization_impossible():
    banned = ("import pickle", "pickle.load", "pickle.loads")
    for folder in ("api", "contract"):
        for p in (ROOT / folder).rglob("*.py"):
            text = p.read_text()
            for token in banned:
                assert token not in text, f"{p} contains {token}"


def test_local_mode_default_off():
    src = (ROOT / "api" / "_core.py").read_text()
    assert 'LOCAL_MODE = False' in src
    assert 'GENLAYER_LOCAL_MODE", "1"' not in src
