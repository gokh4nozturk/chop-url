-- Add ssl_status column
ALTER TABLE domains ADD COLUMN ssl_status TEXT DEFAULT 'PENDING';

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS enforce_ssl_status_enum_insert;
DROP TRIGGER IF EXISTS enforce_ssl_status_enum_update;

-- Add check constraint for ssl_status on INSERT
CREATE TRIGGER enforce_ssl_status_enum_insert
BEFORE INSERT ON domains
BEGIN
    SELECT CASE
        WHEN NEW.ssl_status NOT IN ('PENDING', 'ACTIVE', 'FAILED', 'EXPIRED', 'INITIALIZING') THEN
            RAISE (ABORT, 'Invalid ssl_status value')
    END;
END;

-- Add check constraint for ssl_status on UPDATE
CREATE TRIGGER enforce_ssl_status_enum_update
BEFORE UPDATE OF ssl_status ON domains
BEGIN
    SELECT CASE
        WHEN NEW.ssl_status NOT IN ('PENDING', 'ACTIVE', 'FAILED', 'EXPIRED', 'INITIALIZING') THEN
            RAISE (ABORT, 'Invalid ssl_status value')
    END;
END;

-- Update existing records
UPDATE domains SET ssl_status = 'INITIALIZING' WHERE ssl_status NOT IN ('PENDING', 'ACTIVE', 'FAILED', 'EXPIRED', 'INITIALIZING') OR ssl_status IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_domains_ssl_status ON domains(ssl_status); 