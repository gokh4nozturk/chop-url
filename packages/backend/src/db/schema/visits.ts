import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { urls } from './urls';

export const visits = sqliteTable('visits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  urlId: integer('url_id')
    .references(() => urls.id, { onDelete: 'cascade' })
    .notNull(),
  visitedAt: text('visited_at').default(sql`CURRENT_TIMESTAMP`),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  browser: text('browser'),
  browserVersion: text('browser_version'),
  os: text('os'),
  osVersion: text('os_version'),
  deviceType: text('device_type'),
  country: text('country'),
  city: text('city'),
  region: text('region'),
  regionCode: text('region_code'),
  timezone: text('timezone'),
  longitude: text('longitude'),
  latitude: text('latitude'),
  postalCode: text('postal_code'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmTerm: text('utm_term'),
  utmContent: text('utm_content'),
});
