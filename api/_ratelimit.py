"""Redis-backed rate limiter. Health is unlimited. Fail-closed if backend down."""

from __future__ import annotations

import logging
import time

from api._redis import incr_window

logger = logging.getLogger(__name__)

READ_LIMIT = 100
WRITE_LIMIT = 10
WINDOW = 60.0


def check(ip: str, write: bool = False) -> tuple[bool, int, int, int]:
    limit = WRITE_LIMIT if write else READ_LIMIT
    key = f"rl:{ip}:{'w' if write else 'r'}"
    reset = int(time.time() + WINDOW)
    try:
        used = incr_window(key, WINDOW)
    except (ConnectionError, RuntimeError):
        logger.error("Rate backend unavailable; denying %s", ip)
        return False, limit, 0, reset
    remaining = max(0, limit - used)
    if used > limit:
        return False, limit, 0, reset
    return True, limit, remaining, reset


def peek(ip: str, write: bool = False) -> tuple[int, int, int]:
    limit = WRITE_LIMIT if write else READ_LIMIT
    return limit, limit, int(time.time() + WINDOW)


def cleanup() -> int:
    return 0
