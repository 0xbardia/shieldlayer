#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ -f .dev-ports.json ]; then
  python3 - <<'PY'
import json, os, signal, subprocess
from pathlib import Path
p = json.loads(Path(".dev-ports.json").read_text())
for port in (p.get("webPort"), p.get("apiPort")):
    if not port: continue
    try:
        out = subprocess.check_output(["lsof", "-ti", f":{port}"], text=True).strip()
    except Exception:
        continue
    for pid in out.split():
        try:
            os.kill(int(pid), signal.SIGTERM)
        except ProcessLookupError:
            pass
PY
fi
