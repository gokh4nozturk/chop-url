import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { urls } from './urls';

export const qrCodes = sqliteTable('qr_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  urlId: integer('url_id')
    .notNull()
    .references(() => urls.id),
  imageUrl: text('image_url').notNull(),
  logoUrl: text('logo_url'),
  logoSize: integer('logo_size').default(40),
  logoPosition: text('logo_position').default('center'),
  downloadCount: integer('download_count').default(0),
  createdAt: text('created_at').default(String(new Date().toISOString())),
  updatedAt: text('updated_at').default(String(new Date().toISOString())),
});
