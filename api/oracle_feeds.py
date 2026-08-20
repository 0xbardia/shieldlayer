"""Live public feeds. No vendor signup for NOAA or SEC EDGAR."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

NOAA_UA = os.environ.get("NOAA_USER_AGENT", "shieldlayer-insurance (ops@localhost)")
SEC_UA = os.environ.get("SEC_USER_AGENT", "shieldlayer-insurance ops@localhost")


def _get(url: str, headers: dict[str, str], timeout: int = 12) -> tuple[int, Any]:
    req = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            code = resp.status
    except urllib.error.HTTPError as exc:
        return exc.code, {"error": str(exc.reason)}
    try:
        return code, json.loads(raw)
    except json.JSONDecodeError:
        return code, {"error": "not_json", "raw": raw[:200]}


def noaa_point(lat: float = 25.7617, lon: float = -80.1918) -> dict:
    url = f"https://api.weather.gov/points/{lat},{lon}"
    code, body = _get(
        url,
        {"User-Agent": NOAA_UA, "Accept": "application/geo+json"},
    )
    props = body.get("properties") if isinstance(body, dict) else None
    ok = code == 200 and isinstance(props, dict) and "forecast" in props
    return {
        "source": "noaa",
        "http": code,
        "ok": ok,
        "forecast": props.get("forecast") if ok else None,
        "gridId": props.get("gridId") if ok else None,
    }


def sec_search(query: str = "Apple Inc", cik: str = "0000320193") -> dict:
    url = (
        "https://efts.sec.gov/LATEST/search-index"
        f"?q={urllib.parse.quote(query)}&ciks={cik}&dateRange=all"
    )
    code, body = _get(url, {"User-Agent": SEC_UA, "Accept": "application/json"})
    hits = 0
    if isinstance(body, dict):
        hits = int(((body.get("hits") or {}).get("total") or {}).get("value") or 0)
    return {
        "source": "sec_edgar",
        "http": code,
        "ok": code == 200 and hits >= 0 and isinstance(body, dict) and "hits" in body,
        "hits": hits,
        "cik": cik,
    }


def aviationstack_status() -> dict:
    key = os.environ.get("AVIATIONSTACK_API_KEY", "").strip()
    if not key:
        return {
            "source": "aviationstack",
            "ok": False,
            "http": 0,
            "error": "AVIATIONSTACK_API_KEY unset (free tier requires signup)",
        }
    url = f"http://api.aviationstack.com/v1/flights?access_key={key}&flight_iata=BA249&limit=1"
    code, body = _get(url, {"Accept": "application/json"})
    return {"source": "aviationstack", "http": code, "ok": code == 200, "sample_keys": list(body)[:8] if isinstance(body, dict) else []}
