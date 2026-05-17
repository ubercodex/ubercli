#!/bin/bash
set -e

echo "🔄 UberCLI Plugin Registry Update Script"
echo "========================================"
echo ""

# Configuration
REPO_DIR="/opt/ubercli"
APP_DIR="/var/www/ubercli-registry"
SERVICE_NAME="ubercli-registry"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Check if repo exists
if [ ! -d "$REPO_DIR" ]; then
  echo "❌ Repository not found at $REPO_DIR"
  echo "Please clone the repository first:"
  echo "  git clone https://github.com/ubercodex/ubercli.git /opt/ubercli"
  exit 1
fi

# Check if app is deployed
if [ ! -d "$APP_DIR" ]; then
  echo "❌ Application not found at $APP_DIR"
  echo "Please run the initial deployment first:"
  echo "  cd /opt/ubercli/plugin-registry/deploy"
  echo "  sudo ./deploy.sh <domain> <email>"
  exit 1
fi

echo "📂 Repository: $REPO_DIR"
echo "📂 Application: $APP_DIR"
echo ""

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
cd "$REPO_DIR"
git fetch origin
CURRENT_COMMIT=$(git rev-parse HEAD)
LATEST_COMMIT=$(git rev-parse origin/main)

if [ "$CURRENT_COMMIT" = "$LATEST_COMMIT" ]; then
  echo "✅ Already up to date (commit: ${CURRENT_COMMIT:0:7})"
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Update cancelled"
    exit 0
  fi
else
  echo "📦 New changes available:"
  git log --oneline HEAD..origin/main | head -5
  echo ""
  git pull origin main
  echo "✅ Updated to commit: ${LATEST_COMMIT:0:7}"
fi

echo ""
echo "🔄 Updating application files..."

# Backup current .env files
echo "💾 Backing up configuration..."
cp "$APP_DIR/server/.env" /tmp/server.env.backup
cp "$APP_DIR/client/.env" /tmp/client.env.backup 2>/dev/null || true

# Stop the service
echo "⏸️  Stopping service..."
systemctl stop $SERVICE_NAME

# Update server
echo "📦 Updating server..."
rm -rf "$APP_DIR/server/src"
rm -rf "$APP_DIR/server/package.json"
rm -rf "$APP_DIR/server/tsconfig.json"

# Copy server files (excluding .git, node_modules, etc.)
rsync -av --exclude='.git' \
          --exclude='node_modules' \
          --exclude='dist' \
          --exclude='.env' \
          --exclude='data' \
          "$REPO_DIR/plugin-registry/server/" "$APP_DIR/server/"

# Restore .env
cp /tmp/server.env.backup "$APP_DIR/server/.env"

# Update dependencies and rebuild
cd "$APP_DIR/server"
echo "📦 Installing server dependencies..."
npm install
echo "🔨 Building server..."
npm run build

# Update client
echo "📦 Updating client..."
rm -rf "$APP_DIR/client/src"
rm -rf "$APP_DIR/client/public"
rm -rf "$APP_DIR/client/package.json"
rm -rf "$APP_DIR/client/tsconfig.json"
rm -rf "$APP_DIR/client/vite.config.ts"
rm -rf "$APP_DIR/client/tailwind.config.js"
rm -rf "$APP_DIR/client/postcss.config.js"
rm -rf "$APP_DIR/client/index.html"

# Copy client files (excluding .git, node_modules, etc.)
rsync -av --exclude='.git' \
          --exclude='node_modules' \
          --exclude='dist' \
          --exclude='.env' \
          "$REPO_DIR/plugin-registry/client/" "$APP_DIR/client/"

# Restore .env
if [ -f /tmp/client.env.backup ]; then
  cp /tmp/client.env.backup "$APP_DIR/client/.env"
fi

# Update dependencies and rebuild
cd "$APP_DIR/client"
echo "📦 Installing client dependencies..."
npm install
echo "🔨 Building client..."
npm run build

# Update shared types
echo "📦 Updating shared types..."
rm -rf "$APP_DIR/shared"
rsync -av --exclude='.git' "$REPO_DIR/plugin-registry/shared/" "$APP_DIR/shared/"

# Update SSL script
echo "📦 Updating SSL script..."
if [ -f "$REPO_DIR/plugin-registry/deploy/setup-ssl.sh" ]; then
  cp "$REPO_DIR/plugin-registry/deploy/setup-ssl.sh" "$APP_DIR/"
  chmod +x "$APP_DIR/setup-ssl.sh"
fi

# Set permissions
echo "🔒 Setting permissions..."
chmod 600 "$APP_DIR/server/.env"
chmod 600 "$APP_DIR/client/.env" 2>/dev/null || true
chmod 700 "$APP_DIR/server/data"
chmod -R 755 "$APP_DIR/client/dist"

# Restart service
echo "🔄 Restarting service..."
systemctl restart ubercli-registry

# Reload nginx to pick up new static files
echo "🔄 Reloading nginx..."
nginx -t && systemctl reload nginx

# Verify service status
echo "✅ Checking service status..."
if systemctl is-active --quiet ubercli-registry; then
  echo "✅ Service is running"
  systemctl status ubercli-registry --no-pager -l
else
  echo "❌ Service failed to start"
  journalctl -u ubercli-registry -n 50 --no-pager
  echo "📜 Error logs:"
  journalctl -u $SERVICE_NAME -n 20 --no-pager
  echo ""
  echo "💡 Restoring from backup..."
  # Could add rollback logic here
  exit 1
fi

# Cleanup
rm -f /tmp/server.env.backup /tmp/client.env.backup

echo ""
echo "✅ Update complete!"
echo ""
echo "📋 Summary:"
echo "  - Server: rebuilt and restarted"
echo "  - Client: rebuilt with new assets"
echo "  - Shared types: updated"
echo "  - Configuration: preserved"
echo "  - Service: running"
echo ""
