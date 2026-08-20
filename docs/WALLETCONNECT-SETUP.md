# WalletConnect Project ID Setup Guide

## Overview
WalletConnect v2 requires a Project ID from WalletConnect Cloud.
This enables QR code wallet connections from mobile wallets.

## Prerequisites
- Email address for registration
- WalletConnect Cloud account: https://cloud.walletconnect.com

## Setup Steps

### 1. Register at WalletConnect Cloud
- Go to https://cloud.walletconnect.com/
- Click "Get Started" or "Sign Up"
- Enter your email and verify

### 2. Create New Project
- Click "New Project" or "Create"
- Project name: `ShieldLayer`
- Description: `Parametric insurance dApp`

### 3. Get Project ID
- After creation, find your Project ID
- It looks like: `abc123def456...` (32+ characters)
- Copy it to clipboard

### 4. Configure Domains
In WalletConnect Cloud project settings:
- Add allowed domains:
  - `https://${SERVER_HOST}`
  - `http://localhost:3456` (for development)

### 5. Update .env.local
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 6. Restart Frontend
```bash
pm2 restart shieldlayer-frontend
```

### 7. Test
- Open https://${SERVER_HOST}
- Click "Connect Wallet"
- Select WalletConnect
- Scan QR code with mobile wallet
- Verify connection succeeds

## Free Tier Limits
- 1,000 Monthly Active Users
- Unlimited projects
- Standard support

## Troubleshooting
- **"Project ID not found"**: Check the ID is correct in .env.local
- **QR code doesn't work**: Verify domains are whitelisted
- **Connection fails**: Check browser console for errors
- **Mobile wallet timeout**: Ensure wallet supports WalletConnect v2

## Current Status
- [ ] WalletConnect Cloud account created
- [ ] Project created
- [ ] Project ID added to .env.local
- [ ] Domains whitelisted
- [ ] Frontend restarted
- [ ] QR code connection tested
