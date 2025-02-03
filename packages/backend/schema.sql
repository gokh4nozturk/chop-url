DROP TABLE IF EXISTS urls;
CREATE TABLE urls (
  short_id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  visits INTEGER NOT NULL DEFAULT 0
); 