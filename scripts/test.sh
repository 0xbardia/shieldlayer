#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm run test:js
python3 -m pytest tests/api tests/smart-contract tests/database tests/security -q
