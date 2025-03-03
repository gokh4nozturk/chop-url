import { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { Context as HonoContext } from 'hono';
import * as schema from './db/schema';

export interface IUser {
  id: number;
  email: string;
  name: string;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Env {
  BUCKET: R2Bucket;
  BUCKET_NAME: string;
  ACCOUNT_ID: string;
  ACCESS_KEY_ID: string;
  SECRET_ACCESS_KEY: string;
  R2_PUBLIC_URL: string;
  DB: D1Database;
  BASE_URL: string;
  FRONTEND_URL: string;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  RESEND_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_ZONE_ID: string;
}

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT: string;
};

export interface Variables {
  db: DrizzleD1Database<typeof schema>;
  userId?: string;
  user?: IUser;
}

export type Context = HonoContext<{ Bindings: Env; Variables: Variables }>;

// Hono zValidator için tip tanımlaması
declare module 'hono' {
  interface ContextVariableMap {
    json: unknown;
  }
}
