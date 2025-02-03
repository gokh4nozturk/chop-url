import { drizzle } from 'drizzle-orm/d1';
import { accounts, sessions, users, verificationTokens } from './schema';

export const createDb = (d1: D1Database) => {
  return drizzle(d1, {
    schema: {
      accounts,
      sessions,
      users,
      verificationTokens,
    },
  });
};

export type Database = ReturnType<typeof createDb>;
export * from './schema'; 