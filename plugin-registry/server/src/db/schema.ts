export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  github_id TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plugins (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT NOT NULL,
  code TEXT NOT NULL,
  parameters TEXT NOT NULL,
  tags TEXT NOT NULL,
  model TEXT,
  downloads INTEGER DEFAULT 0,
  author_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  file_url TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(author, name),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plugins_author ON plugins(author);
CREATE INDEX IF NOT EXISTS idx_plugins_tags ON plugins(tags);
CREATE INDEX IF NOT EXISTS idx_plugins_model ON plugins(model);
CREATE INDEX IF NOT EXISTS idx_plugins_downloads ON plugins(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_plugins_created ON plugins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plugins_status ON plugins(status);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT NOT NULL,
  system_prompt TEXT,
  downloads INTEGER DEFAULT 0,
  author_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(author, name),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_plugins (
  profile_id TEXT NOT NULL,
  plugin_id TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (profile_id, plugin_id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profiles_author ON profiles(author);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_downloads ON profiles(downloads DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_plugins_profile ON profile_plugins(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_plugins_plugin ON profile_plugins(plugin_id);
`;
