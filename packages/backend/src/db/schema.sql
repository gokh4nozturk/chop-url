-- Create auth_attempts table
DROP TABLE IF EXISTS auth_attempts;
CREATE TABLE auth_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('totp', 'recovery', 'password')),
  is_successful BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for auth_attempts
CREATE INDEX idx_auth_attempts_user_id ON auth_attempts(user_id);
CREATE INDEX idx_auth_attempts_ip_address ON auth_attempts(ip_address);
CREATE INDEX idx_auth_attempts_created_at ON auth_attempts(created_at);
CREATE INDEX idx_auth_attempts_type ON auth_attempts(attempt_type);

-- Create composite index for rate limiting queries
CREATE INDEX idx_auth_attempts_rate_limit ON auth_attempts(user_id, ip_address, attempt_type, created_at); 