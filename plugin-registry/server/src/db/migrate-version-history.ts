import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'registry.db');
const db = new Database(dbPath);

console.log('Starting version history migration...');

try {
	// Check if migration is needed
	const tableInfo = db.prepare("PRAGMA table_info(plugins)").all() as Array<{ name: string }>;
	const hasVersionColumn = tableInfo.some(col => col.name === 'version');
	
	if (!hasVersionColumn) {
		console.log('✅ Database already migrated to version history schema. Nothing to do.');
		process.exit(0);
	}

	console.log('Found old schema. Starting migration...');

	// Begin transaction
	db.exec('BEGIN TRANSACTION');

	// Step 1: Create new plugin_versions table
	db.exec(`
		CREATE TABLE IF NOT EXISTS plugin_versions (
			id TEXT PRIMARY KEY,
			plugin_id TEXT NOT NULL,
			version TEXT NOT NULL,
			code TEXT NOT NULL,
			parameters TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			approved_by TEXT,
			approved_at TEXT,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(plugin_id, version),
			FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
		)
	`);

	// Step 2: Create indexes for plugin_versions
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_plugin_versions_plugin ON plugin_versions(plugin_id);
		CREATE INDEX IF NOT EXISTS idx_plugin_versions_status ON plugin_versions(status);
		CREATE INDEX IF NOT EXISTS idx_plugin_versions_created ON plugin_versions(created_at DESC);
	`);

	// Step 3: Migrate existing plugins to plugin_versions
	const existingPlugins = db.prepare(`
		SELECT id, version, code, parameters, status, approved_by, approved_at, created_at
		FROM plugins
	`).all();

	const insertVersion = db.prepare(`
		INSERT INTO plugin_versions (id, plugin_id, version, code, parameters, status, approved_by, approved_at, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	for (const plugin of existingPlugins as any[]) {
		const versionId = `${plugin.id}_v${plugin.version}`;
		insertVersion.run(
			versionId,
			plugin.id,
			plugin.version,
			plugin.code,
			plugin.parameters,
			plugin.status,
			plugin.approved_by,
			plugin.approved_at,
			plugin.created_at
		);
	}

	// Step 4: Remove UNIQUE constraint on (author, name) and add version-independent fields
	// SQLite doesn't support DROP CONSTRAINT, so we need to recreate the table
	db.exec(`
		CREATE TABLE plugins_new (
			id TEXT PRIMARY KEY,
			author TEXT NOT NULL,
			name TEXT NOT NULL,
			description TEXT NOT NULL,
			tags TEXT NOT NULL,
			model TEXT,
			downloads INTEGER DEFAULT 0,
			author_id TEXT NOT NULL,
			file_url TEXT,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(author, name),
			FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`);

	// Step 5: Copy data to new table (excluding version-specific fields)
	db.exec(`
		INSERT INTO plugins_new (id, author, name, description, tags, model, downloads, author_id, file_url, created_at, updated_at)
		SELECT id, author, name, description, tags, model, downloads, author_id, file_url, created_at, updated_at
		FROM plugins
	`);

	// Step 6: Drop old table and rename new one
	db.exec('DROP TABLE plugins');
	db.exec('ALTER TABLE plugins_new RENAME TO plugins');

	// Step 7: Recreate indexes
	db.exec(`
		CREATE INDEX IF NOT EXISTS idx_plugins_author ON plugins(author);
		CREATE INDEX IF NOT EXISTS idx_plugins_tags ON plugins(tags);
		CREATE INDEX IF NOT EXISTS idx_plugins_model ON plugins(model);
		CREATE INDEX IF NOT EXISTS idx_plugins_downloads ON plugins(downloads DESC);
		CREATE INDEX IF NOT EXISTS idx_plugins_created ON plugins(created_at DESC);
	`);

	// Commit transaction
	db.exec('COMMIT');

	console.log('✅ Migration completed successfully!');
	console.log(`Migrated ${existingPlugins.length} plugin versions to new schema.`);

} catch (error) {
	// Rollback on error
	db.exec('ROLLBACK');
	console.error('❌ Migration failed:', error);
	throw error;
} finally {
	db.close();
}
