import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const urls = sqliteTable('urls', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  shortId: text('short_id').notNull().unique(),
  originalUrl: text('original_url').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  lastAccessedAt: text('last_accessed_at'),
  visitCount: integer('visit_count').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  expiresAt: text('expires_at'),
  userId: integer('user_id'),
  customSlug: text('custom_slug'),
});
