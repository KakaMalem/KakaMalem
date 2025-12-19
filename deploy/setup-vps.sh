#!/bin/bash

# VPS Setup Script for Kaka Malem E-commerce
# Ubuntu 24.04 x64

set -e

echo "=========================================="
echo "  Kaka Malem VPS Setup Script"
echo "=========================================="

# Update system
echo "[1/7] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "[2/7] Installing essential packages..."
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# Install Node.js 20.x (LTS)
echo "[3/7] Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install pnpm globally
echo "[4/7] Installing pnpm..."
sudo npm install -g pnpm

# Install PM2 globally
echo "[5/7] Installing PM2..."
sudo npm install -g pm2

# Configure firewall
echo "[6/7] Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create app directory
echo "[7/7] Creating application directory..."
sudo mkdir -p /var/www/KakaMalem
sudo chown -R $USER:$USER /var/www/KakaMalem

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository to /var/www/KakaMalem"
echo "2. Copy .env.example to .env and configure it"
echo "3. Run: pnpm install && pnpm build"
echo "4. Configure Nginx (see deploy/nginx.conf)"
echo "5. Set up SSL with: sudo certbot --nginx -d kakamalem.com -d www.kakamalem.com"
echo "6. Start the app with PM2: pm2 start ecosystem.config.cjs"
echo ""
