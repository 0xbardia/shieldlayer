"""In-process Redis stand-in. Imported only when SHIELDLAYER_ALLOW_MEMORY_REDIS=1 or pytest."""

from __future__ import annotations

import threading
import time
from typing import Optional

_lock = threading.Lock()
_mem: dict[str, tuple[float, str]] = {}


def incr_window(key: str, window: float) -> int:
    now = time.time()
    with _lock:
        expired = [k for k, (exp, _) in _mem.items() if exp <= now]
        for k in expired:
            del _mem[k]
        exp, raw = _mem.get(key, (now + window, "0"))
        if exp <= now:
            _mem[key] = (now + window, "1")
            return 1
        n = int(raw) + 1
        _mem[key] = (exp, str(n))
        return n


def get(key: str) -> Optional[str]:
    now = time.time()
    with _lock:
        item = _mem.get(key)
        if not item or item[0] <= now:
            return None
        return item[1]


def setnx(key: str, value: str, ttl: float) -> None:
    with _lock:
        _mem[key] = (time.time() + ttl, value)
