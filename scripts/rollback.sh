#!/bin/bash
# ShieldLayer Rollback Script
# Reverts to a previous version using git tags
# Usage: bash scripts/rollback.sh <tag>

set -euo pipefail

PROJECT_DIR="/root/gen1"
LOG_FILE="${PROJECT_DIR}/logs/rollback.log"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

if [ $# -eq 0 ]; then
    echo "Usage: $0 <git-tag>"
    echo ""
    echo "Available tags:"
    cd "${PROJECT_DIR}"
    git tag -l 2>/dev/null | sort -V || echo "  No tags found"
    echo ""
    echo "Recent commits:"
    git log --oneline -10 2>/dev/null || echo "  No git history"
    exit 1
fi

TAG="$1"

echo "=== ShieldLayer Rollback Script ==="
echo "Rolling back to: $TAG"
echo ""

# Confirm before proceeding
read -p "This will rollback the application. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled."
    exit 0
fi

cd "${PROJECT_DIR}"

# Create pre-rollback backup
log "Creating pre-rollback backup..."
bash scripts/backup.sh 2>/dev/null || true

# Verify tag exists
if ! git rev-parse "$TAG" >/dev/null 2>&1; then
    log "ERROR: Tag/commit '$TAG' not found"
    exit 1
fi

# Stop current services
log "Stopping services..."
pm2 stop shieldlayer-api shieldlayer-frontend 2>/dev/null || true

# Checkout the tag
log "Checking out $TAG..."
git checkout "$TAG"

# Install dependencies
log "Installing dependencies..."
npm install 2>/dev/null || true
pip3 install -r requirements.txt 2>/dev/null || true

# Rebuild
log "Building..."
npm run build 2>/dev/null || echo "Warning: Build failed"

# Restart services
log "Restarting services..."
pm2 start ecosystem.config.js 2>/dev/null || true
pm2 save 2>/dev/null || true

# Verify
log "Verifying rollback..."
sleep 5
if pm2 status | grep -q "shieldlayer-api.*online" && pm2 status | grep -q "shieldlayer-frontend.*online"; then
    log "Rollback successful!"
else
    log "WARNING: Services may not be running correctly"
fi

log "Rollback to $TAG complete"
echo ""
echo "=== Rollback Complete ==="
echo "Check logs: pm2 logs --lines 20"
echo "Check status: pm2 status"
