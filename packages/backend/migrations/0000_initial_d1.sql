-- Create URLs table
DROP TABLE IF EXISTS urls;
CREATE TABLE urls (
    short_id TEXT PRIMARY KEY,
    original_url TEXT NOT NULL,
    created_at TEXT NOT NULL,
    visits INTEGER NOT NULL DEFAULT 0
);

-- Create index on short_id for faster lookups
CREATE INDEX idx_urls_short_id ON urls(short_id);

-- Create visits table for detailed analytics
DROP TABLE IF EXISTS visits;
CREATE TABLE visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url_id INTEGER,
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    FOREIGN KEY(url_id) REFERENCES urls(id)
);

-- Create index on url_id and visited_at for faster analytics queries
CREATE INDEX idx_visits_url_id ON visits(url_id);
CREATE INDEX idx_visits_visited_at ON visits(visited_at); 