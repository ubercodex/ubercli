import Database from 'better-sqlite3';
import { join } from 'path';
import { randomBytes } from 'crypto';

const dbPath = join(process.cwd(), 'data', 'registry.db');
const db = new Database(dbPath);

console.log('Populating plugin_versions from existing plugins...');

try {
	// Check if plugins table has the old schema columns
	const tableInfo = db.prepare("PRAGMA table_info(plugins)").all() as Array<{ name: string }>;
	const hasVersionColumn = tableInfo.some(col => col.name === 'version');
	const hasCodeColumn = tableInfo.some(col => col.name === 'code');
	
	if (hasVersionColumn && hasCodeColumn) {
		console.log('Found old schema with version and code in plugins table');
		
		// Get all plugins with their version data
		const plugins = db.prepare(`
			SELECT id, version, code, parameters, status, approved_by, approved_at, created_at
			FROM plugins
		`).all() as Array<{
			id: string;
			version: string;
			code: string;
			parameters: string;
			status: string;
			approved_by?: string;
			approved_at?: string;
			created_at: string;
		}>;
		
		console.log(`Found ${plugins.length} plugins to migrate`);
		
		// Insert into plugin_versions
		const insertVersion = db.prepare(`
			INSERT INTO plugin_versions (id, plugin_id, version, code, parameters, status, approved_by, approved_at, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);
		
		let migrated = 0;
		for (const plugin of plugins) {
			const versionId = randomBytes(16).toString('hex');
			try {
				insertVersion.run(
					versionId,
					plugin.id,
					plugin.version,
					plugin.code,
					plugin.parameters,
					plugin.status,
					plugin.approved_by || null,
					plugin.approved_at || null,
					plugin.created_at
				);
				migrated++;
			} catch (err) {
				console.error(`Failed to migrate plugin ${plugin.id}:`, err);
			}
		}
		
		console.log(`✅ Successfully migrated ${migrated} plugin versions`);
	} else {
		console.log('⚠️ Plugins table does not have version/code columns. Cannot migrate.');
		console.log('This means the schema was already updated but data was not migrated.');
		console.log('You may need to restore from backup or manually add versions.');
	}
} catch (error) {
	console.error('❌ Migration failed:', error);
	throw error;
} finally {
	db.close();
}
