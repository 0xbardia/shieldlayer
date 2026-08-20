"""Local API server on a dedicated port (used by npm run dev)."""

from __future__ import annotations

import os
import sys

# Ensure project root is importable
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import uvicorn

from api.index import app

if __name__ == "__main__":
    port = int(os.environ.get("API_PORT", "8787"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
