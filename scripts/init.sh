#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 -m pip install -q -r requirements.txt
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund
fi
exec ./serve.sh
