#!/bin/bash
# ShieldLayer SSL Certificate Setup
# Run: sudo bash /root/shieldlayer/scripts/setup-ssl.sh
set -e

echo "=== ShieldLayer SSL Setup ==="

if [ -f /etc/ssl/certs/gen1-selfsigned.crt ]; then
    echo "SSL cert already exists, skipping"
    exit 0
fi

openssl req -x509 -newkey rsa:2048 \
    -keyout /etc/ssl/private/gen1-selfsigned.key \
    -out /etc/ssl/certs/gen1-selfsigned.crt \
    -days 365 \
    -subj "/C=US/ST=State/L=City/O=Gen1/CN=${SERVER_HOST}"

echo "SSL cert generated for ${SERVER_HOST}"
