import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

let db: ReturnType<typeof drizzle>;

export function createDb(d1: D1Database) {
  db = drizzle(d1, { schema });
  return db;
}

export { db };
