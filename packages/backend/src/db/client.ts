import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

let db: ReturnType<typeof drizzle>;

export type Database = DrizzleD1Database;

export const createDb = (d1: D1Database) => {
  db = drizzle(d1, { schema });
  return db;
};

type D1Result<T> = { results?: T[] };

export async function executeRawQuery<T>(
  db: ReturnType<typeof drizzle>,
  query: string,
  params: (string | number)[] = []
): Promise<T[]> {
  try {
    console.log('Executing raw query:', { query, params });
    const result = await db.$client
      .prepare(query)
      .bind(...params)
      .all();
    const data = (result as D1Result<T>).results || [];
    console.log('Query results:', { count: data.length });
    return data;
  } catch (error) {
    console.error('Error executing raw query:', error);
    throw error;
  }
}

export { db };
