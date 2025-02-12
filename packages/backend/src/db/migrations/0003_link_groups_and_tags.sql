-- Create URL Groups table
CREATE TABLE url_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add new columns to URLs table
ALTER TABLE urls ADD COLUMN tags TEXT;
ALTER TABLE urls ADD COLUMN group_id INTEGER REFERENCES url_groups(id) ON DELETE SET NULL; 