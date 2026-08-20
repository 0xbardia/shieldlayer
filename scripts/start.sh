#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "🚀 Starting ShieldLayer with PM2..."

if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm dependencies..."
  npm install --no-audit --no-fund
fi

echo "🔨 Building Next.js..."
npm run build

mkdir -p logs .data

if ! command -v pm2 >/dev/null 2>&1; then
  echo "📦 Installing PM2 locally..."
  npm install --no-save pm2
  PM2=./node_modules/.bin/pm2
else
  PM2=pm2
fi

echo "⚡ Starting PM2..."
"$PM2" start ecosystem.config.js
"$PM2" save || true

echo "✅ ShieldLayer is running!"
echo "🌐 Frontend: http://localhost:3456"
echo "🔌 API: http://localhost:8787/api/health"
echo ""
echo "📊 Monitor: pm2 monit"
echo "📝 Logs: pm2 logs"
echo "🔄 Restart: pm2 restart shieldlayer-api shieldlayer-frontend"
echo "⏹️  Stop: pm2 stop shieldlayer-api shieldlayer-frontend"
