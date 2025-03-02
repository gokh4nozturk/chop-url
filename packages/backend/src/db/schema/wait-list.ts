import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const waitList = sqliteTable('wait_list', {
  id: integer('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  company: text('company'),
  use_case: text('use_case').notNull(),
  status: text('status', {
    enum: ['pending', 'approved', 'rejected', 'invited', 'registered'],
  })
    .notNull()
    .default('pending'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});
