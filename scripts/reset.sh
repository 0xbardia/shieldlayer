#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
rm -rf .next .pytest_cache __pycache__ api/__pycache__ contract/__pycache__
echo "ephemeral caches cleared"
