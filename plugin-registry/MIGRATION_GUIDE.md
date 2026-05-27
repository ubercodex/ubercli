# Version History Migration Guide

## Overview
This migration adds version history support to the plugin registry, allowing multiple versions per plugin with independent approval status.

## What Changed

### Database Schema
- **plugins** table: Now stores only plugin metadata (author, name, description, tags)
- **plugin_versions** table: New table storing version-specific data (code, parameters, status)

### API Changes
- `GET /plugins/:author/:name` now accepts `?version=X.X.X` query parameter
- Returns latest **approved** version by default
- Response includes `availableVersions` array

### CLI Changes
- Install specific version: `/plugins install author-plugin@1.0.5`
- Install latest approved: `/plugins install author-plugin`

## Migration Steps

### 1. Backup Your Database
```bash
cd plugin-registry/server/data
cp registry.db registry.db.backup
```

### 2. Run Migration
```bash
cd plugin-registry/server
npm run migrate:version-history
```

### 3. Verify Migration
The migration will:
- Create `plugin_versions` table
- Migrate existing plugin data to new structure
- Preserve all existing plugins and their data
- Print success message with count of migrated plugins

### 4. Restart Server
```bash
npm run dev
```

## Testing

### Test Plugin Installation
```bash
# CLI
zal
/plugins install author-plugin

# With specific version
/plugins install author-plugin@1.0.0
```

### Test Plugin Update
1. Go to website → My Plugins
2. Edit a plugin
3. Change code → Creates new version (pending approval)
4. Change description → Updates metadata only

### Test Version History
1. Go to plugin detail page
2. Should see `availableVersions` in response
3. Each version has its own approval status

## Rollback

If something goes wrong:

```bash
cd plugin-registry/server/data
rm registry.db
mv registry.db.backup registry.db
```

Then restart the server with the old code.

## Notes

- Old plugins are preserved with their current version
- All existing plugins become version 1.0.0 in the new system
- Status is preserved for each version
- Downloads counter remains at plugin level
- Version increments automatically when code changes
