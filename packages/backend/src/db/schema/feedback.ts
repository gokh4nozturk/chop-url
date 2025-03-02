import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const feedbackTable = sqliteTable('feedback', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  category: text('category', {
    enum: ['bug', 'feature', 'improvement', 'other'],
  }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status', { enum: ['open', 'in_progress', 'closed'] })
    .default('open')
    .notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high'] })
    .default('medium')
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type Feedback = typeof feedbackTable.$inferSelect;
export type NewFeedback = typeof feedbackTable.$inferInsert;
