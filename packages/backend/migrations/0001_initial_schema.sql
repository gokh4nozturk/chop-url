-- Create base tables
CREATE TABLE IF NOT EXISTS `users` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `email` text UNIQUE NOT NULL,
  `password` text,
  `name` text,
  `isEmailVerified` integer DEFAULT 0,
  `isTwoFactorEnabled` integer DEFAULT 0,
  `twoFactorSecret` text,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` text DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `auth_attempts` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `email` text NOT NULL,
  `ip` text NOT NULL,
  `userAgent` text,
  `success` integer DEFAULT 0,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `userId` integer NOT NULL,
  `token` text UNIQUE NOT NULL,
  `ip` text,
  `userAgent` text,
  `expiresAt` text NOT NULL,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `email_verifications` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `userId` integer NOT NULL,
  `token` text UNIQUE NOT NULL,
  `expiresAt` text NOT NULL,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `userId` integer NOT NULL,
  `token` text UNIQUE NOT NULL,
  `expiresAt` text NOT NULL,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `recovery_codes` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `userId` integer NOT NULL,
  `code` text NOT NULL,
  `isUsed` integer DEFAULT 0,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `url_groups` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `userId` integer NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `urls` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `userId` integer NOT NULL,
  `groupId` integer,
  `originalUrl` text NOT NULL,
  `shortId` text UNIQUE NOT NULL,
  `title` text,
  `description` text,
  `expiresAt` text,
  `password` text,
  `isActive` integer DEFAULT 1,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`groupId`) REFERENCES `url_groups`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `visits` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `urlId` integer NOT NULL,
  `ip` text,
  `userAgent` text,
  `referer` text,
  `country` text,
  `city` text,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`urlId`) REFERENCES `urls`(`id`) ON DELETE CASCADE
);

-- Create domains and related tables
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

-- Create indices
CREATE UNIQUE INDEX IF NOT EXISTS `idx_domains_domain` ON `domains`(`domain`);
CREATE INDEX IF NOT EXISTS `idx_domains_userId` ON `domains`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_domain_settings_domainId` ON `domain_settings`(`domainId`);
CREATE INDEX IF NOT EXISTS `idx_domain_dns_records_domainId` ON `domain_dns_records`(`domainId`);
CREATE INDEX IF NOT EXISTS `idx_domain_dns_records_type` ON `domain_dns_records`(`type`);
CREATE INDEX IF NOT EXISTS `idx_urls_domainId` ON `urls`(`domainId`); 