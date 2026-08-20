import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from api.oracle_feeds import aviationstack_status, noaa_point, sec_search


def test_noaa_live_schema():
    out = noaa_point()
    assert out["source"] == "noaa"
    assert out["http"] == 200
    assert out["ok"] is True
    assert out["forecast"] and out["forecast"].startswith("https://api.weather.gov/")


def test_sec_live_schema():
    out = sec_search()
    assert out["source"] == "sec_edgar"
    assert out["http"] == 200
    assert out["ok"] is True
    assert out["hits"] >= 0


def test_aviationstack_without_key_is_explicit():
    out = aviationstack_status()
    assert out["ok"] is False
    assert "AVIATIONSTACK" in out.get("error", "")
