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
	profileCount?: number;
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
		
		// Get plugins with their latest version info
		let query = `
			SELECT 
				p.*,
				pv.version,
				pv.code,
				pv.parameters,
				pv.status,
				pv.created_at as version_created_at
			FROM plugins p
			LEFT JOIN plugin_versions pv ON p.id = pv.plugin_id
			LEFT JOIN (
				SELECT plugin_id, MAX(created_at) as max_created
				FROM plugin_versions
				GROUP BY plugin_id
			) latest ON pv.plugin_id = latest.plugin_id AND pv.created_at = latest.max_created
		`;
		const params: any[] = [];
		const conditions: string[] = [];
		
		// Only show plugins that have at least one version
		conditions.push("pv.id IS NOT NULL");
		
		if (author) {
			// If author is specified, show all their plugins (any status)
			conditions.push("p.author = ?");
			params.push(author);
		} else {
			// Otherwise, only show plugins with approved versions
			conditions.push("pv.status = 'approved'");
		}
		
		query += " WHERE " + conditions.join(" AND ");
		
		query += " ORDER BY p.created_at DESC";
		
		const rows = db.prepare(query).all(...params) as any[];
		const plugins: Plugin[] = rows.map((row) => {
			const profileCount = db.prepare('SELECT COUNT(*) as count FROM profile_plugins WHERE plugin_id = ?').get(row.id) as { count: number };
		// Get version count and pending status
		const versionStats = db.prepare(`
			SELECT 
				COUNT(*) as total_versions,
				SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_versions
			FROM plugin_versions 
			WHERE plugin_id = ?
		`).get(row.id) as { total_versions: number; pending_versions: number };
			return {
				id: row.id,
				author: row.author,
				name: row.name,
				version: row.version,
				description: row.description,
				code: row.code,
				parameters: JSON.parse(row.parameters || '[]') as PluginParameter[],
				tags: JSON.parse(row.tags || '[]') as string[],
				model: row.model,
				downloads: row.downloads,
				profileCount: profileCount.count,
				createdAt: row.created_at,
				updatedAt: row.updated_at,
				status: row.status,
			};
		});

		return { plugins, total: plugins.length };
	});

	fastify.get('/plugins/:author/:name', async (request, reply) => {
		const { author, name } = request.params as { author: string; name: string };
		const { version } = request.query as { version?: string };

		// Get plugin metadata
		const pluginRow = db.prepare('SELECT * FROM plugins WHERE author = ? AND name = ?').get(author, name) as
			| {
					id: string;
					author: string;
					name: string;
					description: string;
					tags: string;
					model?: string;
					downloads: number;
					created_at: string;
					updated_at: string;
			  }
			| undefined;

		if (!pluginRow) {
			return reply.code(404).send({ error: 'Plugin not found' });
		}

		// Get specific version or latest approved version
		let versionRow;
		if (version) {
			versionRow = db.prepare('SELECT * FROM plugin_versions WHERE plugin_id = ? AND version = ?').get(pluginRow.id, version);
		} else {
			// Get latest approved version
			versionRow = db.prepare(`
				SELECT * FROM plugin_versions 
				WHERE plugin_id = ? AND status = 'approved' 
				ORDER BY created_at DESC 
				LIMIT 1
			`).get(pluginRow.id);
		}

		if (!versionRow) {
			return reply.code(404).send({ error: version ? `Version ${version} not found` : 'No approved version available' });
		}

		const versionData = versionRow as {
			id: string;
			plugin_id: string;
			version: string;
			code: string;
			parameters: string;
			status: string;
			approved_by?: string;
			approved_at?: string;
			created_at: string;
		};

		// Increment download counter
		db.prepare('UPDATE plugins SET downloads = downloads + 1 WHERE id = ?').run(pluginRow.id);

		const profileCount = db.prepare('SELECT COUNT(*) as count FROM profile_plugins WHERE plugin_id = ?').get(pluginRow.id) as { count: number };

		// Get all available versions
		const allVersions = db.prepare(`
			SELECT version, status, created_at, approved_at 
			FROM plugin_versions 
			WHERE plugin_id = ? 
			ORDER BY created_at DESC
		`).all(pluginRow.id) as Array<{ version: string; status: string; created_at: string; approved_at?: string }>;

		const plugin: Plugin & { availableVersions?: Array<{ version: string; status: string; createdAt: string; approvedAt?: string }> } = {
			id: pluginRow.id,
			author: pluginRow.author,
			name: pluginRow.name,
			version: versionData.version,
			description: pluginRow.description,
			code: versionData.code,
			parameters: JSON.parse(versionData.parameters) as PluginParameter[],
			tags: JSON.parse(pluginRow.tags) as string[],
			model: pluginRow.model,
			downloads: pluginRow.downloads + 1,
			profileCount: profileCount.count,
			createdAt: pluginRow.created_at,
			updatedAt: pluginRow.updated_at,
			status: versionData.status as 'pending' | 'approved' | 'rejected',
			availableVersions: allVersions.map(v => ({
				version: v.version,
				status: v.status,
				createdAt: v.created_at,
				approvedAt: v.approved_at,
			})),
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

			const pluginId = randomBytes(16).toString('hex');
			const versionId = randomBytes(16).toString('hex');
			
			// Insert plugin metadata
			db.prepare(
				`INSERT INTO plugins (id, author, name, description, tags, model, author_id)
	       VALUES (?, ?, ?, ?, ?, ?, ?)`
			).run(
				pluginId,
				username,
				input.name,
				input.description,
				JSON.stringify(input.tags),
				input.model || null,
				userId
			);

			// Insert first version
			db.prepare(
				`INSERT INTO plugin_versions (id, plugin_id, version, code, parameters, status)
	       VALUES (?, ?, ?, ?, ?, 'pending')`
			).run(
				versionId,
				pluginId,
				'1.0.0',
				input.code,
				JSON.stringify(input.parameters)
			);

			return { id: pluginId, author: username, name: input.name, version: '1.0.0', status: 'pending', message: 'Plugin submitted for review' };
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
		try {
			const { author, name } = request.params as { author: string; name: string };
			const username = (request.user as { userId: string; username: string }).username;

			if (author !== username) {
				return reply.code(403).send({ error: 'You can only update your own plugins' });
			}

			const input = UpdatePluginSchema.parse(request.body);

			const plugin = db.prepare('SELECT id FROM plugins WHERE author = ? AND name = ?').get(author, name) as
				| { id: string }
				| undefined;
			if (!plugin) {
				return reply.code(404).send({ error: 'Plugin not found' });
			}

			// Get latest version
			const latestVersion = db.prepare(`
				SELECT version, code, parameters 
				FROM plugin_versions 
				WHERE plugin_id = ? 
				ORDER BY created_at DESC 
				LIMIT 1
			`).get(plugin.id) as { version: string; code: string; parameters: string } | undefined;

			if (!latestVersion) {
				return reply.code(404).send({ error: 'No versions found for this plugin' });
			}

			const updates: string[] = ["updated_at = CURRENT_TIMESTAMP"];
			const params: unknown[] = [];

			let newVersionCreated = false;
			let newVersion = latestVersion.version;

			// If code changes, create new version
			if (input.code && input.code !== latestVersion.code) {
				const versionParts = latestVersion.version.split('.').map(Number);
				versionParts[2]++; // Increment patch version
				newVersion = versionParts.join('.');

				const versionId = randomBytes(16).toString('hex');
				db.prepare(
					`INSERT INTO plugin_versions (id, plugin_id, version, code, parameters, status)
	       VALUES (?, ?, ?, ?, ?, 'pending')`
				).run(
					versionId,
					plugin.id,
					newVersion,
					input.code,
					input.parameters ? JSON.stringify(input.parameters) : latestVersion.parameters
				);

				newVersionCreated = true;
			}

			if (input.description) {
				updates.push('description = ?');
				params.push(input.description);
			}
			if (input.parameters) {
				updates.push('parameters = ?');
				params.push(JSON.stringify(input.parameters));
			}
			if (input.tags) {
				updates.push('tags = ?');
				params.push(JSON.stringify(input.tags));
			}

			if (params.length === 0) {
				return reply.code(400).send({ error: 'No fields to update' });
			}

			params.push(plugin.id);

				db.prepare(`UPDATE plugins SET ${updates.join(', ')} WHERE id = ?`).run(...params);

			return { 
				success: true, 
				message: newVersionCreated ? `New version ${newVersion} created and pending approval` : 'Plugin updated successfully',
				version: newVersion,
				newVersionCreated
			};
		} catch (error: any) {
			console.error('Plugin update error:', error);
			if (error.name === 'ZodError') {
				return reply.code(400).send({ error: 'Invalid input', details: error.errors });
			}
			return reply.code(500).send({ error: error.message || 'Internal server error' });
		}
	});

	fastify.delete('/plugins/:author/:name', { onRequest: [fastify.authenticate] }, async (request, reply) => {
		const { author, name } = request.params as { author: string; name: string };
		const username = (request.user as { userId: string; username: string }).username;

		if (author !== username) {
			return reply.code(403).send({ error: 'You can only delete your own plugins' });
		}

		const plugin = db.prepare('SELECT id, status FROM plugins WHERE author = ? AND name = ?').get(author, name) as { id: string; status: string } | undefined;
		
		if (!plugin) {
			return reply.code(404).send({ error: 'Plugin not found' });
		}

		// Check if plugin is approved
		if (plugin.status === 'approved') {
			const profileUsage = db.prepare('SELECT COUNT(*) as count FROM profile_plugins WHERE plugin_id = ?').get(plugin.id) as { count: number };
			
			if (profileUsage.count > 0) {
				return reply.code(409).send({ 
					error: 'Cannot delete plugin', 
					message: `This approved plugin is used in ${profileUsage.count} profile${profileUsage.count > 1 ? 's' : ''}. Remove it from all profiles before deleting.`,
					profileCount: profileUsage.count
				});
			}
		}

		// Allow deletion if:
		// 1. Plugin is not approved (pending/rejected) - can always delete
		// 2. Plugin is approved but not used in any profiles

		const result = db.prepare('DELETE FROM plugins WHERE author = ? AND name = ?').run(author, name);

		if (result.changes === 0) {
			return reply.code(404).send({ error: 'Plugin not found' });
		}

		return { success: true, message: 'Plugin deleted successfully' };
	});

	// Admin: Get pending plugins
	fastify.get('/admin/plugins/pending', { onRequest: [fastify.authenticate, requireAdmin] }, async () => {
		const rows = db.prepare(`
			SELECT 
				p.*,
				pv.version,
				pv.code,
				pv.parameters,
				pv.status,
				pv.id as version_id
			FROM plugins p
			INNER JOIN plugin_versions pv ON p.id = pv.plugin_id
			WHERE pv.status = 'pending'
			ORDER BY pv.created_at DESC
		`).all() as any[];
		
		const plugins: Plugin[] = rows.map((row) => ({
			id: row.version_id,
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

	// Admin: Approve plugin version
	fastify.post('/admin/plugins/:id/approve', { onRequest: [fastify.authenticate, requireAdmin] }, async (request: any, reply: any) => {
		const { id } = request.params as { id: string };
		const username = (request.user as { userId: string; username: string }).username;

		const version = db.prepare('SELECT id, status FROM plugin_versions WHERE id = ?').get(id) as { id: string; status: string } | undefined;
		if (!version) {
			return reply.code(404).send({ error: 'Plugin version not found' });
		}

		if (version.status !== 'pending') {
			return reply.code(400).send({ error: `Plugin version is already ${version.status}` });
		}

		db.prepare(
			`UPDATE plugin_versions SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?`
		).run(username, id);

		return { success: true, message: 'Plugin version approved' };
	});

	// Admin: Reject plugin version
	fastify.post('/admin/plugins/:id/reject', { onRequest: [fastify.authenticate, requireAdmin] }, async (request: any, reply: any) => {
		const { id } = request.params as { id: string };
		const username = (request.user as { userId: string; username: string }).username;

		const version = db.prepare('SELECT id, status FROM plugin_versions WHERE id = ?').get(id) as { id: string; status: string } | undefined;
		if (!version) {
			return reply.code(404).send({ error: 'Plugin version not found' });
		}

		if (version.status !== 'pending') {
			return reply.code(400).send({ error: `Plugin version is already ${version.status}` });
		}

		db.prepare(
			`UPDATE plugin_versions SET status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?`
		).run(username, id);

		return { success: true, message: 'Plugin version rejected' };
	});

	// Admin: Get all plugin versions or filter by status
	fastify.get('/admin/plugins', { onRequest: [fastify.authenticate, requireAdmin] }, async (request: any) => {
		const { status } = request.query as { status?: string };
		
		let query = `
			SELECT 
				p.*,
				pv.version,
				pv.code,
				pv.parameters,
				pv.status,
				pv.id as version_id,
				pv.created_at as version_created_at
			FROM plugins p
			INNER JOIN plugin_versions pv ON p.id = pv.plugin_id
		`;
		const params: any[] = [];
		
		if (status && ['pending', 'approved', 'rejected'].includes(status)) {
			query += ' WHERE pv.status = ?';
			params.push(status);
		}
		
		query += ' ORDER BY pv.created_at DESC';
		
		const rows = db.prepare(query).all(...params) as any[];
		const plugins: Plugin[] = rows.map((row) => ({
			id: row.version_id,
			author: row.author,
			name: row.name,
			version: row.version,
			description: row.description,
			code: row.code,
			parameters: JSON.parse(row.parameters) as PluginParameter[],
			tags: JSON.parse(row.tags) as string[],
			downloads: row.downloads,
			createdAt: row.version_created_at,
			updatedAt: row.updated_at,
			status: row.status,
		}));

		return { plugins, total: plugins.length };
	});

	// Admin: Get statistics
	fastify.get('/admin/stats', { onRequest: [fastify.authenticate, requireAdmin] }, async () => {
		const totalPlugins = db.prepare('SELECT COUNT(*) as count FROM plugins').get() as { count: number };
		const pendingVersions = db.prepare("SELECT COUNT(*) as count FROM plugin_versions WHERE status = 'pending'").get() as { count: number };
		const approvedVersions = db.prepare("SELECT COUNT(*) as count FROM plugin_versions WHERE status = 'approved'").get() as { count: number };
		const rejectedVersions = db.prepare("SELECT COUNT(*) as count FROM plugin_versions WHERE status = 'rejected'").get() as { count: number };
		const totalDownloads = db.prepare('SELECT SUM(downloads) as total FROM plugins').get() as { total: number };
		const totalUsers = db.prepare('SELECT COUNT(DISTINCT author) as count FROM plugins').get() as { count: number };

		return {
			totalPlugins: totalPlugins.count,
			pendingPlugins: pendingVersions.count,
			approvedPlugins: approvedVersions.count,
			rejectedPlugins: rejectedVersions.count,
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
