import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../../data/registry.db');
const db = new Database(dbPath);

try {
  console.log('Adding model field to plugins table...');
  
  // Check if column already exists
  const columns = db.prepare("PRAGMA table_info(plugins)").all() as any[];
  const hasModel = columns.some((col: any) => col.name === 'model');
  
  if (!hasModel) {
    db.exec(`
      ALTER TABLE plugins ADD COLUMN model TEXT;
      CREATE INDEX IF NOT EXISTS idx_plugins_model ON plugins(model);
    `);
    console.log('✅ Model field added successfully!');
  } else {
    console.log('ℹ️  Model field already exists, skipping migration.');
  }
  
  db.close();
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
