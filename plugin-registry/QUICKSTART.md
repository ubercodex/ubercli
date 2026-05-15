# Quick Start Guide

## Local Development

### 1. Install Dependencies

```bash
# Server
cd plugin-registry/server
npm install

# Client
cd ../client
npm install
```

### 2. Setup Environment

```bash
# Server
cd server
cp .env.example .env
# Edit .env and add your GitHub OAuth credentials
```

### 3. Run Development Servers

```bash
# Terminal 1 - Server (runs on :3001)
cd server
npm run dev

# Terminal 2 - Client (runs on :5173)
cd client
npm run dev
```

Visit http://localhost:5173

## Production Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment instructions.

Quick deploy to Ubuntu VPS:

```bash
cd plugin-registry/deploy
chmod +x deploy.sh
sudo ./deploy.sh ubercli.com your-email@example.com
```

## GitHub OAuth Setup

1. Go to https://github.com/settings/developers
2. Create new OAuth App:
   - **Homepage**: https://ubercli.com (or http://localhost:5173 for dev)
   - **Callback**: https://ubercli.com/auth/callback
3. Copy Client ID and Secret to `.env` files

## API Testing

```bash
# List plugins
curl http://localhost:3001/api/plugins

# Get specific plugin
curl http://localhost:3001/api/plugins/author/plugin-name

# Health check
curl http://localhost:3001/health
```

## Project Structure

```
plugin-registry/
├── server/          # Fastify API + SQLite
│   ├── src/
│   │   ├── db/      # Database schema & connection
│   │   ├── routes/  # API routes (auth, plugins)
│   │   └── index.ts # Server entry
│   └── package.json
├── client/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/   # Home, Browse, PluginDetail
│   │   └── main.tsx
│   └── package.json
├── shared/          # Shared TypeScript types
│   └── types.ts
└── deploy/          # Ubuntu deployment script
    └── deploy.sh
```
