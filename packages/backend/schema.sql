-- Drop existing tables
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS urls CASCADE;

-- Create urls table
CREATE TABLE IF NOT EXISTS urls (
    id SERIAL PRIMARY KEY,
    short_id VARCHAR(7) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    visits INTEGER NOT NULL DEFAULT 0
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    url_id VARCHAR(7) NOT NULL,
    visited_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    FOREIGN KEY (url_id) REFERENCES urls(short_id)
);

CREATE INDEX IF NOT EXISTS idx_short_id ON urls (short_id);
CREATE INDEX IF NOT EXISTS idx_url_id ON visits (url_id); 