-- Add model field to plugins table to track which AI model generated the plugin
ALTER TABLE plugins ADD COLUMN model TEXT;

-- Add index for model field for filtering
CREATE INDEX IF NOT EXISTS idx_plugins_model ON plugins(model);
