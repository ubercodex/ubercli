import { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
	console.log('🔐 Admin middleware check...');
	console.log('Environment ADMIN_GITHUB_USERNAMES:', process.env.ADMIN_GITHUB_USERNAMES);
	
	const adminUsernames = (process.env.ADMIN_GITHUB_USERNAMES || '')
		.split(',')
		.map(u => u.trim())
		.filter(Boolean);

	console.log('Parsed admin usernames:', adminUsernames);

	if (adminUsernames.length === 0) {
		console.error('❌ No admins configured!');
		return reply.code(500).send({ error: 'No admins configured' });
	}

	const user = request.user as { userId: string; username: string } | undefined;
	console.log('Request user:', user);

	if (!user || !adminUsernames.includes(user.username)) {
		console.error('❌ Access denied for user:', user?.username);
		return reply.code(403).send({ error: 'Admin access required' });
	}

	console.log('✅ Admin access granted for:', user.username);
}
