import { drizzle } from 'drizzle-orm/d1';
import { urls } from './schema/urls';
import { visits } from './schema/visits';

export * from './schema/urls';
export * from './schema/visits';

export function createDb(d1: D1Database) {
  return drizzle(d1, {
    schema: {
      urls,
      visits,
    },
  });
}

export const db = createDb(process.env.DB as unknown as D1Database);
