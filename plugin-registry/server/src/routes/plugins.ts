import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { randomBytes } from 'crypto';
import { requireAdmin } from '../middleware/admin.js';

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
	model?: string;
	downloads: number;
	createdAt: string;
	updatedAt: string;
	status: 'pending' | 'approved' | 'rejected';
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
	model: z.string().optional(),
});

const UpdatePluginSchema = z.object({
	version: z.string().regex(/^\d+\.\d+\.\d+$/),
	description: z.string().min(1).max(500).optional(),
	code: z.string().min(1).optional(),
	parameters: z.array(PluginParamSchema).optional(),
	tags: z.array(z.string()).max(5).optional(),
});

const ApprovePluginSchema = z.object({
	reason: z.string().optional(),
});

const RejectPluginSchema = z.object({
	reason: z.string().optional(),
});

export async function pluginRoutes(fastify: FastifyInstance) {
	fastify.get('/plugins', async (request: any) => {
		const { author } = request.query as { author?: string };
		
		let query = "SELECT * FROM plugins";
		const params: any[] = [];
		
		if (author) {
			// If author is specified, show all their plugins (any status)
			query += " WHERE author = ?";
			params.push(author);
		} else {
			// Otherwise, only show approved plugins
			query += " WHERE status = 'approved'";
		}
		
		query += " ORDER BY created_at DESC";
		
		const rows = db.prepare(query).all(...params) as any[];
		const plugins: Plugin[] = rows.map((row) => ({
			id: row.id,
			author: row.author,
			name: row.name,
			version: row.version,
			description: row.description,
			code: row.code,
			parameters: JSON.parse(row.parameters) as PluginParameter[],
			tags: JSON.parse(row.tags) as string[],
			model: row.model,
			downloads: row.downloads,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
			status: row.status,
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
					model?: string;
					downloads: number;
					status: string;
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
			model: row.model,
			downloads: row.downloads + 1,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
			status: row.status as 'pending' | 'approved' | 'rejected',
		};

		return plugin;
	});

	fastify.post('/plugins', { onRequest: [fastify.authenticate] }, async (request, reply) => {
		try {
			const userId = (request.user as { userId: string; username: string }).userId;
			const username = (request.user as { userId: string; username: string }).username;

			const input = CreatePluginSchema.parse(request.body);

			const existing = db.prepare('SELECT id FROM plugins WHERE author = ? AND name = ?').get(username, input.name);
			if (existing) {
				return reply.code(409).send({ error: 'Plugin already exists. Use PATCH to update.' });
			}

			const id = randomBytes(16).toString('hex');
			db.prepare(
				`INSERT INTO plugins (id, author, name, version, description, code, parameters, tags, model, author_id, status)
	       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
			).run(
				id,
				username,
				input.name,
				'1.0.0',
				input.description,
				input.code,
				JSON.stringify(input.parameters),
				JSON.stringify(input.tags),
				input.model || null,
				userId
			);

			return { id, author: username, name: input.name, version: '1.0.0', status: 'pending', message: 'Plugin submitted for review' };
		} catch (error: any) {
			console.error('Error creating plugin:', error);
			if (error.name === 'ZodError') {
				const firstError = error.errors[0];
				let message = 'Validation error';
				
				if (firstError.path[0] === 'name' && firstError.code === 'invalid_string') {
					message = 'Plugin name must be lowercase letters, numbers, and hyphens only (e.g., "example-plugin" not "examplePlugin")';
				} else if (firstError.path[0] === 'description') {
					message = 'Description is required and must be between 1-500 characters';
				} else if (firstError.path[0] === 'code') {
					message = 'Plugin code is required';
				} else if (firstError.path[0] === 'parameters') {
					message = 'Invalid parameters format';
				}
				
				return reply.code(400).send({ error: message, details: error.errors });
			}
			return reply.code(500).send({ error: error.message || 'Internal server error' });
		}
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

	// Admin: Get pending plugins
	fastify.get('/admin/plugins/pending', { onRequest: [fastify.authenticate, requireAdmin] }, async () => {
		const rows = db.prepare("SELECT * FROM plugins WHERE status = 'pending' ORDER BY created_at DESC").all() as any[];
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
			status: row.status,
		}));

		return { plugins, total: plugins.length };
	});

	// Admin: Approve plugin
	fastify.post('/admin/plugins/:id/approve', { onRequest: [fastify.authenticate, requireAdmin] }, async (request: any, reply: any) => {
		const { id } = request.params as { id: string };
		const username = (request.user as { userId: string; username: string }).username;

		const plugin = db.prepare('SELECT id, status FROM plugins WHERE id = ?').get(id) as { id: string; status: string } | undefined;
		if (!plugin) {
			return reply.code(404).send({ error: 'Plugin not found' });
		}

		if (plugin.status !== 'pending') {
			return reply.code(400).send({ error: `Plugin is already ${plugin.status}` });
		}

		db.prepare(
			`UPDATE plugins SET status = 'approved', approved_by = ?, approved_at = datetime('now') WHERE id = ?`
		).run(username, id);

		return { success: true, message: 'Plugin approved' };
	});

	// Admin: Reject plugin
	fastify.post('/admin/plugins/:id/reject', { onRequest: [fastify.authenticate, requireAdmin] }, async (request: any, reply: any) => {
		const { id } = request.params as { id: string };
		const username = (request.user as { userId: string; username: string }).username;

		const plugin = db.prepare('SELECT id, status FROM plugins WHERE id = ?').get(id) as { id: string; status: string } | undefined;
		if (!plugin) {
			return reply.code(404).send({ error: 'Plugin not found' });
		}

		if (plugin.status !== 'pending') {
			return reply.code(400).send({ error: `Plugin is already ${plugin.status}` });
		}

		db.prepare(
			`UPDATE plugins SET status = 'rejected', approved_by = ?, approved_at = datetime('now') WHERE id = ?`
		).run(username, id);

		return { success: true, message: 'Plugin rejected' };
	});

	// Admin: Get all plugins or filter by status
	fastify.get('/admin/plugins', { onRequest: [fastify.authenticate, requireAdmin] }, async (request: any) => {
		const { status } = request.query as { status?: string };
		
		let query = 'SELECT * FROM plugins';
		const params: any[] = [];
		
		if (status && ['pending', 'approved', 'rejected'].includes(status)) {
			query += ' WHERE status = ?';
			params.push(status);
		}
		
		query += ' ORDER BY created_at DESC';
		
		const rows = db.prepare(query).all(...params) as any[];
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
			status: row.status,
		}));

		return { plugins, total: plugins.length };
	});

	// Admin: Get statistics
	fastify.get('/admin/stats', { onRequest: [fastify.authenticate, requireAdmin] }, async () => {
		const totalPlugins = db.prepare('SELECT COUNT(*) as count FROM plugins').get() as { count: number };
		const pendingPlugins = db.prepare("SELECT COUNT(*) as count FROM plugins WHERE status = 'pending'").get() as { count: number };
		const approvedPlugins = db.prepare("SELECT COUNT(*) as count FROM plugins WHERE status = 'approved'").get() as { count: number };
		const rejectedPlugins = db.prepare("SELECT COUNT(*) as count FROM plugins WHERE status = 'rejected'").get() as { count: number };
		const totalDownloads = db.prepare('SELECT SUM(downloads) as total FROM plugins').get() as { total: number };
		const totalUsers = db.prepare('SELECT COUNT(DISTINCT author) as count FROM plugins').get() as { count: number };

		return {
			totalPlugins: totalPlugins.count,
			pendingPlugins: pendingPlugins.count,
			approvedPlugins: approvedPlugins.count,
			rejectedPlugins: rejectedPlugins.count,
			totalDownloads: totalDownloads.total || 0,
			totalUsers: totalUsers.count,
		};
	});

	// Admin: Get list of admins
	fastify.get('/admin/admins', { onRequest: [fastify.authenticate, requireAdmin] }, async () => {
		const adminUsernames = process.env.ADMIN_GITHUB_USERNAMES?.split(',').map(u => u.trim()) || [];
		const admins = adminUsernames.map(username => ({ username }));
		
		return { admins, total: admins.length };
	});

	// Admin: Delete plugin permanently
	fastify.delete('/admin/plugins/:id', { onRequest: [fastify.authenticate, requireAdmin] }, async (request: any, reply: any) => {
		const { id } = request.params as { id: string };

		const plugin = db.prepare('SELECT id FROM plugins WHERE id = ?').get(id);
		if (!plugin) {
			return reply.code(404).send({ error: 'Plugin not found' });
		}

		db.prepare('DELETE FROM plugins WHERE id = ?').run(id);

		return { success: true, message: 'Plugin deleted permanently' };
	});
}
