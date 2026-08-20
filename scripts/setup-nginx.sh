#!/bin/bash
# ShieldLayer Nginx Setup
# Run: sudo bash /root/shieldlayer/scripts/setup-nginx.sh
set -e

echo "=== ShieldLayer Nginx Setup ==="

# Install config
cp /root/shieldlayer/config/nginx-gen1.conf /etc/nginx/sites-available/shieldlayer
ln -sf /etc/nginx/sites-available/shieldlayer /etc/nginx/sites-enabled/shieldlayer
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and reload
nginx -t
systemctl reload nginx

echo "Nginx configured for ${SERVER_HOST}"
echo "HTTPS: https://${SERVER_HOST}"
