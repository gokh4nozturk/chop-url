import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { ChopUrl } from '@chop-url/lib';
import { openApiSchema } from './openapi';

interface Env {
  DB: D1Database;
  BASE_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['https://chop-url.vercel.app', 'http://localhost:3000'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true,
}));

// API Documentation
app.get('/docs/openapi.json', (c) => c.json(openApiSchema));
app.get('/docs', async (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Chop URL API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '/docs/openapi.json',
                dom_id: '#swagger-ui',
            });
        };
    </script>
</body>
</html>`;
  return c.html(html);
});

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