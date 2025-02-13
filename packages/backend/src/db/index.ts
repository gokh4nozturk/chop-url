import { createDb } from './client';

export const db = (dbInstance: D1Database) => createDb(dbInstance);
