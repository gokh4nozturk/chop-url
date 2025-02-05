import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.get('/:shortId', async (c) => {
  const shortId = c.req.param('shortId');

  // TODO: Replace with actual KV store lookup
  const mockKV = new Map([['abc123', 'https://example.com']]);

  const originalUrl = mockKV.get(shortId);

  if (!originalUrl) {
    return c.json({ message: 'Short URL not found' }, 404);
  }

  // Create a redirect response directly
  return new Response(null, {
    status: 302,
    headers: {
      Location: originalUrl,
    },
  });
});

app.post('/api/shorten', async (c) => {
  try {
    const { url } = await c.req.json();

    if (!url) {
      return c.json({ message: 'URL is required' }, 400);
    }

    // Mock response for now
    return c.json(
      {
        shortId: 'abc123',
        shortUrl: 'https://example.com/abc123',
        originalUrl: url,
      },
      200
    );
  } catch (error) {
    return c.json({ message: 'Internal server error' }, 500);
  }
});

export default app;
