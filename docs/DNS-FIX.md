# DNS Resolution Fix for ShieldLayer

## Problem
`rpc.genlayer.com` does not resolve (NXDOMAIN) from any DNS resolver
(Google 8.8.8.8, Cloudflare 1.1.1.1, Quad9 9.9.9.9).

This is a GenLayer infrastructure issue - the subdomain hasn't been created yet.

## Solution
Updated all RPC references to use `rpc-asimov.genlayer.com` which resolves
and returns chain ID 4221 (0x107d).

## Files Changed
- `.env.local`: GENLAYER_RPC_URL, GENLAYER_CHAIN_ID, NEXT_PUBLIC_*
- `src/lib/constants.ts`: Fallback defaults updated
- `api/_core.py`: Fallback defaults updated
- `config/nginx-gen1.conf`: CSP connect-src updated

## Verification
```bash
# DNS resolution
dig +short rpc-asimov.genlayer.com @8.8.8.8
# Returns: 172.67.210.182, 104.21.53.84

# RPC connectivity
curl -X POST https://rpc-asimov.genlayer.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# Returns: {"jsonrpc":"2.0","result":"0x107d","id":1}
```

## When rpc.genlayer.com Becomes Available
If GenLayer creates `rpc.genlayer.com` in the future:
1. Update `.env.local`:
   ```
   GENLAYER_RPC_URL=https://rpc.genlayer.com
   GENLAYER_CHAIN_ID=1391
   NEXT_PUBLIC_RPC_URL=https://rpc.genlayer.com
   NEXT_PUBLIC_CHAIN_ID=1391
   ```
2. Update `src/lib/constants.ts` fallback defaults
3. Update `api/_core.py` fallback defaults
4. Update `config/nginx-gen1.conf` CSP header
5. Restart: `pm2 restart shieldlayer-api shieldlayer-frontend`

## Current Status
- [x] DNS diagnosed (rpc.genlayer.com = NXDOMAIN)
- [x] Alternative endpoint found (rpc-asimov.genlayer.com)
- [x] All code references updated
- [x] Tests passing (49/49)
- [x] Build succeeds
- [x] PM2 services restarted
