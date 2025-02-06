-- Add custom_slug column to urls table
ALTER TABLE urls ADD COLUMN custom_slug VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS idx_urls_custom_slug ON urls(custom_slug); 