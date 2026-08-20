"""
Schema-constrained oracle feeds for ShieldLayer insurance verification.

This module provides structured parsing and combination logic for oracle
responses. The LLM is used as a tiebreaker only — structured data takes
precedence when available.

Oracle Flow:
    1. Raw oracle response is parsed into a typed dict (parse_flight, etc.)
    2. Two independent sources are compared via combine_two()
    3. If both agree on occurred status → structured_consensus (high confidence)
    4. If they disagree → sources_disagree (manual review required)
    5. If only one source available → single_source_only (manual review)
"""

from __future__ import annotations

import json
from typing import Any

REQUIRED_FLIGHT_KEYS = ("occurred", "delay_hours")
REQUIRED_STORM_KEYS = ("occurred", "max_wind_kmh")
REQUIRED_BANK_KEYS = ("occurred", "chapter")


class SchemaError(ValueError):
    """Raised when oracle response fails schema validation."""
    pass


def as_dict(raw: Any) -> dict:
    """Convert raw oracle response to a dict.

    Args:
        raw: Response from oracle (str, bytes, or dict).

    Returns:
        Parsed dictionary.

    Raises:
        SchemaError: If response is not valid JSON or not a dict.
    """
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, (bytes, bytearray)):
        raw = raw.decode("utf-8", errors="replace")
    if not isinstance(raw, str):
        raise SchemaError("not_json")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SchemaError("not_json") from exc
    if not isinstance(data, dict):
        raise SchemaError("not_object")
    return data


def parse_flight(raw: Any) -> dict:
    """Parse and validate a flight delay oracle response.

    Args:
        raw: Oracle response containing 'occurred' and 'delay_hours'.

    Returns:
        dict with 'occurred' (bool), 'delay_hours' (float), 'source' (str).

    Raises:
        SchemaError: If required keys missing or delay_hours out of range.
    """
    d = as_dict(raw)
    if "occurred" not in d or "delay_hours" not in d:
        raise SchemaError("flight_schema")
    hours = float(d["delay_hours"])
    if hours < 0 or hours > 168:
        raise SchemaError("flight_hours_range")
    return {"occurred": bool(d["occurred"]), "delay_hours": hours, "source": d.get("source", "unknown")}


def parse_storm(raw: Any) -> dict:
    """Parse and validate a storm oracle response.

    Args:
        raw: Oracle response containing 'occurred' and 'max_wind_kmh'.

    Returns:
        dict with 'occurred' (bool), 'max_wind_kmh' (float), 'source' (str).

    Raises:
        SchemaError: If required keys missing or wind speed out of range.
    """
    d = as_dict(raw)
    if "occurred" not in d or "max_wind_kmh" not in d:
        raise SchemaError("storm_schema")
    wind = float(d["max_wind_kmh"])
    if wind < 0 or wind > 400:
        raise SchemaError("storm_wind_range")
    return {"occurred": bool(d["occurred"]), "max_wind_kmh": wind, "source": d.get("source", "unknown")}


def parse_bankruptcy(raw: Any) -> dict:
    """Parse and validate a bankruptcy oracle response.

    Args:
        raw: Oracle response containing 'occurred' and optional 'chapter'.

    Returns:
        dict with 'occurred' (bool), 'chapter' (str), 'source' (str).

    Raises:
        SchemaError: If required keys missing or invalid chapter number.
    """
    d = as_dict(raw)
    if "occurred" not in d:
        raise SchemaError("bank_schema")
    chapter = str(d.get("chapter") or "")
    if d.get("occurred") and chapter not in {"7", "11", "15"}:
        raise SchemaError("bank_chapter")
    return {"occurred": bool(d["occurred"]), "chapter": chapter, "source": d.get("source", "unknown")}


def agree(a: dict, b: dict) -> bool:
    """Check if two oracle sources agree on the 'occurred' field.

    Args:
        a: First parsed oracle response.
        b: Second parsed oracle response.

    Returns:
        True if both sources agree on whether the event occurred.
    """
    return bool(a.get("occurred")) is bool(b.get("occurred"))


def combine_two(a: dict | None, b: dict | None) -> dict:
    """Combine two structured oracle sources into a consensus result.

    Uses pure structured comparison — no LLM involved at this stage.

    Args:
        a: First parsed oracle response (or None if unavailable).
        b: Second parsed oracle response (or None if unavailable).

    Returns:
        dict with 'status' (one of 'structured_consensus', 'sources_disagree',
        'pending_manual_review', 'single_source_only'), 'occurred' (bool),
        'confidence' (0.0 or 1.0), and 'reason' (str).
    """
    if a is None and b is None:
        return {"status": "pending_manual_review", "occurred": False, "confidence": 0.0, "reason": "no_structured_sources"}
    if a is None or b is None:
        return {
            "status": "pending_manual_review",
            "occurred": False,
            "confidence": 0.0,
            "reason": "single_source_only",
        }
    if not agree(a, b):
        return {
            "status": "sources_disagree",
            "occurred": False,
            "confidence": 0.0,
            "reason": "structured_disagreement",
            "a": a,
            "b": b,
        }
    return {
        "status": "structured_consensus",
        "occurred": bool(a["occurred"]),
        "confidence": 1.0 if a["occurred"] else 0.0,
        "reason": "two_source_agreement",
        "a": a,
        "b": b,
    }
