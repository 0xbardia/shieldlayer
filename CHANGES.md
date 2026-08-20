# Changes (audit remediation)

## Critical
- **C-001** Wallet writes use `writeContract` (`genlayer-js` when present) plus a typed signed payload; premium is sent as `value`. No raw JSON-as-EVM-calldata-only path.
- **C-002** `purchase_policy` requires `msg.value >= premium`; pool and `contract_balance` track received funds; payouts decrement both; `pending_funding` + `settle_claim`; `withdraw_excess` for owner.
- **C-003** `next.config.js` rewrites only in development. Production uses `src/app/api/[...path]/route.ts`. `vercel.json` routes `/api/*` to Python.
- **C-004** RPC reads retry 3× then 503 (or explicit `GENLAYER_LOCAL_MODE` file store). `/api/read` allowlists view methods only (403 on writes). Circuit breaker serves short TTL cache after 5 failures when not in local mode.

## High
- WalletConnect via `@walletconnect/ethereum-provider`.
- File-claim modal + settle/poll on claim detail.
- `.env.local` / `.env*.local` gitignored; `.env.example` has keys only.
- Premium bps 200/250/350 in contract and UI.
- Real CORS allowlist + token-bucket rate limits (429 + headers).
- Address validation on claims.
- Chromium test asserts zero unexpected console errors.
- `web3` / `eth-account` used for signature recovery; RPC payload uses `functionName`/`args`.
- `npm audit` script added; Next left on patched 14.2.x (force-upgrade to 16 is breaking).

## Also
- ESLint 9 flat config.
- Mobile nav, `document.documentElement.dir`.
- PM2 `ecosystem.config.js` + `scripts/start.sh` + `PM2-SETUP.md`.
