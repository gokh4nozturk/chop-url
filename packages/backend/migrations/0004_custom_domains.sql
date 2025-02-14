CREATE TABLE IF NOT EXISTS `domains` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `userId` integer NOT NULL,
  `domain` text NOT NULL,
  `isVerified` integer DEFAULT 0,
  `verificationToken` text,
  `verificationMethod` text CHECK(`verificationMethod` IN ('DNS_TXT', 'DNS_CNAME', 'FILE')) DEFAULT 'DNS_TXT',
  `sslStatus` text CHECK(`sslStatus` IN ('PENDING', 'ACTIVE', 'FAILED')) DEFAULT 'PENDING',
  `isActive` integer DEFAULT 0,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_domains_domain` ON `domains`(`domain`);
CREATE INDEX IF NOT EXISTS `idx_domains_userId` ON `domains`(`userId`);

CREATE TABLE IF NOT EXISTS `domain_settings` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `domainId` integer NOT NULL,
  `redirectMode` text CHECK(`redirectMode` IN ('PROXY', 'REDIRECT')) DEFAULT 'PROXY',
  `customNameservers` text,
  `forceSSL` integer DEFAULT 1,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`domainId`) REFERENCES `domains`(`id`) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS `idx_domain_settings_domainId` ON `domain_settings`(`domainId`);

CREATE TABLE IF NOT EXISTS `domain_dns_records` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `domainId` integer NOT NULL,
  `type` text NOT NULL CHECK(`type` IN ('A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS')),
  `name` text NOT NULL,
  `content` text NOT NULL,
  `ttl` integer DEFAULT 3600,
  `priority` integer,
  `proxied` integer DEFAULT 0,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`domainId`) REFERENCES `domains`(`id`) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS `idx_domain_dns_records_domainId` ON `domain_dns_records`(`domainId`);
CREATE INDEX IF NOT EXISTS `idx_domain_dns_records_type` ON `domain_dns_records`(`type`);

-- Add domain relationship to urls table if column doesn't exist
SELECT CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pragma_table_info('urls') WHERE name = 'domainId')
    THEN 'ALTER TABLE urls ADD COLUMN domainId integer REFERENCES domains(id) ON DELETE SET NULL;'
END AS sql_statement
WHERE sql_statement IS NOT NULL;

CREATE INDEX IF NOT EXISTS `idx_urls_domainId` ON `urls`(`domainId`); 