#!/usr/bin/env bash
# Scoped PM2 wrapper. Refuses host-wide commands.
set -euo pipefail
LOG="/root/gen1/logs/pm2-commands.log"
mkdir -p /root/gen1/logs
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> "$LOG"
cmd="${1:-}"
shift || true
if [[ "$cmd" == "kill" ]]; then
  echo "refused: pm2 kill is forbidden" >&2
  exit 2
fi
for arg in "$cmd" "$@"; do
  if [[ "$arg" == "all" ]]; then
    echo "refused: pm2 $cmd all is forbidden on this shared host" >&2
    exit 2
  fi
done
if [[ -z "$cmd" ]]; then
  echo "usage: safe-pm2.sh <start|stop|restart|delete|list> shieldlayer-api shieldlayer-frontend" >&2
  exit 2
fi
for name in "$@"; do
  if [[ "$name" != shieldlayer-* && "$name" != gen1-* ]]; then
    echo "refused: only shieldlayer-* (or legacy gen1-*) process names are allowed (got $name)" >&2
    exit 2
  fi
done
exec pm2 "$cmd" "$@"
