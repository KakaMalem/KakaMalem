#!/bin/bash

# Rollback script for Kaka Malem
# Usage: ./rollback.sh [commit_hash]

set -e

APP_DIR="/var/www/KakaMalem"
APP_NAME="KakaMalem"
COMMIT_HASH=$1

echo "=========================================="
echo "  Rolling Back Kaka Malem"
echo "=========================================="

cd "$APP_DIR"

if [ -z "$COMMIT_HASH" ]; then
    COMMIT_HASH=$(git rev-parse HEAD~1)
    echo "Rolling back to previous commit"
fi

echo "Target: $COMMIT_HASH"

git reset --hard "$COMMIT_HASH"

echo ""
echo "[1/3] Installing dependencies..."
pnpm install --frozen-lockfile

echo ""
echo "[2/3] Building..."
pnpm build

echo ""
echo "[3/3] Restarting..."
pm2 restart $APP_NAME

echo ""
echo "=========================================="
echo "  Rollback Complete!"
echo "=========================================="
pm2 status
