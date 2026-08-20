"""JSON-only serialization. Pickle is forbidden."""

from __future__ import annotations

import json
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)


def safe_loads(file_path: str) -> Any:
    if not os.path.exists(file_path):
        raise FileNotFoundError(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def safe_dumps(data: Any, file_path: str) -> None:
    os.makedirs(os.path.dirname(file_path) or ".", exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
