import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import type { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  FRONTEND_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

// this endpoint is used to redirect the user to the original URL
app.get('/:shortId', async (c) => {
  console.log('c.env.FRONTEND_URL', c.env.FRONTEND_URL);
  console.log('c.req.param', c.req.param('shortId'));
  try {
    const shortId = c.req.param('shortId');

    if (!shortId) {
      throw new HTTPException(400, { message: 'Short ID is required' });
    }

    const result = await c.env.DB.prepare(
      'SELECT original_url FROM urls WHERE short_id = ?'
    )
      .bind(shortId)
      .first<{ original_url: string }>();

    if (!result) {
      // Eğer URL bulunamazsa frontend'e yönlendir
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${c.env.FRONTEND_URL}?error=url-not-found`,
        },
      });
    }

    // Ziyaret sayısını artır
    await c.env.DB.prepare(
      'UPDATE urls SET visit_count = visit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE short_id = ?'
    )
      .bind(shortId)
      .run();

    // Orijinal URL'ye yönlendir
    return new Response(null, {
      status: 302,
      headers: {
        Location: result.original_url,
      },
    });
  } catch (error) {
    console.error('Error redirecting:', error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${c.env.FRONTEND_URL}?error=server-error`,
      },
    });
  }
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
