import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/index.js';
import { authRoutes } from './routes/auth.js';
import { pluginRoutes } from './routes/plugins.js';
import { profileRoutes } from './routes/profiles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log environment variables on startup
console.log('🔧 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ADMIN_GITHUB_USERNAMES:', process.env.ADMIN_GITHUB_USERNAMES);
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? '✓ Set' : '✗ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
	origin: process.env.NODE_ENV === 'production' ? 'https://zalcli.com' : '*',
});

await fastify.register(jwt, {
	secret: process.env.JWT_SECRET || 'change-this-secret',
});

fastify.decorate('authenticate', async function (request: any, reply: any) {
	try {
		await request.jwtVerify();
	} catch (err) {
		reply.code(401).send({ error: 'Unauthorized' });
	}
});

initDatabase();

await fastify.register(authRoutes, { prefix: '/api' });
await fastify.register(pluginRoutes, { prefix: '/api' });
await fastify.register(profileRoutes, { prefix: '/api' });

fastify.get('/health', async () => ({ status: 'ok' }));

// Serve static files from client build
const clientPath = join(__dirname, '../../client/dist');
await fastify.register(fastifyStatic, {
	root: clientPath,
	prefix: '/',
});

// Catch-all route for client-side routing (must be last)
fastify.setNotFoundHandler(async (request: any, reply: any) => {
	// If it's an API request, return 404
	if (request.url.startsWith('/api/')) {
		return reply.code(404).send({ error: 'Not found' });
	}
	// Otherwise, serve index.html for client-side routing
	return reply.sendFile('index.html');
});

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

try {
	await fastify.listen({ port: PORT, host: HOST });
	console.log(`✓ Server running on http://${HOST}:${PORT}`);
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
