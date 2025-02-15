import { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { DrizzleD1Database } from 'drizzle-orm/d1';

export interface Env {
  BUCKET: R2Bucket;
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

export interface Variables {
  db: DrizzleD1Database;
}
