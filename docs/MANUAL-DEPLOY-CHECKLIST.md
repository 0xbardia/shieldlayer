# Manual GenLayer deploy (human-in-the-loop)

This host cannot complete a signed deploy. There is no funded testnet key here, and `genlayer` CLI was not available until optional install. Studio deploy requires a browser wallet.

## Why automation stopped

1. `gen_call` / `eth_*` to `https://studio.genlayer.com/api` work **without** a key (reads).
2. Writes and deploys require a wallet with GEN on chain **61999** (GenLayer Studio).
3. Faucet is browser-gated: https://testnet-faucet.genlayer.foundation
4. No operator private key is stored in this repo (by design).

## Steps (Studio)

1. Install MetaMask. Add GenLayer Studio:
   - RPC: `https://studio.genlayer.com/api`
   - Chain ID: `61999` (`0xF22F`)
   - Symbol: `GEN`
   - Explorer: `https://explorer-studio.genlayer.com`
2. Request test GEN from the faucet above.
3. Open https://studio.genlayer.com/ and connect the same wallet.
4. Upload `/root/gen1/contract/main.py`.
5. Constructor: `initial_owner` = your address, `reserve_ratio_bps` = `1000`.
6. Deploy. Copy **contract address** and **deployment tx hash**.
7. Put them in `.env.local`:
   ```
   PUBLIC_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   ```
8. `pm2 restart gen1-api gen1-frontend` (only those two names).
9. Confirm `/api/health` shows a non-zero `contract` and `contractDeployed: true`.
10. Fund the pool (`fund_pool`) then buy a small policy and file a claim. Archive the payout tx on the Studio explorer.

## CLI (if you install `npm i -g genlayer` on a machine with a key)

```
genlayer network studio
genlayer deploy --contract /root/gen1/contract/main.py --args 0xYOURADDRESS 1000
```

Do not paste a production key into this host.
