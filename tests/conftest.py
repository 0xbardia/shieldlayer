import os

os.environ.setdefault(
    "REDIS_URL",
    os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
)
os.environ.setdefault("SHIELDLAYER_ALLOW_MEMORY_REDIS", "0")
