import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { randomBytes } from 'crypto';

const GitHubTokenSchema = z.object({
	code: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
	fastify.post('/auth/github', async (request, reply) => {
		const { code } = GitHubTokenSchema.parse(request.body);

		const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				client_id: process.env.GITHUB_CLIENT_ID,
				client_secret: process.env.GITHUB_CLIENT_SECRET,
				code,
			}),
		});

		const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
		if (!tokenData.access_token) {
			return reply.code(401).send({ error: 'GitHub OAuth failed' });
		}

		const userRes = await fetch('https://api.github.com/user', {
			headers: { Authorization: `Bearer ${tokenData.access_token}` },
		});

		const githubUser = (await userRes.json()) as {
			id: number;
			login: string;
			email: string;
			avatar_url: string;
		};

		const userId = randomBytes(16).toString('hex');
		const existing = db
			.prepare('SELECT * FROM users WHERE github_id = ?')
			.get(String(githubUser.id)) as { id: string; username: string; email: string; avatar: string } | undefined;

		let user;
		if (existing) {
			user = existing;
		} else {
			db.prepare(
				'INSERT INTO users (id, username, email, github_id, avatar) VALUES (?, ?, ?, ?, ?)'
			).run(userId, githubUser.login, githubUser.email || '', String(githubUser.id), githubUser.avatar_url);
			user = { id: userId, username: githubUser.login, email: githubUser.email || '', avatar: githubUser.avatar_url };
		}

		const token = fastify.jwt.sign({ userId: user.id, username: user.username });

		return { token, user };
	});

	fastify.get('/auth/me', { onRequest: [fastify.authenticate] }, async (request) => {
		const userId = (request.user as { userId: string }).userId;
		const user = db.prepare('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?').get(userId);
		return user;
	});
}
