# ZAL Plugin Registry Deployment Guide

Complete guide for deploying and maintaining the ZAL Plugin Registry.

## 📋 Prerequisites

- Ubuntu 20.04+ server
- Root access
- Domain name pointing to your server
- GitHub OAuth App credentials

## 🚀 Initial Deployment

### 1. Clone Repository

```bash
git clone https://github.com/ubercodex/zalcli.git /opt/zalcli
cd /opt/zalcli/plugin-registry/deploy
```

### 2. Run Deployment Script

```bash
chmod +x deploy.sh
sudo ./deploy.sh your-domain.com your-email@example.com
```

This will:
- Install Node.js, Nginx, Certbot
- Set up the application structure
- Configure systemd service
- Set up SSL with Let's Encrypt
- Configure Nginx with rate limiting and security headers

### 3. Configure Environment Variables

Edit server environment:
```bash
sudo nano /var/www/zalcli-registry/server/.env
```

Required variables:
```env
DATABASE_URL=./data/registry.db
JWT_SECRET=<generate-random-secret>
GITHUB_CLIENT_ID=<your-github-oauth-app-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-app-secret>
ADMIN_GITHUB_USERNAMES=yourusername,otheradmin
PORT=3001
NODE_ENV=production
HOST=127.0.0.1
```

Edit client environment:
```bash
sudo nano /var/www/zalcli-registry/client/.env
```

```env
VITE_API_URL=https://your-domain.com/api
VITE_GITHUB_CLIENT_ID=<same-as-server>
```

### 4. Rebuild and Restart

```bash
cd /var/www/zalcli-registry/server
sudo npm run build
sudo systemctl restart zalcli-registry

cd /var/www/zalcli-registry/client
sudo npm run build
```

### 5. Setup Custom Error Pages (Optional)

```bash
cd /opt/zalcli/plugin-registry/deploy
chmod +x setup-error-pages.sh
sudo ./setup-error-pages.sh
```

## 🔄 Updating

### Quick Update (Code Only)

For code changes without dependency updates:

```bash
cd /opt/zalcli/plugin-registry/deploy
chmod +x quick-update.sh
sudo ./quick-update.sh
```

**Time:** ~1-2 minutes

### Full Update (Code + Dependencies)

For major updates with new dependencies:

```bash
cd /opt/zalcli/plugin-registry/deploy
chmod +x update.sh
sudo ./update.sh
```

**Time:** ~3-5 minutes

### Package Updates Only

To update npm packages to latest versions:

```bash
cd /opt/zalcli/plugin-registry/deploy
chmod +x update-packages.sh
sudo ./update-packages.sh
```

**Time:** ~5-10 minutes

## 🛠️ Maintenance Commands

### Check Service Status

```bash
sudo systemctl status zalcli-registry
```

### View Logs

```bash
# Real-time logs
sudo journalctl -u zalcli-registry -f

# Last 50 lines
sudo journalctl -u zalcli-registry -n 50

# Errors only
sudo journalctl -u zalcli-registry -p err
```

### Restart Service

```bash
sudo systemctl restart zalcli-registry
```

### Rebuild Application

```bash
# Server
cd /var/www/zalcli-registry/server
sudo npm run build
sudo systemctl restart zalcli-registry

# Client
cd /var/www/zalcli-registry/client
sudo npm run build
```

### Check Nginx Configuration

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### View Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## 🔒 Security

### SSL Certificate Renewal

Certificates auto-renew via certbot timer. To manually renew:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Update Admin Users

Edit server .env:
```bash
sudo nano /var/www/zalcli-registry/server/.env
```

Update `ADMIN_GITHUB_USERNAMES`:
```env
ADMIN_GITHUB_USERNAMES=user1,user2,user3
```

Restart:
```bash
sudo systemctl restart zalcli-registry
```

### Backup Database

```bash
# Create backup
sudo cp /var/www/zalcli-registry/server/data/registry.db \
       /var/www/zalcli-registry/server/data/registry.db.backup-$(date +%Y%m%d)

# Restore backup
sudo cp /var/www/zalcli-registry/server/data/registry.db.backup-20260526 \
       /var/www/zalcli-registry/server/data/registry.db
sudo systemctl restart zalcli-registry
```

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u zalcli-registry -n 100

# Check environment variables
sudo systemctl show zalcli-registry | grep Environment

# Verify build
cd /var/www/zalcli-registry/server
ls -la dist/
```

### OAuth Not Working

1. Check GitHub OAuth app settings:
   - Callback URL: `https://your-domain.com/auth/callback`
   - Homepage URL: `https://your-domain.com`

2. Verify environment variables:
```bash
sudo cat /var/www/zalcli-registry/server/.env | grep GITHUB
```

3. Check logs during login:
```bash
sudo journalctl -u zalcli-registry -f
```

### Admin Panel 403 Errors

1. Verify admin username is set:
```bash
sudo cat /var/www/zalcli-registry/server/.env | grep ADMIN
```

2. Check if environment is loaded:
```bash
sudo journalctl -u zalcli-registry -n 20 | grep "Environment check"
```

3. Clear browser localStorage and login again

### Build Errors

```bash
# Clean and rebuild server
cd /var/www/zalcli-registry/server
sudo rm -rf node_modules dist
sudo npm install
sudo npm run build

# Clean and rebuild client
cd /var/www/zalcli-registry/client
sudo rm -rf node_modules dist
sudo npm install
sudo npm run build
```

## 📊 Monitoring

### Check Disk Space

```bash
df -h /var/www/zalcli-registry
```

### Check Database Size

```bash
du -h /var/www/zalcli-registry/server/data/registry.db
```

### Check Memory Usage

```bash
ps aux | grep node
```

### Check Active Connections

```bash
sudo netstat -tlnp | grep 3001
```

## 🔧 Advanced Configuration

### Change Port

Edit systemd service:
```bash
sudo nano /etc/systemd/system/zalcli-registry.service
```

Update Environment:
```
Environment=PORT=3002
```

Update Nginx proxy:
```bash
sudo nano /etc/nginx/sites-available/zalcli
```

Change `proxy_pass http://127.0.0.1:3001` to new port.

Reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart zalcli-registry
sudo nginx -t && sudo systemctl reload nginx
```

### Enable Debug Logging

Edit server .env:
```bash
sudo nano /var/www/zalcli-registry/server/.env
```

Add:
```env
LOG_LEVEL=debug
```

Restart:
```bash
sudo systemctl restart zalcli-registry
```

## 📞 Support

- GitHub Issues: https://github.com/ubercodex/zalcli/issues
- Documentation: https://zalcli.com
- Email: support@zalcli.com

## 📝 Quick Reference

| Task | Command |
|------|---------|
| Deploy | `sudo ./deploy.sh domain email` |
| Quick Update | `sudo ./quick-update.sh` |
| Full Update | `sudo ./update.sh` |
| Update Packages | `sudo ./update-packages.sh` |
| View Logs | `sudo journalctl -u zalcli-registry -f` |
| Restart | `sudo systemctl restart zalcli-registry` |
| Rebuild Server | `cd /var/www/zalcli-registry/server && sudo npm run build` |
| Rebuild Client | `cd /var/www/zalcli-registry/client && sudo npm run build` |
| Check Status | `sudo systemctl status zalcli-registry` |
| Nginx Test | `sudo nginx -t` |
| Reload Nginx | `sudo systemctl reload nginx` |
