#!/bin/bash
# ShieldLayer Backup Script
# Backs up critical files to /root/backups/
# Run daily via cron: 0 2 * * * /root/gen1/scripts/backup.sh

set -euo pipefail

BACKUP_DIR="/root/backups"
PROJECT_DIR="/root/gen1"
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
BACKUP_NAME="gen1-backup-${TIMESTAMP}.tar.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

mkdir -p "${BACKUP_DIR}/env" "${BACKUP_DIR}/config" "${BACKUP_DIR}/contract"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

log "Starting backup: ${BACKUP_NAME}"

# Backup environment files
log "Backing up environment files..."
cp "${PROJECT_DIR}/.env.local" "${BACKUP_DIR}/env/.env.local-${TIMESTAMP}" 2>/dev/null || true
cp "${PROJECT_DIR}/.env.example" "${BACKUP_DIR}/env/.env.example-${TIMESTAMP}" 2>/dev/null || true

# Backup config files
log "Backing up configuration..."
cp "${PROJECT_DIR}/ecosystem.config.js" "${BACKUP_DIR}/config/ecosystem.config.js-${TIMESTAMP}" 2>/dev/null || true
cp "${PROJECT_DIR}/next.config.js" "${BACKUP_DIR}/config/next.config.js-${TIMESTAMP}" 2>/dev/null || true

# Backup contract
log "Backing up contract..."
cp "${PROJECT_DIR}/contract/main.py" "${BACKUP_DIR}/contract/main.py-${TIMESTAMP}" 2>/dev/null || true

# Backup contract state (if exists)
if [ -f "${PROJECT_DIR}/.data/contract.pkl" ]; then
    log "Backing up contract state..."
    cp "${PROJECT_DIR}/.data/contract.pkl" "${BACKUP_DIR}/contract/contract.pkl-${TIMESTAMP}" 2>/dev/null || true
fi

# Save PM2 process list
log "Saving PM2 process list..."
pm2 save 2>/dev/null || true

# Create compressed backup
log "Creating compressed archive..."
cd "${PROJECT_DIR}"
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='logs' \
    --exclude='__pycache__' \
    --exclude='.pytest_cache' \
    . 2>/dev/null

# Keep only last 30 backups
log "Cleaning old backups (keeping last 30)..."
cd "${BACKUP_DIR}"
ls -t gen1-backup-*.tar.gz 2>/dev/null | tail -n +31 | xargs -r rm -f

# Log backup size
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)
log "Backup complete: ${BACKUP_NAME} (${BACKUP_SIZE})"

# Log backup contents
log "Backup contains:"
log "  - Environment files"
log "  - Configuration files"
log "  - Contract source"
log "  - Contract state (if exists)"
log "  - PM2 process list"
