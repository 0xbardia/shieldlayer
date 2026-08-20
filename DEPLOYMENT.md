# Deployment

## 1. GenLayer Studio

1. Open https://studio.genlayer.com/
2. Create a new Intelligent Contract.
3. Upload / paste `contract/main.py` as **`main.py`**.
4. Deploy. Copy the contract address.
5. Set `PUBLIC_CONTRACT_ADDRESS` and `NEXT_PUBLIC_CONTRACT_ADDRESS` to that address.

Writes (`purchase_policy`, `file_claim`) are signed by users in MetaMask. The API never holds a key.

## 2. Vercel

```bash
npm i -g vercel
vercel env add PUBLIC_CONTRACT_ADDRESS
vercel env add GENLAYER_RPC_URL
vercel --prod
```

`vercel.json` builds `@vercel/python` for `api/**/*.py` and `@vercel/next` for the app.

## 3. Local production check

```bash
npm run build
PORT=3456 npm start
```

Python API (optional local):

```bash
API_PORT=8787 python3 api/server.py
```

Development: `next.config.js` rewrites `/api/*` to `API_INTERNAL_URL` (default `http://127.0.0.1:8787`).

Production / PM2: rewrites are disabled. Next.js `src/app/api/[...path]/route.ts` proxies to the Python process.

Vercel: `vercel.json` sends `/api/*` to `api/index.py`.
