-- Drop existing tables
DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS urls;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create urls table with user relation
CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    short_id TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    custom_slug TEXT UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at DATETIME,
    visit_count INTEGER DEFAULT 0,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create visits table with enhanced analytics
CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url_id INTEGER REFERENCES urls(id) ON DELETE CASCADE,
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT,
    browser TEXT,
    browser_version TEXT,
    os TEXT,
    os_version TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_urls_short_id ON urls(short_id);
CREATE INDEX IF NOT EXISTS idx_urls_custom_slug ON urls(custom_slug);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_url_id ON visits(url_id);
CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_visits_country ON visits(country);
CREATE INDEX IF NOT EXISTS idx_visits_device_type ON visits(device_type);
CREATE INDEX IF NOT EXISTS idx_visits_browser ON visits(browser);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at); 