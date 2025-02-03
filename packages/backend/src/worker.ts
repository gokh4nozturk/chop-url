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
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['*'],
  exposeHeaders: ['*'],
  maxAge: 600,
  credentials: false,
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
app.post('/urls', async (c) => {
  try {
    const body = await c.req.json<{ url: string }>();
    console.log('Received request body:', body);

    if (!body.url) {
      return c.json({ error: 'URL is required' }, 400);
    }

    const url = body.url.trim();
    console.log('Processing URL:', url);

    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      console.error('Invalid URL format:', error);
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    const chopUrl = new ChopUrl({
      baseUrl: c.env.BASE_URL,
      db: c.env.DB
    });

    console.log('Creating short URL with base URL:', c.env.BASE_URL);
    const shortUrl = await chopUrl.createShortUrl(url);
    console.log('Created short URL:', shortUrl);
    
    return c.json(shortUrl);
  } catch (error) {
    console.error('Error creating short URL:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to create short URL',
      details: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

app.get('/urls/:shortId', async (c) => {
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