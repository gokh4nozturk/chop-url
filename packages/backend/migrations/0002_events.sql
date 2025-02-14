CREATE TABLE IF NOT EXISTS `events` (
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `userId` integer NOT NULL,
  `type` text NOT NULL,
  `data` text,
  `createdAt` text DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS `idx_events_userId` ON `events`(`userId`);
CREATE INDEX IF NOT EXISTS `idx_events_type` ON `events`(`type`); 