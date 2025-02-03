-- Create URLs table
CREATE TABLE IF NOT EXISTS urls (
    id SERIAL PRIMARY KEY,
    short_id VARCHAR(10) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    visit_count INTEGER DEFAULT 0
);

-- Create index on short_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_urls_short_id ON urls(short_id);

-- Create visits table for detailed analytics
CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    url_id INTEGER REFERENCES urls(id),
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT
);

-- Create index on url_id and visited_at for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_visits_url_id ON visits(url_id);
CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at); 