# Rollback Procedure

## Overview

This document describes how to rollback ShieldLayer to a previous version.

## When to Rollback

Rollback should be considered when:
- Critical bugs are discovered in production
- Performance issues occur after deployment
- Security vulnerabilities are introduced
- Service becomes unstable

## Pre-Rollback Checklist

Before rolling back:
1. [ ] Identify the issue requiring rollback
2. [ ] Notify team members
3. [ ] Document the issue in incident log
4. [ ] Create a backup of current state
5. [ ] Identify the target rollback version

## Rollback Steps

### Method 1: Using Rollback Script (Recommended)

```bash
# List available versions
cd /root/gen1
git tag -l

# Rollback to specific version
bash scripts/rollback.sh v1.0.0

# Or rollback to specific commit
bash scripts/rollback.sh abc1234
```

### Method 2: Manual Rollback

```bash
cd /root/gen1

# Create backup
bash scripts/backup.sh

# Stop services
pm2 stop shieldlayer-api shieldlayer-frontend

# Checkout previous version
git checkout <tag-or-commit>

# Install dependencies
npm install
pip3 install -r requirements.txt

# Rebuild
npm run build

# Restart services
pm2 start ecosystem.config.js
pm2 save

# Verify
pm2 status
curl http://localhost:3456
curl http://localhost:8787/api/health
```

## Post-Rollback Verification

After rollback, verify:
1. [ ] Frontend loads correctly: `curl -I http://localhost:3456`
2. [ ] API responds: `curl http://localhost:8787/api/health`
3. [ ] PM2 services are online: `pm2 status`
4. [ ] No errors in logs: `pm2 logs --lines 50`
5. [ ] Test critical user flows

## Rolling Forward (Re-deploy)

If the issue is fixed and you want to deploy again:

```bash
cd /root/gen1

# Pull latest changes
git checkout main
git pull origin main

# Rebuild and restart
npm install
npm run build
pm2 restart shieldlayer-api shieldlayer-frontend
pm2 save
```

## Git Tagging

To create a rollback point:

```bash
cd /root/gen1

# Tag current version
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0

# List tags
git tag -l
```

## Emergency Rollback

If the service is completely down:

```bash
# Quick restart
pm2 restart shieldlayer-api shieldlayer-frontend

# If that fails, check logs
pm2 logs --lines 100

# If still failing, use last known good backup
bash scripts/restore.sh gen1-backup-YYYY-MM-DD-HHMMSS.tar.gz
```

## Contact

For rollback issues or questions, contact the development team.
