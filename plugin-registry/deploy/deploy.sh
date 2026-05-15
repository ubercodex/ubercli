#!/bin/bash
set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: ./deploy.sh <domain> <email>"
  echo "Example: ./deploy.sh ubercli.com admin@ubercli.com"
  exit 1
fi

echo "🚀 Deploying UberCLI Plugin Registry to $DOMAIN"

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Nginx
echo "📦 Installing Nginx..."
apt-get install -y nginx

# Install Certbot
echo "📦 Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# Setup firewall
echo "🔥 Configuring firewall..."
apt-get install -y ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
echo "✅ Firewall configured"

# Create app directory
APP_DIR="/var/www/ubercli-registry"
echo "📁 Creating app directory at $APP_DIR..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or copy files (assuming you're running this from the repo)
echo "📥 Copying application files..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REGISTRY_DIR="$(dirname "$SCRIPT_DIR")"

cp -r "$REGISTRY_DIR/server" "$APP_DIR/"
cp -r "$REGISTRY_DIR/client" "$APP_DIR/"
cp -r "$REGISTRY_DIR/shared" "$APP_DIR/"

# Install server dependencies
echo "📦 Installing server dependencies..."
cd "$APP_DIR/server"
npm install
npm run build

# Create server .env
echo "⚙️  Creating server .env..."
cat > .env << EOF
DATABASE_URL=./data/registry.db
JWT_SECRET=$(openssl rand -base64 32)
GITHUB_CLIENT_ID=your-github-oauth-app-id
GITHUB_CLIENT_SECRET=your-github-oauth-secret
PORT=3001
NODE_ENV=production
HOST=127.0.0.1
EOF

echo "⚠️  IMPORTANT: Edit $APP_DIR/server/.env and add your GitHub OAuth credentials"

# Install client dependencies and build
echo "📦 Building client..."
cd "$APP_DIR/client"

# Create client .env
cat > .env << EOF
VITE_API_URL=https://$DOMAIN/api
VITE_GITHUB_CLIENT_ID=your-github-oauth-app-id
EOF

npm install
npm run build

# Create systemd service for server
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/ubercli-registry.service << EOF
[Unit]
Description=UberCLI Plugin Registry API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Start and enable service
systemctl daemon-reload
systemctl enable ubercli-registry
systemctl start ubercli-registry

echo "✅ Server service started"

# Set secure file permissions
echo "🔒 Setting file permissions..."
# Make .env files readable only by root
chmod 600 "$APP_DIR/server/.env"
chmod 600 "$APP_DIR/client/.env"

# Protect database directory
chmod 700 "$APP_DIR/server/data"

# Make deployment scripts non-executable from web
chmod 600 "$APP_DIR/deploy/"*.sh

# Ensure node_modules are not web-accessible
find "$APP_DIR" -name "node_modules" -type d -exec chmod 700 {} \;

# Protect source files
chmod -R 600 "$APP_DIR/server/src"
chmod -R 600 "$APP_DIR/shared"

# Only dist/ should be readable by nginx
chmod -R 755 "$APP_DIR/client/dist"

echo "✅ File permissions secured"

# Configure Nginx
echo "⚙️  Configuring Nginx..."
cat > /etc/nginx/sites-available/ubercli << EOF
# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=auth_limit:10m rate=5r/m;

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Block access to sensitive files and directories
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~* \.(env|git|db|sqlite|log|json|md|sh|sql|bak|config|ini|yml|yaml)\$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Block direct access to server directories
    location ~ ^/(server|shared|deploy|node_modules)/ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Block common attack patterns
    location ~* (wp-admin|wp-login|phpMyAdmin|phpmyadmin|mysql|admin|administrator) {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Client (static files only from dist/)
    root $APP_DIR/client/dist;
    index index.html;

    # API proxy with rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;

        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout protection
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # Auth endpoints - stricter rate limit
    location /api/auth/ {
        limit_req zone=auth_limit burst=3 nodelay;
        limit_req_status 429;

        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # SPA fallback (only for HTML routes)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Deny access to source maps in production
    location ~* \.map\$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ubercli /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

echo "✅ Nginx configured"

# Setup SSL with Let's Encrypt
echo "🔒 Setting up SSL certificate..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

echo "✅ SSL certificate installed"

# Setup auto-renewal
echo "⚙️  Setting up SSL auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your registry is now live at: https://$DOMAIN"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Edit $APP_DIR/server/.env and add GitHub OAuth credentials"
echo "2. Edit $APP_DIR/client/.env and add GitHub OAuth client ID"
echo "3. Restart the service: systemctl restart ubercli-registry"
echo "4. Rebuild client: cd $APP_DIR/client && npm run build"
echo ""
echo "📊 Useful commands:"
echo "  - Check server logs: journalctl -u ubercli-registry -f"
echo "  - Restart server: systemctl restart ubercli-registry"
echo "  - Check server status: systemctl status ubercli-registry"
echo "  - Nginx logs: tail -f /var/log/nginx/error.log"
echo ""
