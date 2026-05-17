import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { randomBytes } from 'crypto';

// Shared types
interface PluginParameter {
	name: string;
	type: 'string' | 'number' | 'boolean';
	description: string;
	required: boolean;
	default?: string | number | boolean;
}

interface Plugin {
	id: string;
	author: string;
	name: string;
	version: string;
	description: string;
	code: string;
	parameters: PluginParameter[];
	tags: string[];
	downloads: number;
	createdAt: string;
	updatedAt: string;
}

const PluginParamSchema = z.object({
	name: z.string(),
	type: z.enum(['string', 'number', 'boolean']),
	description: z.string(),
	required: z.boolean(),
	default: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

const CreatePluginSchema = z.object({
	name: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
	description: z.string().min(1).max(500),
	code: z.string().min(1),
	parameters: z.array(PluginParamSchema),
	tags: z.array(z.string()).max(5),
});

const UpdatePluginSchema = z.object({
	version: z.string().regex(/^\d+\.\d+\.\d+$/),
	description: z.string().min(1).max(500).optional(),
	code: z.string().min(1).optional(),
	parameters: z.array(PluginParamSchema).optional(),
	tags: z.array(z.string()).max(5).optional(),
});

export async function pluginRoutes(fastify: FastifyInstance) {
	fastify.get('/plugins', async (request) => {
		const { q, author, tag, limit = 50, offset = 0 } = request.query as {
			q?: string;
			author?: string;
			tag?: string;
			limit?: number;
			offset?: number;
		};

		let query = 'SELECT * FROM plugins WHERE 1=1';
		const params: unknown[] = [];

		if (q) {
			query += ' AND (name LIKE ? OR description LIKE ?)';
			params.push(`%${q}%`, `%${q}%`);
		}
		if (author) {
			query += ' AND author = ?';
			params.push(author);
		}
		if (tag) {
			query += ' AND tags LIKE ?';
			params.push(`%${tag}%`);
		}

		query += ' ORDER BY downloads DESC, created_at DESC LIMIT ? OFFSET ?';
		params.push(limit, offset);

		const rows = db.prepare(query).all(...params) as Array<{
			id: string;
			author: string;
			name: string;
			version: string;
			description: string;
			code: string;
			parameters: string;
			tags: string;
			downloads: number;
			created_at: string;
			updated_at: string;
		}>;

		const plugins: Plugin[] = rows.map((row) => ({
			id: row.id,
			author: row.author,
			name: row.name,
			version: row.version,
			description: row.description,
			code: row.code,
			parameters: JSON.parse(row.parameters) as PluginParameter[],
			tags: JSON.parse(row.tags) as string[],
			downloads: row.downloads,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}));

		return { plugins, total: plugins.length };
	});

	fastify.get('/plugins/:author/:name', async (request, reply) => {
		const { author, name } = request.params as { author: string; name: string };

		const row = db.prepare('SELECT * FROM plugins WHERE author = ? AND name = ?').get(author, name) as
			| {
					id: string;
					author: string;
					name: string;
					version: string;
					description: string;
					code: string;
					parameters: string;
					tags: string;
					downloads: number;
					created_at: string;
					updated_at: string;
			  }
			| undefined;

		if (!row) {
			return reply.code(404).send({ error: 'Plugin not found' });
		}

		db.prepare('UPDATE plugins SET downloads = downloads + 1 WHERE id = ?').run(row.id);

		const plugin: Plugin = {
			id: row.id,
			author: row.author,
			name: row.name,
			version: row.version,
			description: row.description,
			code: row.code,
			parameters: JSON.parse(row.parameters) as PluginParameter[],
			tags: JSON.parse(row.tags) as string[],
			downloads: row.downloads + 1,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		};

		return plugin;
	});

	fastify.post('/plugins', { onRequest: [fastify.authenticate] }, async (request, reply) => {
		const userId = (request.user as { userId: string; username: string }).userId;
		const username = (request.user as { userId: string; username: string }).username;

		const input = CreatePluginSchema.parse(request.body);

		const existing = db.prepare('SELECT id FROM plugins WHERE author = ? AND name = ?').get(username, input.name);
		if (existing) {
			return reply.code(409).send({ error: 'Plugin already exists. Use PATCH to update.' });
		}

		const id = randomBytes(16).toString('hex');
		db.prepare(
			`INSERT INTO plugins (id, author, name, version, description, code, parameters, tags, author_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			id,
			username,
			input.name,
			'1.0.0',
			input.description,
			input.code,
			JSON.stringify(input.parameters),
			JSON.stringify(input.tags),
			userId
		);

		return { id, author: username, name: input.name, version: '1.0.0' };
	});

	fastify.patch('/plugins/:author/:name', { onRequest: [fastify.authenticate] }, async (request, reply) => {
		const { author, name } = request.params as { author: string; name: string };
		const username = (request.user as { userId: string; username: string }).username;

		if (author !== username) {
			return reply.code(403).send({ error: 'You can only update your own plugins' });
		}

		const input = UpdatePluginSchema.parse(request.body);

		const existing = db.prepare('SELECT id FROM plugins WHERE author = ? AND name = ?').get(author, name) as
			| { id: string }
			| undefined;
		if (!existing) {
			return reply.code(404).send({ error: 'Plugin not found' });
		}

		const updates: string[] = ['version = ?', 'updated_at = datetime("now")'];
		const params: unknown[] = [input.version];

		if (input.description) {
			updates.push('description = ?');
			params.push(input.description);
		}
		if (input.code) {
			updates.push('code = ?');
			params.push(input.code);
		}
		if (input.parameters) {
			updates.push('parameters = ?');
			params.push(JSON.stringify(input.parameters));
		}
		if (input.tags) {
			updates.push('tags = ?');
			params.push(JSON.stringify(input.tags));
		}

		params.push(existing.id);

		db.prepare(`UPDATE plugins SET ${updates.join(', ')} WHERE id = ?`).run(...params);

		return { success: true };
	});

	fastify.delete('/plugins/:author/:name', { onRequest: [fastify.authenticate] }, async (request, reply) => {
		const { author, name } = request.params as { author: string; name: string };
		const username = (request.user as { userId: string; username: string }).username;

		if (author !== username) {
			return reply.code(403).send({ error: 'You can only delete your own plugins' });
		}

		const result = db.prepare('DELETE FROM plugins WHERE author = ? AND name = ?').run(author, name);

		if (result.changes === 0) {
			return reply.code(404).send({ error: 'Plugin not found' });
		}

		return { success: true };
	});
}
