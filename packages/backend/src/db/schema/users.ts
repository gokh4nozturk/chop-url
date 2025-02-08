import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  isEmailVerified: integer('is_email_verified', { mode: 'boolean' }).default(
    false
  ),
  isTwoFactorEnabled: integer('is_two_factor_enabled', {
    mode: 'boolean',
  }).default(false),
  twoFactorSecret: text('two_factor_secret'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
