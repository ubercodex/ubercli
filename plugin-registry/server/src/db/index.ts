import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { SCHEMA } from './schema.js';

const DB_PATH = process.env.DATABASE_URL || './data/registry.db';

const dir = dirname(DB_PATH);
if (!existsSync(dir)) {
	mkdirSync(dir, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(SCHEMA);

// Auto-migration: Add system_prompt column if it doesn't exist
try {
	const tableInfo = db.prepare("PRAGMA table_info(profiles)").all() as any[];
	const hasSystemPrompt = tableInfo.some((col: any) => col.name === 'system_prompt');
	
	if (!hasSystemPrompt) {
		console.log('🔄 Running migration: Adding system_prompt column...');
		db.prepare('ALTER TABLE profiles ADD COLUMN system_prompt TEXT').run();
		console.log('✅ Migration complete: system_prompt column added');
	}
} catch (error) {
	console.error('⚠️ Migration warning:', error);
}

export function initDatabase() {
	console.log(`✓ Database initialized at ${DB_PATH}`);
}
