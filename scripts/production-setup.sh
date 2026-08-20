#!/bin/bash
# ShieldLayer HTTPS + Production Setup Script
# Run: sudo bash /root/shieldlayer/scripts/production-setup.sh
set -e

echo "=== ShieldLayer Production Setup ==="

# --- SSL Certificate ---
echo "[1/6] Generating self-signed SSL certificate..."
if [ -f /etc/ssl/certs/gen1-selfsigned.crt ]; then
    echo "  SSL cert already exists, skipping"
else
    openssl req -x509 -newkey rsa:2048 \
        -keyout /etc/ssl/private/gen1-selfsigned.key \
        -out /etc/ssl/certs/gen1-selfsigned.crt \
        -days 365 \
        -subj "/C=US/ST=State/L=City/O=ShieldLayer/CN=${SERVER_HOST}"
    echo "  SSL cert generated"
fi

# --- Nginx Config ---
echo "[2/6] Installing nginx config..."
cp /root/shieldlayer/config/nginx-gen1.conf /etc/nginx/sites-available/shieldlayer
ln -sf /etc/nginx/sites-available/shieldlayer /etc/nginx/sites-enabled/shieldlayer
rm -f /etc/nginx/sites-enabled/gen1
echo "  Nginx config installed and enabled"

# --- Test & Reload Nginx ---
echo "[3/6] Testing and reloading nginx..."
nginx -t
systemctl reload nginx
echo "  Nginx reloaded"

# --- Firewall ---
echo "[4/6] Opening firewall ports..."
ufw allow 80/tcp comment "HTTP (port 80)" 2>/dev/null || true
ufw allow 443/tcp comment "HTTPS (port 443)" 2>/dev/null || true
ufw reload 2>/dev/null || true
echo "  Firewall ports opened"

# --- DNS Fix ---
echo "[5/6] Configuring DNS resolvers..."
cat > /etc/resolv.conf << 'EOF'
# ShieldLayer DNS Configuration
nameserver 8.8.8.8
nameserver 1.1.1.1
nameserver 9.9.9.9
EOF
echo "  DNS resolvers configured"

# --- Verify ---
echo "[6/6] Verifying setup..."
echo "  Nginx status:"
systemctl is-active nginx
echo "  Ports listening:"
ss -tlnp | grep -E ':80|:443' | head -3
echo "  DNS test:"
python3 -c "import socket; print('  rpc.genlayer.com:', socket.gethostbyname('rpc.genlayer.com'))" 2>/dev/null || echo "  DNS: rpc.genlayer.com not yet resolvable (may need time)"

echo ""
echo "=== Setup Complete ==="
echo "HTTPS: https://${SERVER_HOST}"
echo "Test: curl -k https://${SERVER_HOST}/"
echo "Test: curl -I -k https://${SERVER_HOST}/"
