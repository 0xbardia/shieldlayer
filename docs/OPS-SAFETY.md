# Ops safety (shared host)

This machine also runs other PM2 apps (`reyaradar-*`, `highcast`, `arcvault`, `pop-dapp`, …).

`pm2 stop all`, `pm2 delete all`, and `pm2 kill` will take those services down. **Never use them.**

Safe commands (from `/root/gen1`):

```bash
npm run stop       # shieldlayer-api + shieldlayer-frontend only
npm run restart    # same
bash scripts/safe-pm2.sh stop shieldlayer-api shieldlayer-frontend
```

`scripts/safe-pm2.sh` refuses `all` and any name that does not start with `shieldlayer-` (legacy `gen1-*` still accepted). Every invocation is appended to `logs/pm2-commands.log`.
