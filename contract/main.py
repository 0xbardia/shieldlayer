# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""
ShieldLayer — Decentralized Parametric Insurance on GenLayer.

This module implements a GenLayer Intelligent Contract that provides automated
parametric insurance for flight delays, storms, and corporate bankruptcy events.

Architecture:
    - Policies are purchased on-chain with native token premiums
    - A policy cannot be purchased on or after the covered event's UTC date
    - Claims trigger oracle consensus via GenLayer's ``run_nondet_unsafe``
    - Two independent oracle sources must agree before any automatic payout
    - Validators must match every payout-driving field, including confidence
    - Approved claims pay out directly from the premium pool

Security Model:
    - No private keys are stored; all writes are signed by users in the browser
    - Reserve ratio enforcement prevents undercollateralization
    - Timelock on ownership transfer prevents instant rug pulls
    - Exposure caps (per-policy, per-type, per-user) limit protocol risk
"""

from genlayer import *

from datetime import datetime, timezone
import json
import re
import typing


POLICY_TYPES = ("flight_delay", "storm", "bankruptcy")

EXPECTED_LOSS_BPS = {
    "flight_delay": 2000,
    "storm": 1500,
    "bankruptcy": 1000,
}
OP_FEE_BPS = 200
TREASURY_FEE_BPS = 500

POLICY_CAP_BPS = 100
USER_CAP_BPS = 500
TYPE_CAP_BPS = 3000
MIN_COLLATERAL_BPS = 10000

SAFETY_RESERVE_FLAT = 100
TIMELOCK_SECONDS = 86400
CLAIM_WINDOW_SECONDS = 30 * 86400
CONFIDENCE_THRESHOLD = 70
PAYOUT_LOG_CAP = 32

FLIGHT_RE = re.compile(r"^[A-Z]{2,3}[0-9]{1,4}[A-Z]?$")
ISO3166_RE = re.compile(r"^[A-Z]{2}(-[A-Z0-9]{1,3})?$")
IATA_LOCATIONS = frozenset(
    {"MIA", "NYC", "LON", "TYO", "BER", "PAR", "DXB", "SIN", "LAX", "CHI"}
)
IATA_COORDS = {
    "MIA": (25.7959, -80.2870),
    "NYC": (40.6413, -73.7781),
    "LON": (51.4700, -0.4543),
    "TYO": (35.5494, 139.7798),
    "BER": (52.3667, 13.5033),
    "PAR": (49.0097, 2.5479),
    "DXB": (25.2532, 55.3657),
    "SIN": (1.3644, 103.9915),
    "LAX": (33.9425, -118.4081),
    "CHI": (41.9742, -87.9073),
}
ALLOWED_COMPANIES = frozenset(
    {"AAPL", "MSFT", "GOOG", "AMZN", "META", "TSLA", "NVDA", "JPM", "XOM", "BAC"}
)

ORACLE_PREFIX = {
    "flight_delay": "https://www.flightradar24.com/data/flights/",
    "flight_json": "https://api.aviationstack.com/v1/flights",
    "storm_archive": "https://archive-api.open-meteo.com/v1/archive",
    "storm_forecast": "https://historical-forecast-api.open-meteo.com/v1/forecast",
    "storm_geo": "https://geocoding-api.open-meteo.com/v1/search",
    "bankruptcy": "https://news.google.com/rss/search?q=",
    "sec_edgar": "https://efts.sec.gov/LATEST/search-index?q=",
}

ZERO_HEX = "0x0000000000000000000000000000000000000000"

ORACLE_ERROR = {
    "status": "oracle_error",
    "occurred": False,
    "confidence": 0,
    "sources_agreed": False,
}

MANUAL_REVIEW = {
    "status": "pending_manual_review",
    "occurred": False,
    "confidence": 0,
    "sources_agreed": False,
    "reason": "no_valid_oracle_response",
}

PAYOUT_STATUS_AUTO = "dual_source_consensus"
PAYOUT_FIELDS = ("status", "occurred", "confidence", "sources_agreed")

ADMIN_ACTIONS = (
    "withdraw_excess",
    "withdraw_treasury",
    "retry_payout",
    "resolve_claim",
)


@gl.evm.contract_interface
class _NativeRecipient:
    class View:
        pass

    class Write:
        pass


def _err(msg: str):
    user_err = getattr(getattr(gl, "vm", None), "UserError", None)
    if callable(user_err):
        raise user_err(msg)
    raise Exception(msg)


def _hex(value) -> str:
    """Normalize any address-like value to lowercase 0x-prefixed 40-hex."""
    if value is None:
        return ZERO_HEX
    raw = ""
    try:
        if hasattr(value, "as_hex"):
            ah = value.as_hex
            raw = ah() if callable(ah) else ah
        else:
            raw = value
        text = str(raw).strip().lower()
    except Exception:
        return ZERO_HEX
    if text.startswith("0x"):
        text = text[2:]
    cleaned = []
    for ch in text:
        if ch in "0123456789abcdef":
            cleaned.append(ch)
    text = "".join(cleaned)
    if not text:
        return ZERO_HEX
    if len(text) < 40:
        text = text.zfill(40)
    elif len(text) > 40:
        text = text[-40:]
    return "0x" + text


def _addr_hex(value) -> str:
    """Parse a user-supplied address without throwing."""
    if value is None:
        return ZERO_HEX
    try:
        text = str(value).strip()
    except Exception:
        return ZERO_HEX
    if not text or text.lower() in ("none", "null", "undefined"):
        return ZERO_HEX
    try:
        if hasattr(value, "as_hex"):
            return _hex(value)
        if not text.lower().startswith("0x"):
            text = "0x" + text
        return _hex(Address(text))
    except Exception:
        return ZERO_HEX


def _id_key(value) -> str:
    try:
        return str(int(value))
    except Exception:
        return "0"


def _safe_int(raw, default=0) -> int:
    try:
        return int(str(raw).strip())
    except Exception:
        return default


def _json_safe(obj) -> typing.Any:
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, int):
        return int(obj)
    if isinstance(obj, float):
        return int(round(obj))
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            out[str(k)] = _json_safe(v)
        return out
    if isinstance(obj, (list, tuple)):
        return [_json_safe(x) for x in obj]
    if obj is None:
        return None
    return str(obj)[:280]


def _view_safe(obj) -> typing.Any:
    """Calldata-safe view payload: never return None (Studio encoding crash)."""
    if obj is None:
        return ""
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, int):
        return int(obj)
    if isinstance(obj, float):
        return int(round(obj))
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            out[str(k)] = _view_safe(v)
        return out
    if isinstance(obj, (list, tuple)):
        return [_view_safe(x) for x in obj]
    return str(obj)[:280]


def _as_bool(raw, default=False) -> bool:
    if isinstance(raw, bool):
        return raw
    if isinstance(raw, (int, float)):
        return raw != 0
    text = str(raw).strip().lower()
    if text in ("true", "yes", "1"):
        return True
    if text in ("false", "no", "0", "", "none", "null"):
        return False
    return default


def _now() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def _event_start_ts(date_str: str) -> int:
    year, month, day = [int(part) for part in str(date_str).split("-")]
    return int(datetime(year, month, day, tzinfo=timezone.utc).timestamp())


def _event_already_started(date_str: str, now_ts: int = None) -> bool:
    """True once the covered event's UTC calendar day has begun.

    Policies cannot be purchased at or after this instant.
    """
    start = _event_start_ts(date_str)
    ts = _now() if now_ts is None else int(now_ts)
    return ts >= start


def _payout_values(result) -> dict:
    """Canonical payout-driving fields shared by validators and settlement.

    Auto-payout reads exactly these keys. Validators must agree on all of them,
    including confidence, before any claim can be paid.
    """
    if not isinstance(result, dict) or not result:
        result = dict(MANUAL_REVIEW)
    status = str(result.get("status") or "pending_manual_review")
    occurred = _as_bool(result.get("occurred"))
    try:
        confidence = int(round(float(result.get("confidence", 0) or 0)))
    except Exception:
        confidence = 0
    if confidence < 0:
        confidence = 0
    if confidence > 100:
        confidence = 100
    sources_agreed = _as_bool(result.get("sources_agreed"))
    if status in ("pending_manual_review", "oracle_error"):
        occurred = False
        confidence = 0
        sources_agreed = False
    return {
        "status": status,
        "occurred": bool(occurred),
        "confidence": int(confidence),
        "sources_agreed": bool(sources_agreed),
    }


def _canonicalize_verification(raw) -> dict:
    """Freeze payout fields so settlement cannot mutate values after consensus."""
    if not isinstance(raw, dict) or not raw:
        raw = dict(MANUAL_REVIEW)
    out = _json_safe(raw)
    if not isinstance(out, dict):
        out = dict(MANUAL_REVIEW)
    out.update(_payout_values(raw))
    return out


def _validators_agree(leader_result, validator_result) -> bool:
    """True iff both nodes agree on every payout-driving value."""
    return _payout_values(leader_result) == _payout_values(validator_result)


def _can_auto_payout(values: dict) -> bool:
    """Settlement gate: independent sources agreed and consensus status is auto."""
    if not isinstance(values, dict):
        return False
    return (
        values.get("status") == PAYOUT_STATUS_AUTO
        and values.get("sources_agreed") is True
        and _as_bool(values.get("occurred"))
        and _safe_int(values.get("confidence"), 0) >= CONFIDENCE_THRESHOLD
    )


def _response_to_text(raw) -> str:
    if raw is None:
        return ""
    if isinstance(raw, str):
        return raw[:8000]
    if isinstance(raw, (bytes, bytearray)):
        try:
            return bytes(raw)[:8000].decode("utf-8", "replace")
        except Exception:
            return ""
    body = getattr(raw, "body", None)
    if isinstance(body, (bytes, bytearray)):
        try:
            return bytes(body)[:8000].decode("utf-8", "replace")
        except Exception:
            return ""
    if isinstance(body, str):
        return body[:8000]
    return str(raw)[:8000]


def _response_status(raw) -> int:
    code = getattr(raw, "status_code", None)
    if code is None:
        code = getattr(raw, "status", None)
    return _safe_int(code, 0)


def _safe_json_parse(raw) -> dict:
    try:
        text = _response_to_text(raw)
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {}


def _prompt_json(prompt: str) -> dict:
    raw = gl.nondet.exec_prompt(prompt, response_format="json")
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            data = json.loads(raw)
            if isinstance(data, dict):
                return data
        except Exception:
            return {}
    return {}


def _map_get(store, key, default=None):
    """Read a TreeMap value without relying on `in` or KeyError shape."""
    try:
        getter = getattr(store, "get", None)
        if callable(getter):
            return getter(key, default)
    except Exception:
        pass
    try:
        contains = getattr(store, "contains", None)
        if callable(contains) and not contains(key):
            return default
        return store[key]
    except Exception:
        return default


def parse_event_data(policy_type, event_data) -> dict:
    """Parse and validate event data for a given policy type.

    Args:
        policy_type: One of 'flight_delay', 'storm', or 'bankruptcy'.
        event_data: JSON string containing event-specific parameters.

    Returns:
        dict with validated and normalized event parameters.

    Raises:
        Exception: If policy_type is invalid, event_data is malformed,
            or required fields are missing/out of range.
    """
    if policy_type not in POLICY_TYPES:
        _err("invalid_policy_type")
    try:
        params = json.loads(event_data) if event_data else {}
    except Exception:
        _err("malformed_event_data")
    if not isinstance(params, dict):
        _err("malformed_event_data")
    allowed_fields = {"flight", "date", "hours", "location", "wind_kmh", "company"}
    extra = set(params.keys()) - allowed_fields
    if extra:
        _err("unexpected_event_field")
    date = str(params.get("date", ""))
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        _err("invalid_date_format")
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except Exception:
        _err("invalid_date_format")
    if policy_type == "flight_delay":
        flight = str(params.get("flight", "")).upper()
        if not FLIGHT_RE.match(flight):
            _err("invalid_flight_number")
        try:
            hours = int(params.get("hours", 3))
        except Exception:
            _err("invalid_hours_range")
        if hours < 1 or hours > 48:
            _err("invalid_hours_range")
        return {"flight": flight, "date": date, "hours": hours}
    if policy_type == "storm":
        loc = str(params.get("location", "")).upper()
        if loc not in IATA_LOCATIONS and not ISO3166_RE.match(loc):
            _err("invalid_location")
        try:
            wind = int(params.get("wind_kmh", 80))
        except Exception:
            _err("invalid_wind_speed")
        if wind < 40 or wind > 300:
            _err("invalid_wind_speed")
        return {"location": loc, "date": date, "wind_kmh": wind}
    company = str(params.get("company", "")).upper()
    if company not in ALLOWED_COMPANIES:
        _err("company_not_allowed")
    return {"company": company, "date": date}


def _prefix_ok(url: str) -> bool:
    if not url:
        return False
    for prefix in ORACLE_PREFIX.values():
        if url.startswith(prefix):
            return True
    return False


def _web_get(url: str):
    if not _prefix_ok(url):
        return None
    try:
        return gl.nondet.web.get(url)
    except Exception:
        return None


def _web_render(url: str) -> str:
    if not _prefix_ok(url):
        return ""
    try:
        return str(gl.nondet.web.render(url, mode="text") or "")[:8000]
    except Exception:
        return ""


def _geocode(location: str):
    if location in IATA_COORDS:
        return IATA_COORDS[location]
    url = ORACLE_PREFIX["storm_geo"] + "?name=" + location + "&count=1"
    parsed = _safe_json_parse(_web_get(url))
    results = parsed.get("results") if isinstance(parsed, dict) else None
    if not isinstance(results, list) or not results:
        return None
    first = results[0]
    try:
        return float(first["latitude"]), float(first["longitude"])
    except Exception:
        return None


def _eval_storm_coords(params: dict, coords, api_prefix: str) -> dict:
    """Evaluate storm wind at one independent weather endpoint.

    Single-source results never set sources_agreed; only _dual_source does.
    """
    if not coords or not api_prefix:
        return dict(MANUAL_REVIEW)
    lat, lon = coords
    date = str(params["date"])
    url = (
        api_prefix
        + "?latitude="
        + str(lat)
        + "&longitude="
        + str(lon)
        + "&start_date="
        + date
        + "&end_date="
        + date
        + "&daily=wind_speed_10m_max&wind_speed_unit=kmh"
    )
    parsed = _safe_json_parse(_web_get(url))
    daily = parsed.get("daily") if isinstance(parsed, dict) else None
    if not isinstance(daily, dict):
        return dict(MANUAL_REVIEW)
    speeds = daily.get("wind_speed_10m_max")
    if not isinstance(speeds, list) or not speeds:
        return dict(MANUAL_REVIEW)
    try:
        observed = int(round(float(speeds[0])))
    except Exception:
        return dict(MANUAL_REVIEW)
    threshold = int(params.get("wind_kmh", 80))
    occurred = observed >= threshold
    return {
        "status": "structured_consensus",
        "occurred": occurred,
        "confidence": 100,
        "observed_wind_kmh": observed,
        "sources_agreed": False,
    }


def _eval_storm(params: dict) -> dict:
    """Evaluate storm event using Open-Meteo Archive API.

    Geocodes the location, fetches historical wind data, and compares
    against the policy threshold. This is one independent source only.

    Args:
        params: Must contain 'location' (IATA code or ISO country) and
            'date' (YYYY-MM-DD) and 'wind_kmh' (threshold).

    Returns:
        dict with 'occurred' (bool), 'confidence', 'observed_wind_kmh'.
        Returns MANUAL_REVIEW if geocoding or API fails.
    """
    coords = _geocode(str(params.get("location", "")))
    if not coords:
        return dict(MANUAL_REVIEW)
    return _eval_storm_coords(params, coords, ORACLE_PREFIX["storm_archive"])


def _eval_with_llm(policy_type: str, params: dict, source_text: str) -> dict:
    """Use GenLayer's LLM nondeterministic execution to evaluate insurance events.

    Sends the source text and policy parameters to the LLM, which returns
    a structured JSON verdict with occurred/confidence/reason.

    Args:
        policy_type: The insurance product type.
        params: Validated event parameters from parse_event_data.
        source_text: Raw text scraped from oracle sources (max 4000 chars).

    Returns:
        dict with 'occurred' (bool), 'confidence' (0-100), 'reason' (str),
        and 'sources_agreed' (bool). Returns MANUAL_REVIEW on failure.
    """
    if not source_text.strip():
        return dict(MANUAL_REVIEW)
    prompt = (
        "You are verifying a parametric insurance event. "
        "Use only the provided source text. "
        "Return JSON with keys occurred (boolean), confidence (0 to 100 integer), reason (short string).\n"
        "Policy type: "
        + policy_type
        + "\nParameters: "
        + json.dumps(params, sort_keys=True)
        + "\nSource:\n"
        + source_text[:4000]
    )
    data = _prompt_json(prompt)
    if "occurred" not in data:
        return dict(MANUAL_REVIEW)
    try:
        confidence = int(round(float(data.get("confidence", 0) or 0)))
    except Exception:
        confidence = 0
    if confidence <= 1 and str(data.get("confidence", "")).find(".") >= 0:
        try:
            confidence = int(round(float(data.get("confidence")) * 100))
        except Exception:
            pass
    if confidence < 0:
        confidence = 0
    if confidence > 100:
        confidence = 100
    return {
        "status": "llm_consensus",
        "occurred": _as_bool(data.get("occurred")),
        "confidence": confidence,
        "reason": str(data.get("reason", ""))[:280],
        "sources_agreed": False,
    }


def _eval_flight_from_json(params: dict, data: dict) -> dict:
    """Parse AviationStack JSON response to determine delay.

    Args:
        params: Validated event parameters ('hours' threshold).
        data: Parsed JSON from the AviationStack API.

    Returns:
        dict with 'occurred', 'confidence', 'delay_minutes'.
        MANUAL_REVIEW when no usable flight record exists.
    """
    try:
        if not isinstance(data, dict) or not data:
            return dict(MANUAL_REVIEW)
        if data.get("error") or data.get("success") is False:
            return dict(MANUAL_REVIEW)
        flights = data.get("data", [])
        if not isinstance(flights, list) or not flights:
            return dict(MANUAL_REVIEW)
        flight = flights[0]
        if not isinstance(flight, dict):
            return dict(MANUAL_REVIEW)
        departure = flight.get("departure", {})
        if not isinstance(departure, dict):
            departure = {}
        delay = departure.get("delay", None)
        if delay is None:
            return dict(MANUAL_REVIEW)
        delay_minutes = int(str(delay).strip() or 0)
        threshold_hours = int(params.get("hours", 3))
        occurred = delay_minutes >= threshold_hours * 60
        return {
            "status": "structured_consensus",
            "occurred": occurred,
            "confidence": 100,
            "delay_minutes": max(0, delay_minutes),
            "sources_agreed": False,
        }
    except Exception:
        return dict(MANUAL_REVIEW)


def _eval_bankruptcy_from_edgar(params: dict, data: dict) -> dict:
    """Parse SEC EDGAR full-text search JSON for bankruptcy filings.

    Args:
        params: Validated event parameters ('company' ticker).
        data: Parsed JSON from the SEC EDGAR search API.

    Returns:
        dict with 'occurred', 'confidence'. MANUAL_REVIEW on any failure.
    """
    try:
        if not isinstance(data, dict) or not data:
            return dict(MANUAL_REVIEW)
        if data.get("error") or data.get("success") is False:
            return dict(MANUAL_REVIEW)
        hits = data.get("hits", {})
        if not isinstance(hits, dict):
            return dict(MANUAL_REVIEW)
        total_obj = hits.get("total", {})
        if isinstance(total_obj, dict):
            total = int(total_obj.get("value", 0) or 0)
        else:
            total = _safe_int(total_obj, 0)
        company = str(params.get("company", "")).upper()
        matched = 0
        for doc in hits.get("hits", []) or []:
            source = doc.get("_source", {}) if isinstance(doc, dict) else {}
            display = str(source.get("display_names", "") or "")
            if company in display.upper():
                matched += 1
        if total <= 0:
            return {
                "status": "structured_consensus",
                "occurred": False,
                "confidence": 60,
                "sources_agreed": False,
            }
        if matched > 0:
            return {
                "status": "structured_consensus",
                "occurred": True,
                "confidence": 90,
                "sources_agreed": False,
            }
        return dict(MANUAL_REVIEW)
    except Exception:
        return dict(MANUAL_REVIEW)


def _is_unusable(result: dict) -> bool:
    if not isinstance(result, dict) or not result:
        return True
    return result.get("status") in ("pending_manual_review", "oracle_error")


def _dual_source(result_a: dict, result_b: dict) -> dict:
    """Combine two independent oracle results; both must be valid and agree.

    A missing source no longer falls back to single-source payout. Settlement
    only auto-pays when this returns dual_source_consensus with sources_agreed.
    """
    a_bad = _is_unusable(result_a)
    b_bad = _is_unusable(result_b)
    if a_bad or b_bad:
        review = dict(MANUAL_REVIEW)
        review["reason"] = "missing_independent_source"
        return review
    try:
        conf_a = float(result_a.get("confidence", 0) or 0)
        conf_b = float(result_b.get("confidence", 0) or 0)
    except (TypeError, ValueError):
        review = dict(MANUAL_REVIEW)
        review["reason"] = "invalid_confidence"
        return review
    if _as_bool(result_a.get("occurred")) != _as_bool(result_b.get("occurred")):
        review = dict(MANUAL_REVIEW)
        review["reason"] = "sources_disagree"
        return review
    combined = dict(result_a)
    combined["occurred"] = _as_bool(result_a.get("occurred"))
    combined["confidence"] = int(min(conf_a, conf_b))
    combined["sources_agreed"] = True
    combined["status"] = PAYOUT_STATUS_AUTO
    return _canonicalize_verification(combined)


def fetch_evidence(policy) -> dict:
    """Fetch and verify insurance event evidence from two independent sources.

    Routes to the appropriate oracle pair based on policy type:
    - storm: Open-Meteo archive + Open-Meteo forecast
    - flight_delay: Flightradar24/LLM + AviationStack JSON
    - bankruptcy: Google News/LLM + SEC EDGAR

    Auto-payout requires both sources to be valid and to agree.
    """
    try:
        ptype = policy.get("policy_type")
        params = parse_event_data(ptype, policy.get("event_data") or "{}")
        if ptype == "storm":
            coords = _geocode(str(params.get("location", "")))
            if not coords:
                return dict(MANUAL_REVIEW)
            result1 = _eval_storm_coords(
                params, coords, ORACLE_PREFIX["storm_archive"]
            )
            result2 = _eval_storm_coords(
                params, coords, ORACLE_PREFIX["storm_forecast"]
            )
            return _canonicalize_verification(_dual_source(result1, result2))
        if ptype == "flight_delay":
            flight = str(params.get("flight", ""))
            if not FLIGHT_RE.match(flight):
                return dict(MANUAL_REVIEW)
            url = ORACLE_PREFIX["flight_delay"] + flight
            text = _web_render(url)
            if not text:
                raw = _web_get(url)
                if _response_status(raw) >= 400:
                    text = ""
                else:
                    text = _response_to_text(raw)
            url2 = (
                ORACLE_PREFIX["flight_json"]
                + "?flight_iata="
                + flight
                + "&date="
                + str(params.get("date", ""))
            )
            data2 = _safe_json_parse(_web_get(url2))
            result1 = _eval_with_llm(ptype, params, text)
            result2 = _eval_flight_from_json(params, data2)
            return _canonicalize_verification(_dual_source(result1, result2))
        company = str(params.get("company", ""))
        if company not in ALLOWED_COMPANIES:
            return dict(MANUAL_REVIEW)
        url = ORACLE_PREFIX["bankruptcy"] + company + "+bankruptcy"
        text = _web_render(url)
        if not text:
            text = _response_to_text(_web_get(url))
        result1 = _eval_with_llm(ptype, params, text)
        url2 = ORACLE_PREFIX["sec_edgar"] + "%22" + company + "%22+bankruptcy&forms=8-K,15"
        data2 = _safe_json_parse(_web_get(url2))
        result2 = _eval_bankruptcy_from_edgar(params, data2)
        return _canonicalize_verification(_dual_source(result1, result2))
    except Exception:
        return dict(MANUAL_REVIEW)


class ShieldLayer(gl.Contract):
    """Decentralized parametric insurance contract on GenLayer.

    Manages the full lifecycle of insurance policies: purchase, claim filing,
    oracle verification, and automated payout. Enforces reserve ratios,
    exposure caps, and timelock-protected admin operations.

    Storage:
        policies, claims, user_policies, user_claims: JSON-encoded TreeMap records
        premium_pool: Current balance available for payouts
        contract_balance: Mirror of on-chain native token balance
        treasury_balance: Accumulated protocol fees
        reserve_ratio_bps: Minimum collateral ratio (basis points, default 1000 = 10%)

    Security:
        - All writes require wallet signature (no server-side keys)
        - Owner operations use 24-hour timelock
        - Exposure caps prevent single-user or single-type concentration
        - Contract can be paused by owner in emergencies
    """
    policies: TreeMap[str, str]
    claims: TreeMap[str, str]
    user_policies: TreeMap[str, str]
    user_claims: TreeMap[str, str]
    admin_ops: TreeMap[str, str]
    payout_log: TreeMap[str, str]
    next_policy_id: u256
    next_claim_id: u256
    next_admin_id: u256
    premium_pool: u256
    total_premium_pool: u256
    total_active_coverage: u256
    contract_balance: u256
    treasury_balance: u256
    total_policies: u256
    total_claims: u256
    approved_claims: u256
    rejected_claims: u256
    payout_cursor: u256
    active_coverage_by_type: TreeMap[str, u256]
    active_coverage_by_user: TreeMap[str, u256]
    reserve_ratio_bps: u256
    protocol_owner: Address
    pending_owner: Address
    owner_proposed_at: u256
    paused: bool

    def __init__(self, initial_owner: str = "", reserve_ratio_bps: int = 1000):
        self.next_policy_id = u256(1)
        self.next_claim_id = u256(1)
        self.next_admin_id = u256(1)
        self.premium_pool = u256(0)
        self.total_premium_pool = u256(0)
        self.total_active_coverage = u256(0)
        self.contract_balance = u256(0)
        self.treasury_balance = u256(0)
        self.total_policies = u256(0)
        self.total_claims = u256(0)
        self.approved_claims = u256(0)
        self.rejected_claims = u256(0)
        self.payout_cursor = u256(0)
        try:
            rr = int(reserve_ratio_bps)
        except Exception:
            rr = 1000
        if rr <= 0:
            rr = 1000
        self.reserve_ratio_bps = u256(rr)
        self.pending_owner = Address(ZERO_HEX)
        self.owner_proposed_at = u256(0)
        self.paused = False
        owner_hex = _addr_hex(initial_owner)
        if owner_hex != ZERO_HEX:
            try:
                self.protocol_owner = Address(owner_hex)
            except Exception:
                self.protocol_owner = gl.message.sender_address
        else:
            self.protocol_owner = gl.message.sender_address
        self.active_coverage_by_type["flight_delay"] = u256(0)
        self.active_coverage_by_type["storm"] = u256(0)
        self.active_coverage_by_type["bankruptcy"] = u256(0)

    def _require_not_paused(self):
        if self.paused:
            _err("paused")

    def _sender(self) -> Address:
        return gl.message.sender_address

    def _sender_hex(self) -> str:
        return _hex(gl.message.sender_address)

    def _value(self) -> int:
        try:
            return int(gl.message.value or 0)
        except Exception:
            return 0

    def _live_balance(self) -> int:
        try:
            return int(self.balance)
        except Exception:
            return int(self.contract_balance)

    def _sync_balance_accounting(self):
        self.contract_balance = u256(self._live_balance())

    def _is_owner(self) -> bool:
        return _hex(gl.message.sender_address) == _hex(self.protocol_owner)

    def _require_owner(self):
        if not self._is_owner():
            _err("not_owner")

    def _calculate_premium(self, policy_type, coverage) -> int:
        loss_bps = EXPECTED_LOSS_BPS.get(policy_type, 2000)
        total_bps = int(loss_bps) + OP_FEE_BPS
        return max(1, int(coverage) * total_bps // 10000)

    def _outstanding_coverage(self) -> int:
        return int(self.total_active_coverage)

    def _collateral_ratio_bps(self, extra_cov=0, extra_bal=0) -> int:
        outstanding = self._outstanding_coverage() + extra_cov
        balance = self._live_balance() + extra_bal
        if outstanding <= 0:
            return 10000000
        return balance * 10000 // outstanding

    def _required_reserve(self) -> int:
        outstanding = self._outstanding_coverage()
        cushion = max(
            SAFETY_RESERVE_FLAT,
            outstanding * int(self.reserve_ratio_bps) // 10000,
        )
        return outstanding + cushion

    def _sat_add(self, current, delta) -> int:
        nxt = int(current) + int(delta)
        return nxt if nxt > 0 else 0

    def _bump_coverage(self, user_hex, ptype, coverage, sign):
        user_hex = _hex(user_hex)
        delta = sign * int(coverage)
        self.total_active_coverage = u256(self._sat_add(self.total_active_coverage, delta))
        current_type = int(_map_get(self.active_coverage_by_type, ptype, u256(0)) or 0)
        self.active_coverage_by_type[ptype] = u256(self._sat_add(current_type, delta))
        current_user = int(_map_get(self.active_coverage_by_user, user_hex, u256(0)) or 0)
        self.active_coverage_by_user[user_hex] = u256(self._sat_add(current_user, delta))

    def _json_id_list(self, store, key: str) -> list:
        raw = _map_get(store, key, None)
        if raw is None or raw == "":
            return []
        try:
            data = json.loads(raw) if not isinstance(raw, (list, tuple)) else raw
        except Exception:
            return []
        if not isinstance(data, list):
            return []
        return data

    def _append_user_policy(self, addr: Address, pid: int):
        key = _hex(addr)
        items = self._json_id_list(self.user_policies, key)
        items.append(int(pid))
        self.user_policies[key] = json.dumps(items)

    def _append_user_claim(self, addr: Address, cid: int):
        key = _hex(addr)
        items = self._json_id_list(self.user_claims, key)
        items.append(int(cid))
        self.user_claims[key] = json.dumps(items)

    def _log_payout(self, record: dict):
        slot = int(self.payout_cursor) % PAYOUT_LOG_CAP
        self.payout_log[_id_key(slot)] = json.dumps(
            record, separators=(",", ":"), sort_keys=True
        )
        self.payout_cursor = u256(int(self.payout_cursor) + 1)

    def _native_send(self, to_hex: str, amount: int) -> bool:
        amt = int(amount)
        if amt <= 0:
            return False
        dest_hex = _addr_hex(to_hex)
        if dest_hex == ZERO_HEX:
            return False
        dest = Address(dest_hex)
        if self._live_balance() < amt:
            return False
        try:
            _NativeRecipient(dest).emit_transfer(value=u256(amt))
            return True
        except Exception:
            return False

    def _try_payout(self, policy, claim):
        coverage = int(policy.get("coverage_amount", 0))
        if (
            coverage <= 0
            or int(self.premium_pool) < coverage
            or self._live_balance() < coverage
        ):
            claim["status"] = "pending_funding"
            claim["payout"] = 0
            policy["status"] = "pending_funding"
            return claim

        beneficiary = _hex(policy.get("beneficiary"))
        sent = self._native_send(beneficiary, coverage)
        if not sent:
            claim["status"] = "payout_failed"
            claim["payout"] = 0
            claim["payout_tx"] = None
            policy["status"] = "payout_failed"
            self._log_payout(
                {
                    "to": beneficiary,
                    "amount": coverage,
                    "status": "payout_failed",
                    "claim_id": claim.get("claim_id"),
                }
            )
            return claim

        self.premium_pool = u256(int(self.premium_pool) - coverage)
        self.total_premium_pool = u256(int(self.total_premium_pool) - coverage)
        self._sync_balance_accounting()
        self.approved_claims = u256(int(self.approved_claims) + 1)
        self._bump_coverage(beneficiary, policy.get("policy_type"), coverage, -1)

        claim["status"] = "approved"
        claim["payout"] = coverage
        claim["payout_tx"] = "transfer:" + beneficiary + ":" + str(coverage)
        policy["status"] = "paid"
        self._log_payout(
            {
                "to": beneficiary,
                "amount": coverage,
                "status": "approved",
                "claim_id": claim.get("claim_id"),
            }
        )
        return claim

    def _reject_claim(self, policy, claim):
        if claim.get("status") not in (
            "pending_verification",
            "pending_manual_review",
            "pending_funding",
            "payout_failed",
        ):
            return claim
        coverage = int(policy.get("coverage_amount", 0))
        if policy.get("status") not in ("rejected", "paid", "expired"):
            self._bump_coverage(
                policy.get("beneficiary"),
                policy.get("policy_type"),
                coverage,
                -1,
            )
        claim["status"] = "rejected"
        claim["payout"] = 0
        policy["status"] = "rejected"
        self.rejected_claims = u256(int(self.rejected_claims) + 1)
        return claim

    def _unwrap_leader(self, leaders_res):
        if leaders_res is None:
            return None
        if isinstance(leaders_res, Exception):
            return None
        try:
            return_cls = getattr(getattr(gl, "vm", None), "Return", None)
            if return_cls is not None and isinstance(leaders_res, return_cls):
                leaders_res = leaders_res.calldata
        except Exception:
            pass
        if hasattr(leaders_res, "calldata") and not isinstance(leaders_res, dict):
            try:
                leaders_res = leaders_res.calldata
            except Exception:
                return None
        if isinstance(leaders_res, str):
            try:
                leaders_res = json.loads(leaders_res)
            except Exception:
                return None
        if isinstance(leaders_res, dict):
            return leaders_res
        return None

    def _finalize_verification(self, claim_id):
        cid = _id_key(claim_id)
        claim = json.loads(self.claims[cid])
        pid = _id_key(claim["policy_id"])
        policy = json.loads(self.policies[pid])
        snapshot = {
            "policy_type": policy.get("policy_type"),
            "event_data": policy.get("event_data"),
        }

        def leader_fn():
            return _canonicalize_verification(fetch_evidence(snapshot))

        def validator_fn(leaders_res) -> bool:
            leader = self._unwrap_leader(leaders_res)
            if not isinstance(leader, dict):
                return False
            mine = _canonicalize_verification(fetch_evidence(snapshot))
            return _validators_agree(leader, mine)

        try:
            verification = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
            verification = self._unwrap_leader(verification) or verification
            if isinstance(verification, str):
                verification = json.loads(verification)
        except Exception:
            verification = dict(MANUAL_REVIEW)

        verification = _canonicalize_verification(verification)
        values = _payout_values(verification)
        claim["verification_result"] = verification
        claim["confidence"] = values["confidence"]
        policy["verification_result"] = verification

        if (
            values["status"] != PAYOUT_STATUS_AUTO
            or values["sources_agreed"] is not True
        ):
            claim["status"] = "pending_manual_review"
            claim["confidence"] = 0
            policy["status"] = "pending_manual_review"
            self.claims[cid] = json.dumps(claim)
            self.policies[pid] = json.dumps(policy)
            return claim

        if _can_auto_payout(values):
            claim = self._try_payout(policy, claim)
        else:
            claim = self._reject_claim(policy, claim)

        self.claims[cid] = json.dumps(claim)
        self.policies[pid] = json.dumps(policy)
        return claim

    def _credit_funds(self, paid: int, to_treasury: int = 0):
        treasury = max(0, int(to_treasury))
        net = int(paid) - treasury
        if net < 0:
            _err("invalid_split")
        self.treasury_balance = u256(int(self.treasury_balance) + treasury)
        self.premium_pool = u256(int(self.premium_pool) + net)
        self.total_premium_pool = u256(int(self.total_premium_pool) + net)
        self._sync_balance_accounting()

    def _load_json_record(self, store, key: str):
        raw = _map_get(store, key, None)
        if raw is None or raw == "":
            return None
        if isinstance(raw, dict):
            return raw
        try:
            data = json.loads(raw)
            if isinstance(data, dict):
                return data
        except Exception:
            return None
        return None

    @gl.public.view
    def get_stats(self) -> dict:
        """Return aggregate protocol statistics.

        Returns:
            dict with keys: total_policies, total_claims, premium_pool,
            total_active_coverage, contract_balance, approved_claims,
            rejected_claims, required_reserve, collateral_bps,
            treasury_balance, paused.
        """
        try:
            return _view_safe({
                "total_policies": int(self.total_policies),
                "total_claims": int(self.total_claims),
                "premium_pool": int(self.premium_pool),
                "total_premium_pool": int(self.total_premium_pool),
                "total_active_coverage": int(self.total_active_coverage),
                "contract_balance": int(self.contract_balance),
                "approved_claims": int(self.approved_claims),
                "rejected_claims": int(self.rejected_claims),
                "required_reserve": self._required_reserve(),
                "collateral_bps": self._collateral_ratio_bps(),
                "treasury_balance": int(self.treasury_balance),
                "paused": bool(self.paused),
            })
        except Exception:
            return {
                "total_policies": 0,
                "total_claims": 0,
                "premium_pool": 0,
                "total_premium_pool": 0,
                "total_active_coverage": 0,
                "contract_balance": 0,
                "approved_claims": 0,
                "rejected_claims": 0,
                "required_reserve": SAFETY_RESERVE_FLAT,
                "collateral_bps": 10000000,
                "treasury_balance": 0,
                "paused": False,
            }

    @gl.public.view
    def get_premium_bps(self) -> dict:
        """Return premium rates in basis points per policy type.

        Returns:
            dict mapping policy_type to total BPS (loss + operational fee).
        """
        result = {}
        for k, v in EXPECTED_LOSS_BPS.items():
            result[k] = int(v) + OP_FEE_BPS
        return result

    @gl.public.view
    def get_owner(self) -> dict:
        try:
            return _view_safe({
                "owner": _hex(self.protocol_owner),
                "pending_owner": _hex(self.pending_owner),
                "owner_proposed_at": int(self.owner_proposed_at),
                "paused": bool(self.paused),
            })
        except Exception:
            return {
                "owner": ZERO_HEX,
                "pending_owner": ZERO_HEX,
                "owner_proposed_at": 0,
                "paused": False,
            }

    @gl.public.view
    def get_reserve(self) -> dict:
        try:
            req = self._required_reserve()
            return _view_safe({
                "required_reserve": req,
                "premium_pool": int(self.premium_pool),
                "contract_balance": int(self.contract_balance),
                "withdrawable": max(0, int(self.premium_pool) - req),
                "collateral_bps": self._collateral_ratio_bps(),
                "outstanding": self._outstanding_coverage(),
                "treasury_balance": int(self.treasury_balance),
            })
        except Exception:
            return {
                "required_reserve": SAFETY_RESERVE_FLAT,
                "premium_pool": 0,
                "contract_balance": 0,
                "withdrawable": 0,
                "collateral_bps": 10000000,
                "outstanding": 0,
                "treasury_balance": 0,
            }

    @gl.public.view
    def get_policy(self, policy_id: int) -> dict:
        """Get full details for a single policy.

        Args:
            policy_id: The numeric policy identifier.

        Returns:
            dict with all policy fields, or {"error": "not_found"}.
        """
        try:
            pid = _safe_int(policy_id, 0)
            key = _id_key(pid)
            data = self._load_json_record(self.policies, key)
            if not data:
                return {"error": "not_found", "policy_id": pid}
            return _view_safe(data)
        except Exception:
            return {"error": "not_found", "policy_id": _safe_int(policy_id, 0)}

    @gl.public.view
    def get_policies(self, user: str) -> list:
        """Get all policies owned by a user address.

        Args:
            user: Ethereum address of the policy owner.

        Returns:
            List of policy dicts (may be empty).
        """
        try:
            key = _addr_hex(user)
            result = []
            for pid in self._json_id_list(self.user_policies, key):
                result.append(self.get_policy(int(pid)))
            return _view_safe(result)
        except Exception:
            return []

    @gl.public.view
    def get_claim(self, claim_id: int) -> dict:
        try:
            cid = _safe_int(claim_id, 0)
            key = _id_key(cid)
            data = self._load_json_record(self.claims, key)
            if not data:
                return {"error": "not_found", "claim_id": cid}
            return _view_safe(data)
        except Exception:
            return {"error": "not_found", "claim_id": _safe_int(claim_id, 0)}

    @gl.public.view
    def get_claims_by_user(self, user: str) -> list:
        try:
            key = _addr_hex(user)
            result = []
            for cid in self._json_id_list(self.user_claims, key):
                result.append(self.get_claim(int(cid)))
            return _view_safe(result)
        except Exception:
            return []

    @gl.public.view
    def check_claim_status(self, claim_id: int) -> dict:
        """Check the status of a claim with payout details.

        Args:
            claim_id: The numeric claim identifier.

        Returns:
            dict with claim_id, status, payout, payout_tx, confidence.
        """
        try:
            claim = self.get_claim(claim_id)
            if claim.get("error") == "not_found":
                return claim
            payout_tx = claim.get("payout_tx", "")
            if payout_tx is None:
                payout_tx = ""
            return _view_safe({
                "claim_id": claim.get("claim_id", _safe_int(claim_id, 0)),
                "status": claim.get("status", ""),
                "payout": _safe_int(claim.get("payout", 0), 0),
                "payout_tx": payout_tx,
                "confidence": _safe_int(claim.get("confidence", 0), 0),
            })
        except Exception:
            return {
                "error": "not_found",
                "claim_id": _safe_int(claim_id, 0),
            }

    @gl.public.view
    def get_admin_op(self, op_id: int) -> dict:
        try:
            oid = _safe_int(op_id, 0)
            key = _id_key(oid)
            data = self._load_json_record(self.admin_ops, key)
            if not data:
                return {"error": "not_found", "op_id": oid}
            return _view_safe(data)
        except Exception:
            return {"error": "not_found", "op_id": _safe_int(op_id, 0)}

    @gl.public.write
    def pause_contract(self):
        """Pause the contract, blocking all new policies and claims.

        Only callable by the protocol owner. Used in emergencies.
        """
        self._require_owner()
        self.paused = True

    @gl.public.write
    def unpause_contract(self):
        """Resume normal contract operations after a pause.

        Only callable by the protocol owner.
        """
        self._require_owner()
        self.paused = False

    @gl.public.write.payable
    def purchase_policy(
        self, policy_type: str, coverage_amount: int, event_data: str
    ) -> int:
        """Purchase an insurance policy.

        Validates event parameters, enforces exposure caps and collateral
        ratios, calculates premium, and creates the policy record.

        Args:
            policy_type: One of 'flight_delay', 'storm', 'bankruptcy'.
            coverage_amount: Maximum payout amount in native tokens.
            event_data: JSON string with event parameters (flight number,
                location, company, date, etc.).

        Returns:
            int: The new policy ID.

        Raises:
            Exception: On invalid parameters, insufficient premium,
                cap exceeded, or undercollateralized.
        """
        self._require_not_paused()
        params = parse_event_data(policy_type, event_data)
        coverage = int(coverage_amount)
        if coverage <= 0:
            _err("invalid_coverage")

        if _event_already_started(params["date"]):
            _err("event_already_started")

        sender_addr = self._sender()
        sender = _hex(sender_addr)
        premium = self._calculate_premium(policy_type, coverage)
        paid = self._value()
        if paid < premium:
            _err("insufficient_premium")

        excess = paid - premium
        pool_for_cap = self._live_balance() - excess
        if pool_for_cap < 0:
            pool_for_cap = 0
        if coverage * 10000 > pool_for_cap * POLICY_CAP_BPS:
            _err("policy_cap_exceeded")

        type_used = int(_map_get(self.active_coverage_by_type, policy_type, u256(0)) or 0)
        if (type_used + coverage) * 10000 > pool_for_cap * TYPE_CAP_BPS:
            _err("type_cap_exceeded")

        user_used = int(_map_get(self.active_coverage_by_user, sender, u256(0)) or 0)
        if (user_used + coverage) * 10000 > pool_for_cap * USER_CAP_BPS:
            _err("user_cap_exceeded")

        if self._collateral_ratio_bps(extra_cov=coverage, extra_bal=0) < MIN_COLLATERAL_BPS:
            _err("undercollateralized")

        pid = int(self.next_policy_id)
        self.next_policy_id = u256(pid + 1)
        treasury = premium * TREASURY_FEE_BPS // 10000 + excess

        self._credit_funds(paid, treasury)
        self.total_policies = u256(int(self.total_policies) + 1)
        self._bump_coverage(sender, policy_type, coverage, 1)

        record = {
            "policy_id": pid,
            "policy_type": policy_type,
            "beneficiary": sender,
            "coverage_amount": coverage,
            "premium_paid": paid,
            "event_data": json.dumps(params, separators=(",", ":"), sort_keys=True),
            "status": "active",
            "claim_id": 0,
            "verification_result": "",
            "created_at": _now(),
        }
        self.policies[_id_key(pid)] = json.dumps(record)
        self._append_user_policy(sender_addr, pid)
        return pid

    @gl.public.write
    def file_claim(self, policy_id: int) -> int:
        """File an insurance claim on an active policy.

        Triggers oracle consensus verification immediately via
        _finalize_verification(). The claim will be auto-resolved
        based on oracle results.

        Args:
            policy_id: The policy to file a claim against.

        Returns:
            int: The new claim ID.

        Raises:
            Exception: If policy not found, not owned, not active,
                duplicate claim, or claim window closed.
        """
        self._require_not_paused()
        sender_addr = self._sender()
        sender = _hex(sender_addr)
        key = _id_key(policy_id)
        policy = self._load_json_record(self.policies, key)
        if not policy:
            _err("policy_not_found")
        if _hex(policy.get("beneficiary")) != sender:
            _err("not_policy_owner")
        existing_claim = policy.get("claim_id")
        if existing_claim not in (None, 0, "", "0"):
            _err("duplicate_claim")
        if policy.get("status") != "active":
            _err("inactive_policy")

        params = parse_event_data(
            policy.get("policy_type"), policy.get("event_data") or "{}"
        )
        start = _event_start_ts(params["date"])
        now = _now()
        if now < start:
            _err("claim_too_early")
        if now > start + CLAIM_WINDOW_SECONDS:
            _err("claim_window_closed")

        cid = int(self.next_claim_id)
        self.next_claim_id = u256(cid + 1)
        self.total_claims = u256(int(self.total_claims) + 1)

        claim = {
            "claim_id": cid,
            "policy_id": int(policy_id),
            "claimant": sender,
            "status": "pending_verification",
            "payout": 0,
            "payout_tx": "",
            "verification_result": "",
            "confidence": 0,
        }
        policy["claim_id"] = cid
        policy["status"] = "pending_verification"
        self.policies[key] = json.dumps(policy)
        self.claims[_id_key(cid)] = json.dumps(claim)
        self._append_user_claim(sender_addr, cid)
        self._finalize_verification(cid)
        return cid

    @gl.public.write
    def settle_claim(self, claim_id: int) -> dict:
        """Settle or retry a claim.

        Handles multiple claim states:
        - pending_verification: Triggers oracle verification
        - pending_manual_review: Returns current status (no action)
        - pending_funding / payout_failed: Retries the payout

        Args:
            claim_id: The claim to settle.

        Returns:
            dict with updated claim details.

        Raises:
            Exception: If claim not found or caller not authorized.
        """
        self._require_not_paused()
        key = _id_key(claim_id)
        claim = self._load_json_record(self.claims, key)
        if not claim:
            _err("claim_not_found")
        pid = _id_key(claim["policy_id"])
        policy = self._load_json_record(self.policies, pid)
        if not policy:
            _err("policy_not_found")
        sender = self._sender_hex()
        if sender != _hex(claim.get("claimant")) and not self._is_owner():
            _err("not_authorized")
        if claim.get("status") == "pending_verification":
            return self._finalize_verification(int(claim_id))
        if claim.get("status") == "pending_manual_review":
            return claim
        if claim.get("status") in ("pending_funding", "payout_failed"):
            claim = self._try_payout(policy, claim)
            self.claims[key] = json.dumps(claim)
            self.policies[pid] = json.dumps(policy)
            return claim
        return claim

    @gl.public.write
    def expire_policy(self, policy_id: int) -> dict:
        key = _id_key(policy_id)
        policy = self._load_json_record(self.policies, key)
        if not policy:
            _err("policy_not_found")
        if policy.get("status") != "active":
            _err("inactive_policy")
        params = parse_event_data(
            policy.get("policy_type"), policy.get("event_data") or "{}"
        )
        if _now() <= _event_start_ts(params["date"]) + CLAIM_WINDOW_SECONDS:
            _err("claim_window_open")
        self._bump_coverage(
            policy.get("beneficiary"),
            policy.get("policy_type"),
            int(policy.get("coverage_amount", 0)),
            -1,
        )
        policy["status"] = "expired"
        self.policies[key] = json.dumps(policy)
        return policy

    @gl.public.write.payable
    def fund_pool(self) -> int:
        """Add native tokens to the protocol premium pool.

        Funds are split between the premium pool (for payouts) and
        treasury (operational fees). Excess payments are credited
        to the treasury.

        Returns:
            int: Updated contract balance after funding.

        Raises:
            Exception: If contract is paused or zero funding sent.
        """
        self._require_not_paused()
        paid = self._value()
        if paid <= 0:
            _err("zero_funding")
        self._credit_funds(paid, 0)
        return self._live_balance()

    @gl.public.write
    def propose_owner(self, new_owner: str) -> str:
        self._require_owner()
        owner_hex = _addr_hex(new_owner)
        if owner_hex == ZERO_HEX:
            _err("invalid_owner")
        pending = Address(owner_hex)
        if owner_hex == _hex(self.protocol_owner):
            _err("already_owner")
        self.pending_owner = pending
        self.owner_proposed_at = u256(_now())
        return owner_hex

    @gl.public.write
    def cancel_owner_proposal(self) -> str:
        self._require_owner()
        self.pending_owner = Address(ZERO_HEX)
        self.owner_proposed_at = u256(0)
        return ZERO_HEX

    @gl.public.write
    def accept_ownership(self) -> str:
        sender = self._sender()
        if _hex(sender) != _hex(self.pending_owner):
            _err("not_pending_owner")
        proposed_at = int(self.owner_proposed_at)
        if proposed_at <= 0 or _now() < proposed_at + TIMELOCK_SECONDS:
            _err("timelock_active")
        self.protocol_owner = sender
        self.pending_owner = Address(ZERO_HEX)
        self.owner_proposed_at = u256(0)
        return _hex(sender)

    @gl.public.write
    def schedule_admin(self, action: str, payload: str) -> int:
        self._require_owner()
        if action not in ADMIN_ACTIONS:
            _err("invalid_admin_action")
        if action == "resolve_claim":
            try:
                data = json.loads(payload) if payload else {}
            except Exception:
                _err("invalid_payload")
            if not isinstance(data, dict):
                _err("invalid_payload")
            if _safe_int(data.get("claim_id"), 0) <= 0:
                _err("invalid_payload")
            if "approve" not in data:
                _err("invalid_payload")
        else:
            if _safe_int(payload, -1) < 0:
                _err("invalid_payload")
        oid = int(self.next_admin_id)
        self.next_admin_id = u256(oid + 1)
        self.admin_ops[_id_key(oid)] = json.dumps(
            {
                "id": oid,
                "action": action,
                "payload": str(payload),
                "eta": _now() + TIMELOCK_SECONDS,
                "status": "scheduled",
            }
        )
        return oid

    @gl.public.write
    def cancel_admin(self, op_id: int) -> int:
        self._require_owner()
        key = _id_key(op_id)
        op = self._load_json_record(self.admin_ops, key)
        if not op:
            _err("admin_op_not_found")
        if op.get("status") != "scheduled":
            _err("admin_op_not_scheduled")
        op["status"] = "cancelled"
        self.admin_ops[key] = json.dumps(op)
        return int(op_id)

    @gl.public.write
    def execute_admin(self, op_id: int) -> dict:
        self._require_owner()
        key = _id_key(op_id)
        op = self._load_json_record(self.admin_ops, key)
        if not op:
            _err("admin_op_not_found")
        if op.get("status") != "scheduled":
            _err("admin_op_not_scheduled")
        if _now() < _safe_int(op.get("eta", 0), 0):
            _err("timelock_active")

        action = op.get("action")
        payload = op.get("payload", "0")

        if action == "withdraw_excess":
            amount = _safe_int(payload, -1)
            reserve = self._required_reserve()
            if amount <= 0:
                _err("invalid_amount")
            if int(self.premium_pool) - amount < reserve:
                _err("insufficient_excess")
            if amount > self._live_balance():
                _err("insufficient_balance")
            owner_hex = _hex(self.protocol_owner)
            if not self._native_send(owner_hex, amount):
                _err("withdraw_transfer_failed")
            self.premium_pool = u256(int(self.premium_pool) - amount)
            self.total_premium_pool = u256(int(self.total_premium_pool) - amount)
            self._sync_balance_accounting()
            op["status"] = "executed"
            op["result"] = "transfer:" + owner_hex + ":" + str(amount)
            self._log_payout(
                {"to": owner_hex, "amount": amount, "status": "withdraw"}
            )
        elif action == "withdraw_treasury":
            amount = _safe_int(payload, -1)
            if amount <= 0:
                _err("invalid_amount")
            if amount > int(self.treasury_balance):
                _err("insufficient_treasury")
            if amount > self._live_balance():
                _err("insufficient_balance")
            if self._live_balance() - amount < self._required_reserve():
                _err("insufficient_reserve")
            owner_hex = _hex(self.protocol_owner)
            if not self._native_send(owner_hex, amount):
                _err("withdraw_transfer_failed")
            self.treasury_balance = u256(int(self.treasury_balance) - amount)
            self._sync_balance_accounting()
            op["status"] = "executed"
            op["result"] = "treasury:" + owner_hex + ":" + str(amount)
            self._log_payout(
                {"to": owner_hex, "amount": amount, "status": "treasury_withdraw"}
            )
        elif action == "retry_payout":
            cid = _safe_int(payload, -1)
            ckey = _id_key(cid)
            claim = self._load_json_record(self.claims, ckey)
            if not claim:
                _err("claim_not_found")
            if claim.get("status") != "payout_failed":
                _err("not_payout_failed")
            pid = _id_key(claim["policy_id"])
            policy = self._load_json_record(self.policies, pid)
            if not policy:
                _err("policy_not_found")
            claim = self._try_payout(policy, claim)
            self.claims[ckey] = json.dumps(claim)
            self.policies[pid] = json.dumps(policy)
            op["status"] = "executed"
            op["result"] = str(claim.get("status"))
        elif action == "resolve_claim":
            try:
                data = json.loads(payload) if payload else {}
            except Exception:
                _err("invalid_payload")
            cid = _safe_int(data.get("claim_id"), -1)
            ckey = _id_key(cid)
            claim = self._load_json_record(self.claims, ckey)
            if not claim:
                _err("claim_not_found")
            if claim.get("status") not in (
                "pending_manual_review",
                "pending_funding",
                "payout_failed",
            ):
                _err("not_resolvable")
            pid = _id_key(claim["policy_id"])
            policy = self._load_json_record(self.policies, pid)
            if not policy:
                _err("policy_not_found")
            if _as_bool(data.get("approve")):
                claim["verification_result"] = {
                    "status": "manual_override",
                    "occurred": True,
                    "confidence": 100,
                }
                claim["confidence"] = 100
                claim = self._try_payout(policy, claim)
            else:
                claim = self._reject_claim(policy, claim)
            self.claims[ckey] = json.dumps(claim)
            self.policies[pid] = json.dumps(policy)
            op["status"] = "executed"
            op["result"] = str(claim.get("status"))
        else:
            _err("invalid_admin_action")

        self.admin_ops[key] = json.dumps(op)
        return op
