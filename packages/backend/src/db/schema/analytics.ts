import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { urls } from './urls';
import { users } from './users';

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  urlId: integer('url_id')
    .references(() => urls.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  eventType: text('event_type').notNull(), // PAGE_VIEW, CLICK, CONVERSION, CUSTOM
  eventName: text('event_name').notNull(),
  properties: text('properties'), // JSON string
  deviceInfo: text('device_info'), // JSON string
  geoInfo: text('geo_info'), // JSON string
  referrer: text('referrer'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const customEvents = sqliteTable('custom_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  properties: text('properties'), // JSON string of string[]
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});
