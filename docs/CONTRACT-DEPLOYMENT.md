# ShieldLayer Contract Deployment Guide

## Overview
The ShieldLayer parametric insurance smart contract is deployed via GenLayer Studio.
Contract file: `/root/shieldlayer/contract/main.py`

## Prerequisites
- GenLayer Studio account: https://studio.genlayer.com/
- Wallet with testnet ETH (for gas fees)
- Python contract validated (syntax check passed)

## Deployment Steps

### 1. Open GenLayer Studio
Navigate to https://studio.genlayer.com/ and connect your wallet.

### 2. Create New Contract
- Click "New Contract" or "Deploy"
- Upload `contract/main.py` or paste the contract code
- Set contract name: `ShieldLayerInsurance`

### 3. Configure Parameters
The contract accepts these constructor parameters:
- No constructor parameters required (uses defaults)

### 4. Deploy
- Click "Deploy"
- Confirm the transaction in your wallet
- Wait for deployment confirmation
- Copy the contract address (0x...)

### 5. Update Environment
After deployment, update `.env.local`:
```
PUBLIC_CONTRACT_ADDRESS=0x_YOUR_CONTRACT_ADDRESS
NEXT_PUBLIC_CONTRACT_ADDRESS=0x_YOUR_CONTRACT_ADDRESS
GENLAYER_LOCAL_MODE=0
```

### 6. Restart Services
```bash
pm2 restart shieldlayer-api shieldlayer-frontend
```

### 7. Verify
```bash
curl -k https://${SERVER_HOST}/api/stats
```

## Expected Gas Costs
- Deployment: ~0.01-0.05 ETH (testnet)
- Policy creation: ~0.001-0.01 ETH per policy
- Claims processing: ~0.002-0.02 ETH per claim

## Troubleshooting
- **Import errors**: Ensure `genlayer` package is available in Studio
- **Gas estimation failed**: Check wallet balance
- **Transaction reverted**: Check contract parameters
- **Network issues**: Switch to testnet in wallet settings

## Current Status
- [ ] Contract deployed to GenLayer Studio
- [ ] Contract address added to .env.local
- [ ] GENLAYER_LOCAL_MODE set to 0
- [ ] Services restarted
- [ ] API endpoints verified
