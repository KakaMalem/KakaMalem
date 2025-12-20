#!/bin/bash

# Optimized deploy script for Kaka Malem
# Skips unnecessary steps based on what changed

set -e

APP_DIR="/var/www/KakaMalem"
APP_NAME="KakaMalem"

echo "=========================================="
echo "  Deploying Kaka Malem"
echo "=========================================="

cd "$APP_DIR"

# Store current state
PREVIOUS_COMMIT=$(git rev-parse HEAD)
OLD_LOCK_HASH=$(md5sum pnpm-lock.yaml 2>/dev/null | cut -d' ' -f1 || echo "none")

echo "Current: $PREVIOUS_COMMIT"

# Pull latest changes
echo ""
echo "[1/4] Pulling latest changes..."
git fetch origin
git reset --hard origin/main

NEW_COMMIT=$(git rev-parse HEAD)
echo "Updated: $NEW_COMMIT"

if [ "$PREVIOUS_COMMIT" == "$NEW_COMMIT" ]; then
    echo "No changes to deploy"
    exit 0
fi

# Check if dependencies changed
NEW_LOCK_HASH=$(md5sum pnpm-lock.yaml | cut -d' ' -f1)

echo ""
if [ "$OLD_LOCK_HASH" != "$NEW_LOCK_HASH" ]; then
    echo "[2/4] Installing dependencies..."
    pnpm install --frozen-lockfile
else
    echo "[2/4] Dependencies unchanged, skipping"
fi

# Check if schema changed
SCHEMA_CHANGED=$(git diff --name-only $PREVIOUS_COMMIT $NEW_COMMIT -- 'src/collections/' 'src/globals/' 'src/payload.config.ts' | head -1)

echo ""
if [ -n "$SCHEMA_CHANGED" ]; then
    echo "[3/4] Generating types..."
    pnpm generate:types
else
    echo "[3/4] Schema unchanged, skipping"
fi

# Build
echo ""
echo "[4/4] Building..."
pnpm build

# Restart
echo ""
echo "Restarting $APP_NAME..."
pm2 restart $APP_NAME

echo ""
echo "=========================================="
echo "  Deploy Complete!"
echo "=========================================="
pm2 status
