#!/bin/bash
# Quick update script - updates code without reinstalling dependencies
set -e

echo "⚡ ZAL Plugin Registry Quick Update"
echo "===================================="
echo ""

APP_DIR="/var/www/zalcli-registry"
REPO_DIR="/opt/zalcli"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

cd "$REPO_DIR"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Backup env files
echo "💾 Backing up config..."
cp "$APP_DIR/server/.env" /tmp/server.env.backup
cp "$APP_DIR/client/.env" /tmp/client.env.backup 2>/dev/null || true

# Stop service
echo "⏸️  Stopping service..."
systemctl stop zalcli-registry

# Update server code
echo "🔨 Updating server..."
rsync -av --exclude='.git' \
          --exclude='node_modules' \
          --exclude='dist' \
          --exclude='.env' \
          --exclude='data' \
          --exclude='package-lock.json' \
          "$REPO_DIR/plugin-registry/server/" "$APP_DIR/server/"

cp /tmp/server.env.backup "$APP_DIR/server/.env"

cd "$APP_DIR/server"
npm run build

# Update client code
echo "🔨 Updating client..."
rsync -av --exclude='.git' \
          --exclude='node_modules' \
          --exclude='dist' \
          --exclude='.env' \
          --exclude='package-lock.json' \
          "$REPO_DIR/plugin-registry/client/" "$APP_DIR/client/"

if [ -f /tmp/client.env.backup ]; then
  cp /tmp/client.env.backup "$APP_DIR/client/.env"
fi

cd "$APP_DIR/client"
npm run build

# Restart
echo "🔄 Restarting..."
systemctl restart zalcli-registry
systemctl reload nginx

# Cleanup
rm -f /tmp/server.env.backup /tmp/client.env.backup

echo ""
echo "✅ Quick update complete!"
echo ""
systemctl status zalcli-registry --no-pager -l | head -15
