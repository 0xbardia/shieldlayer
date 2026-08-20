# 🛡️ ShieldLayer

**Parametric Insurance on GenLayer** — AI-powered, automated claims settlement using smart contracts with built-in oracle consensus.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GenLayer](https://img.shields.io/badge/Built%20on-GenLayer-7B3FE4.svg)](https://genlayer.com)
[![CI](https://github.com/your-username/shieldlayer/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/shieldlayer/actions)

---

## What is ShieldLayer?

ShieldLayer is a **decentralized parametric insurance protocol** built on [GenLayer](https://genlayer.com). It enables fully automated insurance products where:

- **Claims are settled by AI oracles** — no claims adjusters, no paperwork
- **Users sign transactions from their browser** — no private keys on the server
- **Smart contracts enforce reserves and payouts** — transparent and trustless

### Supported Insurance Products

| Product | Trigger Event | Oracle Source |
|---------|---------------|---------------|
| ✈️ Flight Delay | Flight delayed > N hours | Flightradar24 + LLM verification |
| 🌪️ Storm | Wind speed exceeds threshold | Open-Meteo Archive API |
| 📉 Bankruptcy | Company files Chapter 7/11/15 | Google News RSS + LLM verification |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│            src/ — React + Tailwind + ethers         │
│         Users sign writes via MetaMask/WalletConnect │
└──────────────────────┬──────────────────────────────┘
                       │ reads via genlayer-js
                       │ writes signed in browser
┌──────────────────────▼──────────────────────────────┐
│              Smart Contract (GenLayer Python)        │
│              contract/main.py — ShieldLayer          │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Policy Mgmt │  │ Claims   │  │ Oracle Consensus│  │
│  │ purchase_   │  │ file_    │  │ fetch_evidence  │  │
│  │ policy()    │  │ claim()  │  │ + LLM verify    │  │
│  └─────────────┘  └──────────┘  └────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              API (FastAPI / Python)                   │
│              api/ — Read-only proxy                  │
│         No private keys, no write relay              │
└─────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- The **API is read-only** — it never holds private keys or signs transactions
- **Writes are signed in the browser** via MetaMask/WalletConnect
- **Oracle consensus** uses GenLayer's `run_nondet_unsafe` for multi-validator agreement
- **LLM tiebreaker** resolves ambiguous oracle responses with confidence scoring

---

## Prerequisites

- **Python 3.12+**
- **Node.js 20+**
- **Redis** (optional — for production rate limiting; `memory://` works for tests)
- **MetaMask** or WalletConnect-compatible wallet

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/shieldlayer.git
cd shieldlayer

# Install Python dependencies
python3 -m pip install -r requirements.txt

# Install Node.js dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local — see Environment section below

# Start development servers
npm run dev
```

This starts:
- **Frontend**: http://localhost:3456
- **API**: http://localhost:8787

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values. **Never commit `.env.local`.**

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_CONTRACT_ADDRESS` | Yes | Deployed contract address from GenLayer Studio |
| `GENLAYER_RPC_URL` | Yes | GenLayer RPC endpoint (default: `https://studio.genlayer.com/api`) |
| `GENLAYER_CHAIN_ID` | Yes | Chain ID (default: `61999` for Studio) |
| `REDIS_URL` | Production | Redis connection URL |
| `AVIATIONSTACK_API_KEY` | Optional | For flight data API |
| `OPENWEATHER_API_KEY` | Optional | For weather data API |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Optional | WalletConnect Cloud project ID |
| `SERVER_HOST` | Production | Server IP/domain for deployment scripts |

---

## Smart Contract

The contract (`contract/main.py`) is a **GenLayer Intelligent Contract** written in Python. It is NOT an EVM ABI contract.

### Deploying to GenLayer Studio

1. Open [GenLayer Studio](https://studio.genlayer.com/)
2. Create a new contract and upload `contract/main.py`
3. Deploy and copy the contract address
4. Set `PUBLIC_CONTRACT_ADDRESS` in your `.env.local`

See [docs/CONTRACT-DEPLOYMENT.md](docs/CONTRACT-DEPLOYMENT.md) for detailed instructions.

### Key Contract Functions

| Function | Type | Description |
|----------|------|-------------|
| `purchase_policy(type, coverage, eventData)` | Write (payable) | Buy an insurance policy |
| `file_claim(policy_id)` | Write | File a claim (triggers oracle verification) |
| `settle_claim(claim_id)` | Write | Retry/settle a pending claim |
| `fund_pool()` | Write (payable) | Add funds to the protocol pool |
| `get_stats()` | View | Get protocol statistics |
| `get_policy(id)` | View | Get policy details |
| `get_claim(id)` | View | Get claim details |

---

## API Reference

The Python API (`api/`) is a **read-only proxy** to the smart contract. It never signs transactions.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (contract + RPC reachability) |
| GET | `/api/stats` | Protocol statistics |
| GET | `/api/policies?address=0x...` | User's policies |
| GET | `/api/claims?address=0x...` | User's claims |
| POST | `/api/read` | Generic contract view call |

Full API docs: http://localhost:8787/docs (Swagger UI)

---

## Testing

```bash
# Run all tests (vitest + pytest)
npm run test

# JavaScript tests only
npm run test:js

# Python tests only
npm run test:py

# Type checking
npm run type-check

# Linting
npm run lint

# E2E tests (requires running servers)
npm run test:e2e
```

---

## Production Deployment

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start production services
npm run start:prod

# Check status
pm2 status
pm2 logs
```

### With Nginx + HTTPS

See [scripts/production-setup.sh](scripts/production-setup.sh) for automated setup:
```bash
sudo bash scripts/production-setup.sh
```

Requires `SERVER_HOST` environment variable set to your server IP/domain.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgments

Built on [GenLayer](https://genlayer.com) — the blockchain for Intelligent Contracts.
