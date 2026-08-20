#!/bin/bash
# ShieldLayer Restore Script
# Restores files from a backup archive
# Usage: bash scripts/restore.sh <backup-filename>

set -euo pipefail

BACKUP_DIR="/root/backups"
PROJECT_DIR="/root/gen1"

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup-filename>"
    echo ""
    echo "Available backups:"
    ls -1 "${BACKUP_DIR}"/gen1-backup-*.tar.gz 2>/dev/null | xargs -I {} basename {} || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="${BACKUP_DIR}/$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "=== ShieldLayer Restore Script ==="
echo "Restoring from: $1"
echo ""

# Confirm before proceeding
read -p "This will overwrite current files. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

# Create a pre-restore backup
echo "Creating pre-restore backup..."
PRE_RESTORE_BACKUP="gen1-pre-restore-$(date +%Y-%m-%d-%H%M%S).tar.gz"
cd "${PROJECT_DIR}"
tar -czf "${BACKUP_DIR}/${PRE_RESTORE_BACKUP}" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='logs' \
    . 2>/dev/null
echo "Pre-restore backup saved: ${PRE_RESTORE_BACKUP}"

# Extract backup
echo "Extracting backup..."
cd "${PROJECT_DIR}"
tar -xzf "${BACKUP_FILE}"

# Restore environment files
echo "Restoring environment files..."
if [ -f "${BACKUP_DIR}/env/.env.local-"* ]; then
    cp "${BACKUP_DIR}"/env/.env.local-* .env.local 2>/dev/null || true
fi

# Restore PM2 process list
echo "Restoring PM2 process list..."
pm2 resurrect 2>/dev/null || true

# Rebuild
echo "Rebuilding..."
npm run build 2>/dev/null || echo "Warning: Build failed, please run 'npm run build' manually"

# Restart services
echo "Restarting services..."
pm2 restart shieldlayer-api shieldlayer-frontend 2>/dev/null || true

echo ""
echo "=== Restore Complete ==="
echo "Please verify the site is working correctly."
echo "If issues occur, restore from pre-restore backup: ${PRE_RESTORE_BACKUP}"
