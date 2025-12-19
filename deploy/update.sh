#!/bin/bash

# Update script for Kaka Malem
# Run this to deploy updates

set -e

APP_DIR="/var/www/KakaMalem"

echo "=========================================="
echo "  Updating Kaka Malem"
echo "=========================================="

cd $APP_DIR

echo "[1/4] Pulling latest changes..."
git pull origin main

echo "[2/4] Installing dependencies..."
pnpm install

echo "[3/4] Building application..."
pnpm build

echo "[4/4] Restarting PM2..."
pm2 restart KakaMalem

echo ""
echo "=========================================="
echo "  Update Complete!"
echo "=========================================="
pm2 status
