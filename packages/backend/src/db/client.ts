import { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export type Database = DrizzleD1Database<typeof schema>;

export const createDb = (d1: D1Database): Database => {
  return drizzle(d1, { schema });
};

type D1Result<T> = { results?: T[] };

export async function executeRawQuery<T>(
  d1: D1Database,
  query: string,
  params: (string | number)[] = []
): Promise<T[]> {
  try {
    console.log('Executing raw query:', { query, params });
    const result = await d1
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
