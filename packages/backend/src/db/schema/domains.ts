import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

export const domains = sqliteTable('domains', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull(),
  isVerified: integer('isVerified', { mode: 'boolean' }).default(false),
  verificationToken: text('verificationToken'),
  verificationMethod: text('verificationMethod', {
    enum: ['DNS_TXT', 'DNS_CNAME', 'FILE'],
  }).default('DNS_TXT'),
  sslStatus: text('sslStatus', {
    enum: [
      'PENDING',
      'ACTIVE',
      'FAILED',
      'EXPIRED',
      'INITIALIZING',
      'INACTIVE',
    ],
  }).default('PENDING'),
  isActive: integer('isActive', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  lastHealthCheck: text('lastHealthCheck'),
});

export const domainSettings = sqliteTable('domain_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  domainId: integer('domainId')
    .notNull()
    .references(() => domains.id, { onDelete: 'cascade' }),
  redirectMode: text('redirectMode', {
    enum: ['PROXY', 'REDIRECT'],
  }).default('PROXY'),
  customNameservers: text('customNameservers'),
  forceSSL: integer('forceSSL', { mode: 'boolean' }).default(true),
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const domainDnsRecords = sqliteTable('domain_dns_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  domainId: integer('domainId')
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
  createdAt: text('createdAt').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updatedAt').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Types
export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;

export type DomainSettings = typeof domainSettings.$inferSelect;
export type NewDomainSettings = typeof domainSettings.$inferInsert;

export type DomainDnsRecord = typeof domainDnsRecords.$inferSelect;
export type NewDomainDnsRecord = typeof domainDnsRecords.$inferInsert;
