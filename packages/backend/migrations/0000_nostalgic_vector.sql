CREATE TABLE IF NOT EXISTS `custom_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`properties` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `events` (
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `auth_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`ip_address` text NOT NULL,
	`attempt_type` text NOT NULL,
	`code` text NOT NULL,
	`is_successful` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `domain_dns_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`domain_id` integer NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`ttl` integer DEFAULT 3600,
	`priority` integer,
	`proxied` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `domain_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`domain_id` integer NOT NULL,
	`redirect_mode` text DEFAULT 'PROXY',
	`custom_nameservers` text,
	`force_ssl` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `domains` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`domain` text NOT NULL,
	`is_verified` integer DEFAULT false,
	`verification_token` text,
	`verification_method` text DEFAULT 'DNS_TXT',
	`ssl_status` text DEFAULT 'PENDING',
	`is_active` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_health_check` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `email_verifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`token` text NOT NULL,
	`is_used` integer DEFAULT false,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `email_verifications_token_unique` ON `email_verifications` (`token`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `urls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`short_id` text NOT NULL,
	`original_url` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_accessed_at` text,
	`visit_count` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`expires_at` text,
	`user_id` integer,
	`custom_slug` text,
	`tags` text,
	`group_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `urls_short_id_unique` ON `urls` (`short_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `visits` (
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`is_email_verified` integer DEFAULT false,
	`is_two_factor_enabled` integer DEFAULT false,
	`two_factor_secret` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `url_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`user_id` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `recovery_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`code` text NOT NULL,
	`is_used` integer DEFAULT false,
	`used_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `password_resets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `qr_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url_id` integer NOT NULL,
	`image_url` text NOT NULL,
	`logo_url` text,
	`logo_size` integer DEFAULT 40,
	`logo_position` text DEFAULT 'center',
	`download_count` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`url_id`) REFERENCES `urls`(`id`) ON UPDATE no action ON DELETE cascade
);