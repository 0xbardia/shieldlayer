# PM2 production setup

PM2 is a **Node.js** process manager (`npm install -g pm2`). It is not installed via `pip`.

## Install

```bash
npm install -g pm2
# or use the local binary after npm install
```

## Start

```bash
cd /root/gen1
npm run start:prod
# or: bash scripts/start.sh
```

This builds Next.js, creates `logs/`, and starts:

| Process | URL |
|---|---|
| `shieldlayer-frontend` | http://localhost:3456 |
| `shieldlayer-api` | http://localhost:8787/api/health |

## Day-2 commands

```bash
pm2 monit          # live dashboard
pm2 logs           # combined logs
pm2 logs shieldlayer-api
pm2 restart shieldlayer-api shieldlayer-frontend
# Never: pm2 restart all / stop all / delete all (shared host)
pm2 startup        # systemd/launchd hook
pm2 save           # persist process list
```

## Log rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

Logs live in `./logs/` (`api-out.log`, `api-error.log`, `frontend-*.log`).

## Notes

- API uses `fork` (not cluster): a single Uvicorn worker. Cluster + `interpreter: none` + Uvicorn is unreliable.
- Frontend is `next start` with `API_INTERNAL_URL=http://127.0.0.1:8787`. Production Next.js does **not** rewrite `/api` to localhost at the Next config layer; `src/app/api/[...path]/route.ts` proxies to the Python process.
- Set `GENLAYER_LOCAL_MODE=0` and a real `PUBLIC_CONTRACT_ADDRESS` after Studio deploy.
