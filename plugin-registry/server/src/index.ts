import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { initDatabase } from './db/index.js';
import { authRoutes } from './routes/auth.js';
import { pluginRoutes } from './routes/plugins.js';

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
	origin: process.env.NODE_ENV === 'production' ? 'https://ubercli.com' : '*',
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

fastify.get('/health', async () => ({ status: 'ok' }));

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

try {
	await fastify.listen({ port: PORT, host: HOST });
	console.log(`✓ Server running on http://${HOST}:${PORT}`);
} catch (err) {
	fastify.log.error(err);
	process.exit(1);
}
