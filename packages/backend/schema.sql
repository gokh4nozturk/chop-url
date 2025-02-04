-- Drop existing tables
DROP TABLE IF EXISTS urls;
DROP TABLE IF EXISTS visits;

-- Create urls table
CREATE TABLE urls (
    short_id TEXT PRIMARY KEY,
    original_url TEXT NOT NULL,
    created_at TEXT NOT NULL,
    visits INTEGER NOT NULL DEFAULT 0
);

-- Create visits table
CREATE TABLE visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url_id TEXT NOT NULL,
    visited_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    FOREIGN KEY (url_id) REFERENCES urls(short_id)
); 