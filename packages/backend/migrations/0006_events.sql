-- Create events table for tracking URL events if not exists
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    properties TEXT, -- JSON string
    device_info TEXT, -- JSON string
    geo_info TEXT, -- JSON string
    referrer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);

-- Create indexes for better query performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_events_url_id ON events(url_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at); 