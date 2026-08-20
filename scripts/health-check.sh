#!/bin/bash
# ShieldLayer Health Check Script
# Runs every minute via cron to monitor service health
# Logs results to /root/gen1/logs/health-check.log

set -euo pipefail

LOG_FILE="/root/gen1/logs/health-check.log"
FRONTEND_URL="http://localhost:3456"
API_URL="http://localhost:8787/api/health"
FAILURE_COUNT_FILE="/tmp/shieldlayer-health-failures"
MAX_FAILURES=3

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

check_service() {
    local name=$1
    local url=$2
    local timeout=10

    if curl -sf --max-time "$timeout" "$url" > /dev/null 2>&1; then
        log "OK: $name is healthy"
        return 0
    else
        log "FAIL: $name is unhealthy"
        return 1
    fi
}

# Read previous failure count
FAILURES=0
if [ -f "$FAILURE_COUNT_FILE" ]; then
    FAILURES=$(cat "$FAILURE_COUNT_FILE")
fi

# Check services
FRONTEND_OK=true
API_OK=true

if ! check_service "Frontend" "$FRONTEND_URL"; then
    FRONTEND_OK=false
fi

if ! check_service "API" "$API_URL"; then
    API_OK=false
fi

# Update failure count
if [ "$FRONTEND_OK" = false ] || [ "$API_OK" = false ]; then
    FAILURES=$((FAILURES + 1))
    echo "$FAILURES" > "$FAILURE_COUNT_FILE"
    log "Failure count: $FAILURES/$MAX_FAILURES"

    # Alert after consecutive failures
    if [ "$FAILURES" -ge "$MAX_FAILURES" ]; then
        log "ALERT: Service has been unhealthy for $FAILURES consecutive checks"
        # Add alert mechanism here (email, Slack webhook, etc.)
        # Example: curl -X POST -H 'Content-type: application/json' --data '{"text":"ShieldLayer is down!"}' $SLACK_WEBHOOK
    fi
else
    # Reset failure count on success
    if [ "$FAILURES" -gt 0 ]; then
        log "Service recovered after $FAILURES failures"
    fi
    echo "0" > "$FAILURE_COUNT_FILE"
fi

# Log system metrics
MEMORY=$(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
DISK=$(df -h / | awk 'NR==2{print $5}')
LOAD=$(uptime | awk -F'load average:' '{print $2}' | cut -d',' -f1 | tr -d ' ')

log "Metrics: memory=$MEMORY disk=$DISK load=$LOAD"
