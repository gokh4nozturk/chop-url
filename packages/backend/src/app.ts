import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ChopUrl, isValidUrl } from '@chop-url/lib';
import type { D1Database } from '@cloudflare/workers-types';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.post('/api/shorten', async (c) => {
  try {
    const { url } = await c.req.json();

    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }

    if (!isValidUrl(url)) {
      return c.json({ error: 'Invalid URL' }, 400);
    }

    const chopUrl = new ChopUrl({ baseUrl: 'https://chop.url', db: c.env.DB });
    try {
      const result = await chopUrl.createShortUrl(url);
      return c.json(result);
    } catch (error) {
      return c.json({ error: 'Failed to create short URL' }, 500);
    }
  } catch (error) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
