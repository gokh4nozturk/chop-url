-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS enforce_ssl_status_enum_insert;
DROP TRIGGER IF EXISTS enforce_ssl_status_enum_update;

-- Create temporary table with new structure
CREATE TABLE domains_new (
    id integer PRIMARY KEY AUTOINCREMENT,
    userId integer NOT NULL,
    domain text NOT NULL,
    isVerified integer DEFAULT 0,
    verificationToken text,
    verificationMethod text CHECK(verificationMethod IN ('DNS_TXT', 'DNS_CNAME', 'FILE')) DEFAULT 'DNS_TXT',
    sslStatus text CHECK(sslStatus IN ('PENDING', 'ACTIVE', 'FAILED')) DEFAULT 'PENDING',
    ssl_status TEXT CHECK(ssl_status IN ('PENDING', 'ACTIVE', 'FAILED', 'EXPIRED', 'INITIALIZING')) DEFAULT 'PENDING',
    isActive integer DEFAULT 0,
    createdAt text DEFAULT CURRENT_TIMESTAMP,
    updatedAt text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy data from old table to new table
INSERT INTO domains_new 
SELECT 
    id,
    userId,
    domain,
    isVerified,
    verificationToken,
    verificationMethod,
    sslStatus,
    'INITIALIZING' as ssl_status,
    isActive,
    createdAt,
    updatedAt
FROM domains;

-- Drop old table
DROP TABLE domains;

-- Rename new table to original name
ALTER TABLE domains_new RENAME TO domains;

-- Recreate indexes
CREATE UNIQUE INDEX idx_domains_domain ON domains(domain);
CREATE INDEX idx_domains_userId ON domains(userId);
CREATE INDEX idx_domains_ssl_status ON domains(ssl_status); 