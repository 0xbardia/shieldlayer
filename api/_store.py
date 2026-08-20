"""Local file-backed simulator removed (fail-closed)."""

from __future__ import annotations


def load() -> None:
    raise RuntimeError("ERR_SIMULATOR_REMOVED")


def save(_data: dict) -> None:
    raise RuntimeError("ERR_SIMULATOR_REMOVED")
