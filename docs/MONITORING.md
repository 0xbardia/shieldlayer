# Monitoring & Alerting

## Overview

This document describes the monitoring and alerting setup for the ShieldLayer dApp.

## Health Checks

### Automated Health Checks

A health check script runs every minute via cron:
```
* * * * * /root/shieldlayer/scripts/health-check.sh >> /root/shieldlayer/logs/health-check.log 2>&1
```

### What is Monitored

| Service | Endpoint | Check Method |
|---------|----------|--------------|
| Frontend | http://localhost:3456 | HTTP GET |
| API | http://localhost:8787/api/health | HTTP GET |

### System Metrics

The health check also monitors:
- **Memory Usage:** Percentage of RAM used
- **Disk Usage:** Percentage of disk used
- **Load Average:** System load

## Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Service Down | 1 check | 3 consecutive checks |
| Memory Usage | > 80% | > 90% |
| Disk Usage | > 80% | > 90% |
| Load Average | > 4.0 | > 8.0 |

## Log Files

| Log | Location | Rotation |
|-----|----------|----------|
| API Application | /root/shieldlayer/logs/api.log | 10MB, keep 5 |
| API Errors | /root/shieldlayer/logs/api-error.log | 10MB, keep 5 |
| Health Checks | /root/shieldlayer/logs/health-check.log | Manual |
| PM2 Logs | ~/.pm2/logs/ | pm2-logrotate |

## Endpoints

### Health Check
```
GET /api/health
```

Response:
```json
{
  "ok": true,
  "contract": "0x...",
  "rpc": "https://rpc.genlayer.com",
  "chainId": "1391",
  "rpcReachable": true,
  "localMode": true
}
```

### Metrics (Future)
```
GET /api/metrics
```

## Uptime Monitoring

For external uptime monitoring, consider:
- **UptimeRobot:** Free tier, 5-minute checks
- **Pingdom:** Paid, 1-minute checks
- **Grafana Cloud:** Free tier available

### Setup with UptimeRobot

1. Create account at uptimerobot.com
2. Add new monitor:
   - Type: HTTP(s)
   - URL: http://${SERVER_HOST}:8787/api/health
   - Interval: 5 minutes
3. Configure alerts:
   - Email notification
   - Slack webhook (optional)

## Dashboard

For a comprehensive dashboard, consider:
- **Grafana:** Open-source, supports Prometheus metrics
- **PM2 Plus:** Built-in PM2 monitoring
- **Datadog:** Enterprise-grade (paid)

## Incident Response

### Service Down

1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs --lines 50`
3. Restart service: `pm2 restart shieldlayer-api shieldlayer-frontend`
4. If persists, check system resources: `free -h && df -h`

### High Memory Usage

1. Check PM2 memory: `pm2 monit`
2. Restart memory-heavy service
3. Consider increasing `max_memory_restart` in ecosystem.config.js

### High Disk Usage

1. Check disk: `df -h`
2. Clean logs: `find /root/shieldlayer/logs -name "*.log" -mtime +7 -delete`
3. Clean PM2 logs: `pm2 flush`
4. Clean npm cache: `npm cache clean --force`

## Escalation

| Severity | Response Time | Action |
|----------|---------------|--------|
| P1 - Service Down | Immediate | Restart service, investigate |
| P2 - Degraded | 1 hour | Monitor, plan fix |
| P3 - Warning | 24 hours | Schedule maintenance |
