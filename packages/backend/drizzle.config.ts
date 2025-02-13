import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/*',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: 'e7ad960838f1572c08aea106c4fa28ac',
    databaseId: '19c079b0-14b8-41da-bda5-db208ead1586',
    token: 'YOUR_CLOUDFLARE_API_TOKEN', // Bu değeri CI/CD sürecinde ayarlayacağız
  },
} satisfies Config;
