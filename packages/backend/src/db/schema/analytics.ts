import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';
import { urls } from './urls';
import { users } from './users';

// Event types
export const EVENT_TYPES = [
  'PAGE_VIEW',
  'CLICK',
  'CONVERSION',
  'CUSTOM',
  'REDIRECT',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// Zod schemas for validation
const deviceInfoSchema = z.object({
  userAgent: z.string(),
  ip: z.string(),
  browser: z.string(),
  browserVersion: z.string(),
  os: z.string(),
  osVersion: z.string(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']),
});

const geoInfoSchema = z.object({
  country: z.string(),
  city: z.string(),
  region: z.string(),
  regionCode: z.string(),
  timezone: z.string(),
  longitude: z.string(),
  latitude: z.string(),
  postalCode: z.string(),
});

const eventPropertiesSchema = z.object({
  source: z.string().nullable(),
  medium: z.string().nullable(),
  campaign: z.string().nullable(),
  term: z.string().nullable(),
  content: z.string().nullable(),
  shortId: z.string(),
  originalUrl: z.string(),
});

// Custom JSON field transformer
const jsonField = <T>(schema: z.ZodType<T>) => ({
  parse: (value: string | null): T | null => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      return schema.parse(parsed);
    } catch {
      return null;
    }
  },
  serialize: (value: T | null): string | null => {
    if (!value) return null;
    return JSON.stringify(value);
  },
});

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  urlId: integer('url_id')
    .references(() => urls.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  eventType: text('event_type', {
    enum: EVENT_TYPES,
  }).notNull(),
  eventName: text('event_name').notNull(),
  properties: text('properties'),
  deviceInfo: text('device_info'),
  geoInfo: text('geo_info'),
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
  properties: text('properties'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Export type definitions
export type DeviceInfo = z.infer<typeof deviceInfoSchema>;
export type GeoInfo = z.infer<typeof geoInfoSchema>;
export type EventProperties = z.infer<typeof eventPropertiesSchema>;

// Export schemas for reuse
export const schemas = {
  deviceInfo: deviceInfoSchema,
  geoInfo: geoInfoSchema,
  eventProperties: eventPropertiesSchema,
};
