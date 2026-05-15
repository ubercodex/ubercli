# Security Guide

## Overview

Even though this is an open-source project, the production deployment is secured against common attacks and unauthorized file access.

## Security Measures Implemented

### 1. **Nginx Path Protection**

All sensitive files and directories are blocked at the Nginx level:

```nginx
# Blocked file extensions
.env, .git, .db, .sqlite, .log, .json, .md, .sh, .sql, .bak, .config, .ini, .yml, .yaml

# Blocked directories
/server/, /shared/, /deploy/, /node_modules/

# Blocked patterns
Hidden files (.*), source maps (.map), admin panels
```

**What this prevents:**
- ❌ `https://ubercli.com/server/.env` → 403 Forbidden
- ❌ `https://ubercli.com/server/data/registry.db` → 403 Forbidden
- ❌ `https://ubercli.com/deploy/deploy.sh` → 403 Forbidden
- ❌ `https://ubercli.com/.git/config` → 403 Forbidden

### 2. **File System Permissions**

```bash
# .env files - root only
chmod 600 /var/www/ubercli-registry/server/.env

# Database directory - root only
chmod 700 /var/www/ubercli-registry/server/data/

# Source code - root only
chmod 600 /var/www/ubercli-registry/server/src/*

# Public files - world readable
chmod 755 /var/www/ubercli-registry/client/dist/
```

**What this prevents:**
- Even if someone bypasses Nginx, the OS denies file reads
- Only the Node.js process (running as root) can read `.env` and `.db`
- Web server (nginx) can only read `/client/dist/`

### 3. **Rate Limiting**

```nginx
# API endpoints: 10 requests/second per IP
limit_req zone=api_limit burst=20

# Auth endpoints: 5 requests/minute per IP
limit_req zone=auth_limit burst=3
```

**What this prevents:**
- Brute force attacks on authentication
- API abuse / DoS attempts
- Credential stuffing

### 4. **Firewall (UFW)**

```bash
# Only these ports are open
22  (SSH)
80  (HTTP)
443 (HTTPS)

# Everything else is blocked
```

**What this prevents:**
- Direct access to Node.js (port 3001)
- Database port scanning
- Unauthorized service access

### 5. **Security Headers**

```nginx
X-Frame-Options: SAMEORIGIN           # Prevent clickjacking
X-Content-Type-Options: nosniff       # Prevent MIME sniffing
X-XSS-Protection: 1; mode=block       # XSS protection
Referrer-Policy: strict-origin        # Limit referrer leakage
Permissions-Policy: ...               # Disable unnecessary APIs
```

### 6. **Server Binding**

The Node.js server binds to `127.0.0.1:3001` (localhost only), not `0.0.0.0`.

**What this prevents:**
- Direct external access to the API server
- All traffic must go through Nginx reverse proxy

### 7. **JWT Secret**

Generated randomly during deployment:

```bash
JWT_SECRET=$(openssl rand -base64 32)
```

**What this prevents:**
- Predictable tokens
- Token forgery

### 8. **Database Location**

SQLite database is stored in `/var/www/ubercli-registry/server/data/registry.db`

**Protected by:**
- Nginx path blocking (`/server/` → 403)
- File permissions (`chmod 700`)
- Not in web root

## Attack Scenarios & Mitigations

### Scenario 1: "I know the source code, I'll download the .env file"

```bash
curl https://ubercli.com/server/.env
# → 403 Forbidden (Nginx blocks /server/ path)
```

### Scenario 2: "I'll try to access the database directly"

```bash
curl https://ubercli.com/server/data/registry.db
# → 403 Forbidden (Nginx blocks .db extension + /server/ path)

# Even if they bypass Nginx somehow:
# → Permission denied (chmod 700, only root can read)
```

### Scenario 3: "I'll brute force the GitHub OAuth"

```bash
# After 5 attempts in 1 minute:
# → 429 Too Many Requests (rate limit)
```

### Scenario 4: "I'll DoS the API"

```bash
# After 10 requests/second:
# → 429 Too Many Requests (rate limit)
```

### Scenario 5: "I'll access the Node.js server directly"

```bash
curl http://your-vps-ip:3001/api/plugins
# → Connection refused (firewall blocks port 3001)
# → Server only listens on 127.0.0.1 (localhost)
```

## Additional Recommendations

### 1. **Keep Dependencies Updated**

```bash
cd /var/www/ubercli-registry/server
npm audit
npm update
```

### 2. **Monitor Logs**

```bash
# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs (shows blocked requests)
tail -f /var/log/nginx/error.log

# Server logs
journalctl -u ubercli-registry -f
```

### 3. **Fail2Ban (Optional)**

Install fail2ban to auto-ban IPs with repeated 403/429 errors:

```bash
apt-get install fail2ban
# Configure jail for nginx-limit
```

### 4. **Regular Backups**

```bash
# Backup database
cp /var/www/ubercli-registry/server/data/registry.db ~/backups/registry-$(date +%Y%m%d).db
```

### 5. **SSL/TLS Only**

Let's Encrypt automatically redirects HTTP → HTTPS. Never disable this.

### 6. **Environment Variables**

Never commit `.env` files to git:

```bash
# Already in .gitignore
.env
*.db
```

## Reporting Security Issues

If you find a security vulnerability, please email: security@ubercli.com

**Do not** open a public GitHub issue for security vulnerabilities.

## Security Checklist

- [x] Nginx blocks sensitive paths
- [x] File permissions restrict access
- [x] Rate limiting enabled
- [x] Firewall configured
- [x] Security headers set
- [x] Server binds to localhost only
- [x] JWT secret is random
- [x] SSL/TLS enforced
- [x] Dependencies audited
- [x] Logs monitored

## Compliance

This setup follows OWASP Top 10 best practices:
- ✅ A01: Broken Access Control → Fixed with Nginx + permissions
- ✅ A02: Cryptographic Failures → SSL/TLS + JWT secrets
- ✅ A03: Injection → Zod validation + prepared statements
- ✅ A05: Security Misconfiguration → Hardened Nginx + headers
- ✅ A07: Authentication Failures → Rate limiting + OAuth
