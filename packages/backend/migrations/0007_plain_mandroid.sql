-- Create custom events table if not exists
CREATE TABLE IF NOT EXISTS `custom_events` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `user_id` integer NOT NULL,
    `name` text NOT NULL,
    `description` text,
    `properties` text,
    `created_at` text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Recreate events table with all columns
DROP TABLE IF EXISTS `events`;

CREATE TABLE `events` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `url_id` integer NOT NULL,
    `user_id` integer,
    `event_type` text NOT NULL,
    `event_name` text NOT NULL,
    `properties` text,
    `device_info` text,
    `geo_info` text,
    `referrer` text,
    `created_at` text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`url_id`) REFERENCES `urls`(`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS `idx_events_url_id` ON `events`(`url_id`);
CREATE INDEX IF NOT EXISTS `idx_events_event_type` ON `events`(`event_type`);
CREATE INDEX IF NOT EXISTS `idx_events_created_at` ON `events`(`created_at`);

-- Update urls table structure safely
PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS `urls_new` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `short_id` text NOT NULL,
    `original_url` text NOT NULL,
    `custom_slug` text,
    `user_id` integer,
    `created_at` text DEFAULT CURRENT_TIMESTAMP,
    `last_accessed_at` text,
    `visit_count` integer DEFAULT 0,
    `expires_at` text,
    `is_active` integer DEFAULT true,
    `tags` text,
    `group_id` integer,
    `domainId` integer,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (`group_id`) REFERENCES `url_groups`(`id`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (`domainId`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE set null
);

INSERT OR IGNORE INTO `urls_new`
SELECT * FROM `urls`;

DROP TABLE IF EXISTS `urls`;
ALTER TABLE `urls_new` RENAME TO `urls`;

CREATE UNIQUE INDEX IF NOT EXISTS `urls_short_id_unique` ON `urls`(`short_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `urls_custom_slug_unique` ON `urls`(`custom_slug`);

-- Update visits table structure safely
CREATE TABLE IF NOT EXISTS `visits_new` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `url_id` integer NOT NULL,
    `visited_at` text DEFAULT CURRENT_TIMESTAMP,
    `ip_address` text,
    `user_agent` text,
    `referrer` text,
    `browser` text,
    `browser_version` text,
    `os` text,
    `os_version` text,
    `device_type` text,
    `country` text,
    `city` text,
    `region` text,
    `region_code` text,
    `timezone` text,
    `longitude` text,
    `latitude` text,
    `postal_code` text,
    `utm_source` text,
    `utm_medium` text,
    `utm_campaign` text,
    `utm_term` text,
    `utm_content` text,
    FOREIGN KEY (`url_id`) REFERENCES `urls`(`id`) ON UPDATE no action ON DELETE cascade
);

INSERT OR IGNORE INTO `visits_new`
SELECT * FROM `visits`;

DROP TABLE IF EXISTS `visits`;
ALTER TABLE `visits_new` RENAME TO `visits`;

PRAGMA foreign_keys=ON; 