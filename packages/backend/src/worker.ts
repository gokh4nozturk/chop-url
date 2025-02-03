import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { ChopUrl } from '@chop-url/lib';

interface Env {
  DB: D1Database;
  BASE_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// API Routes
app.post('/api/urls', async (c) => {
  const { url } = await c.req.json<{ url: string }>();
  const chopUrl = new ChopUrl({
    baseUrl: c.env.BASE_URL,
    db: c.env.DB
  });

  try {
    const shortUrl = await chopUrl.createShortUrl(url);
    return c.json(shortUrl);
  } catch (error) {
    return c.json({ error: 'Failed to create short URL' }, 500);
  }
});

app.get('/api/urls/:shortId', async (c) => {
  const { shortId } = c.req.param();
  const chopUrl = new ChopUrl({
    baseUrl: c.env.BASE_URL,
    db: c.env.DB
  });

  try {
    const urlInfo = await chopUrl.getUrlInfo(shortId);
    return c.json(urlInfo);
  } catch (error) {
    return c.json({ error: 'URL not found' }, 404);
  }
});

app.get('/:shortId', async (c) => {
  const { shortId } = c.req.param();
  const chopUrl = new ChopUrl({
    baseUrl: c.env.BASE_URL,
    db: c.env.DB
  });

  try {
    const originalUrl = await chopUrl.getOriginalUrl(shortId);
    return c.redirect(originalUrl);
  } catch (error) {
    return c.json({ error: 'URL not found' }, 404);
  }
});

export default app; 