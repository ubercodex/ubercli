import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { randomBytes } from 'crypto';
import { requireAdmin } from '../middleware/admin.js';

const ProfileSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().min(1).max(500),
	tags: z.array(z.string()).max(10),
	pluginIds: z.array(z.string()).min(1).max(50),
});

export async function profileRoutes(fastify: FastifyInstance) {
	// Get all approved profiles
	fastify.get('/profiles', async (request, reply) => {
		const profiles = db.prepare(`
			SELECT 
				p.*,
				COUNT(DISTINCT pp.plugin_id) as plugin_count
			FROM profiles p
			LEFT JOIN profile_plugins pp ON p.id = pp.profile_id
			WHERE p.status = 'approved'
			GROUP BY p.id
			ORDER BY p.downloads DESC, p.created_at DESC
		`).all();

		return { profiles };
	});

	// Get profile by author/name
	fastify.get('/profiles/:author/:name', async (request, reply) => {
		const { author, name } = request.params as { author: string; name: string };

		const profile = db.prepare(`
			SELECT * FROM profiles 
			WHERE author = ? AND name = ? AND status = 'approved'
		`).get(author, name) as any;

		if (!profile) {
			return reply.code(404).send({ error: 'Profile not found' });
		}

		// Get plugins in this profile
		const plugins = db.prepare(`
			SELECT pl.* 
			FROM plugins pl
			JOIN profile_plugins pp ON pl.id = pp.plugin_id
			WHERE pp.profile_id = ? AND pl.status = 'approved'
			ORDER BY pp.added_at ASC
		`).all(profile.id);

		// Increment downloads
		db.prepare('UPDATE profiles SET downloads = downloads + 1 WHERE id = ?').run(profile.id);

		return {
			...profile,
			tags: JSON.parse(profile.tags),
			plugins: plugins.map((p: any) => ({
				...p,
				parameters: JSON.parse(p.parameters),
				tags: JSON.parse(p.tags),
			})),
		};
	});

	// Create new profile (authenticated users only)
	fastify.post('/profiles', { onRequest: [fastify.authenticate] }, async (request, reply) => {
		const userId = (request.user as { userId: string; username: string }).userId;
		const username = (request.user as { userId: string; username: string }).username;

		const data = ProfileSchema.parse(request.body);

		// Verify all plugins exist and are approved
		const pluginChecks = data.pluginIds.map(id => {
			const plugin = db.prepare('SELECT id, status FROM plugins WHERE id = ?').get(id) as any;
			if (!plugin) throw new Error(`Plugin ${id} not found`);
			if (plugin.status !== 'approved') throw new Error(`Plugin ${id} is not approved`);
			return plugin.id;
		});

		const profileId = randomBytes(16).toString('hex');

		// Create profile
		db.prepare(`
			INSERT INTO profiles (id, author, name, description, tags, author_id, status)
			VALUES (?, ?, ?, ?, ?, ?, 'pending')
		`).run(
			profileId,
			username,
			data.name,
			data.description,
			JSON.stringify(data.tags),
			userId
		);

		// Add plugins to profile
		const insertPlugin = db.prepare(`
			INSERT INTO profile_plugins (profile_id, plugin_id)
			VALUES (?, ?)
		`);

		for (const pluginId of pluginChecks) {
			insertPlugin.run(profileId, pluginId);
		}

		console.log(`✅ Profile created: ${username}/${data.name} (${data.pluginIds.length} plugins)`);

		return { 
			id: profileId,
			message: 'Profile submitted for review',
			status: 'pending'
		};
	});

	// Get user's profiles
	fastify.get('/profiles/my', { onRequest: [fastify.authenticate] }, async (request, reply) => {
		const userId = (request.user as { userId: string }).userId;

		const profiles = db.prepare(`
			SELECT 
				p.*,
				COUNT(DISTINCT pp.plugin_id) as plugin_count
			FROM profiles p
			LEFT JOIN profile_plugins pp ON p.id = pp.profile_id
			WHERE p.author_id = ?
			GROUP BY p.id
			ORDER BY p.created_at DESC
		`).all(userId);

		return {
			profiles: profiles.map((p: any) => ({
				...p,
				tags: JSON.parse(p.tags),
			})),
		};
	});

	// Update profile
	fastify.put('/profiles/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
		const userId = (request.user as { userId: string }).userId;
		const { id } = request.params as { id: string };

		const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any;
		if (!profile) {
			return reply.code(404).send({ error: 'Profile not found' });
		}

		if (profile.author_id !== userId) {
			return reply.code(403).send({ error: 'Not authorized' });
		}

		const data = ProfileSchema.parse(request.body);

		// Verify all plugins exist and are approved
		const pluginChecks = data.pluginIds.map(id => {
			const plugin = db.prepare('SELECT id, status FROM plugins WHERE id = ?').get(id) as any;
			if (!plugin) throw new Error(`Plugin ${id} not found`);
			if (plugin.status !== 'approved') throw new Error(`Plugin ${id} is not approved`);
			return plugin.id;
		});

		// Update profile
		db.prepare(`
			UPDATE profiles 
			SET name = ?, description = ?, tags = ?, updated_at = datetime('now')
			WHERE id = ?
		`).run(data.name, data.description, JSON.stringify(data.tags), id);

		// Remove old plugins
		db.prepare('DELETE FROM profile_plugins WHERE profile_id = ?').run(id);

		// Add new plugins
		const insertPlugin = db.prepare(`
			INSERT INTO profile_plugins (profile_id, plugin_id)
			VALUES (?, ?)
		`);

		for (const pluginId of pluginChecks) {
			insertPlugin.run(id, pluginId);
		}

		return { message: 'Profile updated' };
	});

	// Delete profile
	fastify.delete('/profiles/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
		const userId = (request.user as { userId: string }).userId;
		const { id } = request.params as { id: string };

		const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any;
		if (!profile) {
			return reply.code(404).send({ error: 'Profile not found' });
		}

		if (profile.author_id !== userId) {
			return reply.code(403).send({ error: 'Not authorized' });
		}

		db.prepare('DELETE FROM profiles WHERE id = ?').run(id);

		return { message: 'Profile deleted' };
	});

	// Admin: Get all profiles
	fastify.get('/admin/profiles', { onRequest: [fastify.authenticate, requireAdmin] }, async (request, reply) => {
		const { status } = request.query as { status?: string };

		let query = `
			SELECT 
				p.*,
				COUNT(DISTINCT pp.plugin_id) as plugin_count
			FROM profiles p
			LEFT JOIN profile_plugins pp ON p.id = pp.profile_id
		`;

		if (status) {
			query += ` WHERE p.status = ?`;
		}

		query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

		const profiles = status 
			? db.prepare(query).all(status)
			: db.prepare(query).all();

		return {
			profiles: profiles.map((p: any) => ({
				...p,
				tags: JSON.parse(p.tags),
			})),
		};
	});

	// Admin: Approve profile
	fastify.post('/admin/profiles/:id/approve', { onRequest: [fastify.authenticate, requireAdmin] }, async (request, reply) => {
		const { id } = request.params as { id: string };
		const username = (request.user as { username: string }).username;

		const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any;
		if (!profile) {
			return reply.code(404).send({ error: 'Profile not found' });
		}

		db.prepare(`
			UPDATE profiles 
			SET status = 'approved', approved_by = ?, approved_at = datetime('now')
			WHERE id = ?
		`).run(username, id);

		console.log(`✅ Profile approved: ${profile.author}/${profile.name} by ${username}`);

		return { message: 'Profile approved' };
	});

	// Admin: Reject profile
	fastify.post('/admin/profiles/:id/reject', { onRequest: [fastify.authenticate, requireAdmin] }, async (request, reply) => {
		const { id } = request.params as { id: string };

		const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any;
		if (!profile) {
			return reply.code(404).send({ error: 'Profile not found' });
		}

		db.prepare('UPDATE profiles SET status = ? WHERE id = ?').run('rejected', id);

		console.log(`❌ Profile rejected: ${profile.author}/${profile.name}`);

		return { message: 'Profile rejected' };
	});

	// Admin: Delete profile
	fastify.delete('/admin/profiles/:id', { onRequest: [fastify.authenticate, requireAdmin] }, async (request, reply) => {
		const { id } = request.params as { id: string };

		const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as any;
		if (!profile) {
			return reply.code(404).send({ error: 'Profile not found' });
		}

		db.prepare('DELETE FROM profiles WHERE id = ?').run(id);

		console.log(`🗑️  Profile deleted: ${profile.author}/${profile.name}`);

		return { message: 'Profile deleted' };
	});

	// Admin: Get profile stats only
	fastify.get('/admin/profile-stats', { onRequest: [fastify.authenticate, requireAdmin] }, async (request, reply) => {
		const profileStats = db.prepare(`
			SELECT 
				COUNT(*) as total,
				SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
				SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
				SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
				SUM(downloads) as total_downloads
			FROM profiles
		`).get() as any;

		return profileStats;
	});
}
