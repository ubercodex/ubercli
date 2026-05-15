# UberCLI Plugin Registry

Central registry for sharing UberCLI plugins. Browse, install, and publish plugins at **ubercli.com**.

## Structure

```
plugin-registry/
├── server/          # Backend API (Fastify + SQLite)
├── client/          # Frontend (React + Vite)
├── deploy/          # Ubuntu deployment scripts
└── shared/          # Shared types between client/server
```

## Quick Start

### Development

```bash
# Server (API runs on :3001)
cd server
npm install
npm run dev

# Client (Web UI runs on :5173)
cd client
npm install
npm run dev
```

### Production Deployment (Ubuntu VPS)

```bash
cd deploy
chmod +x deploy.sh
sudo ./deploy.sh ubercli.com your-email@example.com
```

This will:
- Install Node.js, Nginx, Certbot
- Setup SSL with Let's Encrypt
- Configure systemd services
- Deploy both server and client
- Setup auto-renewal for SSL

## API Endpoints

- `GET /api/plugins` — List/search plugins
- `GET /api/plugins/:author/:name` — Get plugin details
- `POST /api/plugins` — Publish plugin (requires auth)
- `PATCH /api/plugins/:author/:name` — Update plugin
- `DELETE /api/plugins/:author/:name` — Unpublish
- `POST /api/auth/github` — GitHub OAuth login
- `GET /api/auth/me` — Get current user

## Environment Variables

### Server (.env)
```
DATABASE_URL=./data/registry.db
JWT_SECRET=your-secret-key
GITHUB_CLIENT_ID=your-github-oauth-app-id
GITHUB_CLIENT_SECRET=your-github-oauth-secret
PORT=3001
```

### Client (.env)
```
VITE_API_URL=https://ubercli.com/api
VITE_GITHUB_CLIENT_ID=your-github-oauth-app-id
```
