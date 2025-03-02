import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const waitList = sqliteTable('wait_list', {
  id: integer('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  company: text('company'),
  useCase: text('use_case').notNull(),
  status: text('status', {
    enum: ['pending', 'approved', 'rejected', 'invited', 'registered'],
  })
    .notNull()
    .default('pending'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
