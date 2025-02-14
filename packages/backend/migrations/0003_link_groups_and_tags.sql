-- Create URL Groups table if not exists
CREATE TABLE IF NOT EXISTS url_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add new columns to URLs table if they don't exist
SELECT CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pragma_table_info('urls') WHERE name = 'tags')
    THEN 'ALTER TABLE urls ADD COLUMN tags TEXT;'
END AS sql_statement
WHERE sql_statement IS NOT NULL;

SELECT CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pragma_table_info('urls') WHERE name = 'group_id')
    THEN 'ALTER TABLE urls ADD COLUMN group_id INTEGER REFERENCES url_groups(id) ON DELETE SET NULL;'
END AS sql_statement
WHERE sql_statement IS NOT NULL; 