import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const recoveryCodes = sqliteTable('recovery_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  code: text('code').notNull(),
  isUsed: integer('is_used', { mode: 'boolean' }).default(false),
  usedAt: text('used_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
