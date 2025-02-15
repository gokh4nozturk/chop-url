import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/*',
  out: './migrations',
  driver: 'd1-http',
  dialect: 'sqlite',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    databaseId: process.env.CLOUDFLARE_DB_ID || '',
    token: process.env.CLOUDFLARE_API_TOKEN || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
