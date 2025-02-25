import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const domains = sqliteTable('domains', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull(),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  verificationToken: text('verification_token'),
  verificationMethod: text('verification_method', {
    enum: ['DNS_TXT', 'DNS_CNAME', 'FILE'],
  }).default('DNS_TXT'),
  sslStatus: text('ssl_status', {
    enum: [
      'PENDING',
      'ACTIVE',
      'FAILED',
      'EXPIRED',
      'INITIALIZING',
      'INACTIVE',
    ],
  }).default('PENDING'),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  lastHealthCheck: text('last_health_check'),
});

export const domainSettings = sqliteTable('domain_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  domainId: integer('domain_id')
    .notNull()
    .references(() => domains.id, { onDelete: 'cascade' }),
  redirectMode: text('redirect_mode', {
    enum: ['PROXY', 'REDIRECT'],
  }).default('PROXY'),
  customNameservers: text('custom_nameservers'),
  forceSSL: integer('force_ssl', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const domainDnsRecords = sqliteTable('domain_dns_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  domainId: integer('domain_id')
    .notNull()
    .references(() => domains.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS'],
  }).notNull(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  ttl: integer('ttl').default(3600),
  priority: integer('priority'),
  proxied: integer('proxied', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Types
export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;

export type DomainSettings = typeof domainSettings.$inferSelect;
export type NewDomainSettings = typeof domainSettings.$inferInsert;

export type DomainDnsRecord = typeof domainDnsRecords.$inferSelect;
export type NewDomainDnsRecord = typeof domainDnsRecords.$inferInsert;
