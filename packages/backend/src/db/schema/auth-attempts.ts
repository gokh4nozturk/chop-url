import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const authAttempts = sqliteTable('auth_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  ipAddress: text('ip_address').notNull(),
  attemptType: text('attempt_type').notNull(),
  code: text('code').notNull(),
  isSuccessful: integer('is_successful', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
