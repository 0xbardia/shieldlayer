#!/bin/bash
# ShieldLayer HTTPS Activation
# Run: sudo bash /root/shieldlayer/scripts/activate-https.sh
set -e

echo "=== ShieldLayer HTTPS Activation ==="

# Generate cert if missing
if [ ! -f /etc/ssl/certs/gen1-selfsigned.crt ]; then
    openssl req -x509 -newkey rsa:2048 \
        -keyout /etc/ssl/private/gen1-selfsigned.key \
        -out /etc/ssl/certs/gen1-selfsigned.crt \
        -days 365 \
        -subj "/C=US/ST=State/L=City/O=ShieldLayer/CN=${SERVER_HOST}"
    echo "SSL cert generated"
fi

# Install nginx config
cp /root/shieldlayer/config/nginx-gen1.conf /etc/nginx/sites-available/shieldlayer
ln -sf /etc/nginx/sites-available/shieldlayer /etc/nginx/sites-enabled/shieldlayer

# Reload
nginx -t && systemctl reload nginx

echo "HTTPS activated for ${SERVER_HOST}"
echo "Test: curl -k https://${SERVER_HOST}/"
echo "Test: curl -I -k https://${SERVER_HOST}/"
