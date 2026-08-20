# Backup & Recovery Strategy

## Overview

This document describes the backup and recovery procedures for ShieldLayer.

## Backup Strategy

### What is Backed Up

| Item | Location | Frequency |
|------|----------|-----------|
| Environment files | `.env.local`, `.env.example` | Daily |
| Configuration | `ecosystem.config.js`, `next.config.js` | Daily |
| Contract source | `contract/main.py` | Daily |
| Contract state | `.data/contract.pkl` | Daily |
| PM2 process list | `~/.pm2/dump.pm2` | Daily |
| Full project | `/root/gen1/` | Daily |

### Backup Location

All backups are stored in `/root/backups/` with the naming convention:
```
gen1-backup-YYYY-MM-DD-HHMMSS.tar.gz
```

### Retention Policy

- **Last 30 backups** are kept automatically
- Older backups are automatically deleted
- **RPO (Recovery Point Objective):** 24 hours (daily backups)
- **RTO (Recovery Time Objective):** 1 hour (restore + rebuild)

### Backup Schedule

Daily backups run at 2:00 AM via cron:
```
0 2 * * * /root/gen1/scripts/backup.sh >> /root/backups/cron.log 2>&1
```

## Manual Backup

To create a manual backup:
```bash
bash /root/gen1/scripts/backup.sh
```

## Restore Procedure

### Step 1: List Available Backups
```bash
ls -la /root/backups/gen1-backup-*.tar.gz
```

### Step 2: Restore from Backup
```bash
bash /root/gen1/scripts/restore.sh gen1-backup-YYYY-MM-DD-HHMMSS.tar.gz
```

### Step 3: Verify Restoration
```bash
# Check PM2 status
pm2 status

# Test frontend
curl -I http://localhost:3456

# Test API
curl http://localhost:8787/api/health
```

### Step 4: If Issues Occur
Restore from the pre-restore backup:
```bash
bash /root/gen1/scripts/restore.sh gen1-pre-restore-YYYY-MM-DD-HHMMSS.tar.gz
```

## Emergency Recovery

If the server is completely down:

1. **Provision new server** with same specs
2. **Install dependencies:**
   ```bash
   # Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Python
   sudo apt-get install -y python3 python3-pip
   
   # PM2
   npm install -g pm2
   ```
3. **Copy backups** from remote storage
4. **Restore using script**
5. **Configure firewall and SSL**

## Monitoring Backups

Check backup status:
```bash
# View backup log
tail -20 /root/backups/backup.log

# Check latest backup
ls -lt /root/backups/gen1-backup-*.tar.gz | head -5

# Verify backup integrity
tar -tzf /root/backups/gen1-backup-YYYY-MM-DD-HHMMSS.tar.gz > /dev/null
```

## Notes

- **Blockchain data** is not backed up (it's on the GenLayer network)
- **Smart contract state** on-chain is immutable and cannot be lost
- **Local contract cache** (`.data/contract.pkl`) is backed up for recovery
- **Node modules** and **.next build** are excluded from backups (rebuildable)
