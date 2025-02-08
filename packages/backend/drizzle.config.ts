import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: '19c079b0-14b8-41da-bda5-db208ead1586',
    databaseId: '19c079b0-14b8-41da-bda5-db208ead1586',
    token: 'chop-url-db-local',
  },
} satisfies Config;
