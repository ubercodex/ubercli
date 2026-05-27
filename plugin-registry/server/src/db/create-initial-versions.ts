import Database from 'better-sqlite3';
import { join } from 'path';
import { randomBytes } from 'crypto';

const dbPath = join(process.cwd(), 'data', 'registry.db');
const db = new Database(dbPath);

console.log('Creating initial versions for existing plugins...');

try {
	// Get all plugins (new schema - no version/code columns)
	const plugins = db.prepare(`
		SELECT id, author, name
		FROM plugins
	`).all() as Array<{
		id: string;
		author: string;
		name: string;
	}>;
	
	console.log(`Found ${plugins.length} plugins without versions`);
	
	// Check which plugins already have versions
	const existingVersions = db.prepare(`
		SELECT DISTINCT plugin_id FROM plugin_versions
	`).all() as Array<{ plugin_id: string }>;
	
	const pluginsWithVersions = new Set(existingVersions.map(v => v.plugin_id));
	console.log(`${pluginsWithVersions.size} plugins already have versions`);
	
	// Insert initial version for plugins without versions
	const insertVersion = db.prepare(`
		INSERT INTO plugin_versions (id, plugin_id, version, code, parameters, status, created_at)
		VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
	`);
	
	let created = 0;
	for (const plugin of plugins) {
		if (pluginsWithVersions.has(plugin.id)) {
			console.log(`Skipping ${plugin.author}/${plugin.name} - already has versions`);
			continue;
		}
		
		const versionId = randomBytes(16).toString('hex');
		const defaultCode = `// Plugin code for ${plugin.name}\n// This is a placeholder - please update with actual code\n\nexport default function ${plugin.name.replace(/-/g, '_')}(params) {\n  console.log('Plugin executed:', params);\n  return { success: true };\n}`;
		const defaultParams = JSON.stringify([]);
		
		try {
			insertVersion.run(
				versionId,
				plugin.id,
				'1.0.0',
				defaultCode,
				defaultParams,
				'pending' // Set to pending so admin can review
			);
			created++;
			console.log(`✓ Created version for ${plugin.author}/${plugin.name}`);
		} catch (err) {
			console.error(`✗ Failed to create version for ${plugin.author}/${plugin.name}:`, err);
		}
	}
	
	console.log(`\n✅ Successfully created ${created} initial versions`);
	console.log(`⚠️  These versions are set to 'pending' status with placeholder code.`);
	console.log(`   Plugin authors should update their plugins to add proper code.`);
	
} catch (error) {
	console.error('❌ Failed:', error);
	throw error;
} finally {
	db.close();
}
