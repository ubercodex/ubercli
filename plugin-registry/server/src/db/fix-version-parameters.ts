import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'registry.db');
const db = new Database(dbPath);

console.log('Fixing version parameters from plugins table...');

try {
	// Get all plugins with their parameters
	const plugins = db.prepare(`
		SELECT id, name, author, parameters
		FROM plugins
	`).all() as Array<{
		id: string;
		name: string;
		author: string;
		parameters: string;
	}>;
	
	console.log(`Found ${plugins.length} plugins`);
	
	// Update each plugin's versions with the correct parameters
	const updateVersion = db.prepare(`
		UPDATE plugin_versions
		SET parameters = ?
		WHERE plugin_id = ?
	`);
	
	let updated = 0;
	for (const plugin of plugins) {
		// Skip if parameters are empty or null
		if (!plugin.parameters || plugin.parameters === '[]') {
			console.log(`Skipping ${plugin.author}/${plugin.name} - no parameters`);
			continue;
		}
		
		try {
			const result = updateVersion.run(plugin.parameters, plugin.id);
			if (result.changes > 0) {
				updated++;
				console.log(`✓ Updated ${result.changes} version(s) for ${plugin.author}/${plugin.name}`);
			}
		} catch (err) {
			console.error(`✗ Failed to update ${plugin.author}/${plugin.name}:`, err);
		}
	}
	
	console.log(`\n✅ Successfully updated parameters for ${updated} plugins`);
	
} catch (error) {
	console.error('❌ Failed:', error);
	throw error;
} finally {
	db.close();
}
