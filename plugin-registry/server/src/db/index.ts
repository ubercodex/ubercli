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

export function initDatabase() {
	console.log(`✓ Database initialized at ${DB_PATH}`);
}
