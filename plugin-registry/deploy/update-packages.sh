#!/bin/bash
# Update npm packages to latest versions
set -e

echo "📦 ZAL Plugin Registry Package Update"
echo "======================================"
echo ""

APP_DIR="/var/www/zalcli-registry"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Backup env files
echo "💾 Backing up config..."
cp "$APP_DIR/server/.env" /tmp/server.env.backup
cp "$APP_DIR/client/.env" /tmp/client.env.backup 2>/dev/null || true

# Stop service
echo "⏸️  Stopping service..."
systemctl stop zalcli-registry

# Update server packages
echo ""
echo "📦 Updating server packages..."
cd "$APP_DIR/server"

echo "Current versions:"
npm list --depth=0 2>/dev/null || true

echo ""
echo "Updating packages..."
npm update
npm audit fix --force || true

echo ""
echo "Rebuilding server..."
npm run build

# Update client packages
echo ""
echo "📦 Updating client packages..."
cd "$APP_DIR/client"

echo "Current versions:"
npm list --depth=0 2>/dev/null || true

echo ""
echo "Updating packages..."
npm update
npm audit fix --force || true

echo ""
echo "Rebuilding client..."
npm run build

# Restore env files
cp /tmp/server.env.backup "$APP_DIR/server/.env"
if [ -f /tmp/client.env.backup ]; then
  cp /tmp/client.env.backup "$APP_DIR/client/.env"
fi

# Restart
echo ""
echo "🔄 Restarting service..."
systemctl restart zalcli-registry
systemctl reload nginx

# Cleanup
rm -f /tmp/server.env.backup /tmp/client.env.backup

echo ""
echo "✅ Package update complete!"
echo ""
echo "📋 New versions:"
echo ""
echo "Server:"
cd "$APP_DIR/server"
npm list --depth=0 2>/dev/null | head -20

echo ""
echo "Client:"
cd "$APP_DIR/client"
npm list --depth=0 2>/dev/null | head -20

echo ""
systemctl status zalcli-registry --no-pager -l | head -15
