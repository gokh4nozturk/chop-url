import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const emailVerifications = sqliteTable('email_verifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  token: text('token').notNull().unique(),
  isUsed: integer('is_used', { mode: 'boolean' }).default(false),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
