"""Official redis-py client. Production requires redis:// — no memory default."""

from __future__ import annotations

import logging
import os
from functools import lru_cache

logger = logging.getLogger(__name__)

_ALLOW_MEMORY = (
    os.environ.get("SHIELDLAYER_ALLOW_MEMORY_REDIS") == "1"
    or os.environ.get("GEN1_ALLOW_MEMORY_REDIS") == "1"
    or bool(os.environ.get("PYTEST_CURRENT_TEST"))
)


def redis_url() -> str:
    url = os.environ.get("REDIS_URL", "").strip()
    if not url:
        if _ALLOW_MEMORY:
            return "memory://"
        raise RuntimeError("REDIS_URL is required in production")
    if url.startswith("memory"):
        if not _ALLOW_MEMORY:
            raise RuntimeError("memory:// Redis is forbidden outside tests")
        return url
    if not url.startswith("redis://") and not url.startswith("rediss://"):
        raise RuntimeError("REDIS_URL must be redis:// or rediss://")
    return url


@lru_cache(maxsize=1)
def _client():
    import redis

    url = redis_url()
    return redis.Redis.from_url(
        url,
        decode_responses=True,
        socket_connect_timeout=1.0,
        socket_timeout=1.0,
        retry_on_timeout=True,
        health_check_interval=15,
    )


def incr_window(key: str, window: float) -> int:
    url = redis_url()
    if url.startswith("memory"):
        from api._redis_memory import incr_window as mem_incr

        return mem_incr(key, window)
    try:
        r = _client()
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.ttl(key)
        n, ttl = pipe.execute()
        if int(ttl) < 0:
            r.expire(key, int(window))
        return int(n)
    except Exception as exc:
        logger.error("redis incr failed: %s", exc)
        raise ConnectionError("ERR_RATE_BACKEND") from exc


def nonce_seen(key: str) -> bool:
    full = f"nonce:{key}"
    url = redis_url()
    if url.startswith("memory"):
        from api._redis_memory import get as mem_get

        return mem_get(full) is not None
    try:
        return _client().get(full) is not None
    except Exception as exc:
        logger.error("redis get failed: %s", exc)
        raise ConnectionError("ERR_RATE_BACKEND") from exc


def nonce_store(key: str, ttl: float = 86_400.0) -> None:
    full = f"nonce:{key}"
    url = redis_url()
    if url.startswith("memory"):
        from api._redis_memory import setnx as mem_set

        mem_set(full, "1", ttl)
        return
    try:
        _client().set(full, "1", ex=int(ttl), nx=True)
    except Exception as exc:
        logger.error("redis set failed: %s", exc)
        raise ConnectionError("ERR_RATE_BACKEND") from exc


def ping_info() -> dict:
    try:
        url = redis_url()
    except RuntimeError as exc:
        return {"ok": False, "backend": "missing", "error": str(exc)}
    if url.startswith("memory"):
        return {"ok": True, "backend": "memory", "used_memory": 0, "connected_clients": 0}
    try:
        r = _client()
        if r.ping() is not True:
            return {"ok": False, "backend": "redis", "error": "ERR_REDIS_PING"}
        info = r.info(section="memory")
        clients = r.info(section="clients")
        return {
            "ok": True,
            "backend": "redis",
            "used_memory": int(info.get("used_memory", 0)),
            "used_memory_human": info.get("used_memory_human"),
            "connected_clients": int(clients.get("connected_clients", 0)),
        }
    except Exception as exc:
        logger.error("redis ping failed: %s", exc)
        return {"ok": False, "backend": "redis", "error": "ERR_REDIS_DOWN"}
