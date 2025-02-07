import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';

interface Env {
  DB: D1Database;
  FRONTEND_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

// this endpoint is used to redirect the user to the original URL
app.get('/:shortId', async (c) => {
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
      return c.json({ message: 'Short URL not found' }, 404);
    }

    // Ziyaret sayısını artır
    try {
      await c.env.DB.prepare(
        'UPDATE urls SET visit_count = visit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE short_id = ?'
      )
        .bind(shortId)
        .run();
    } catch (error) {
      console.error('Error updating visit count:', error);
      // Ziyaret sayısı güncellenemese bile yönlendirmeye devam et
    }

    // Orijinal URL'ye yönlendir
    return new Response(null, {
      status: 302,
      headers: {
        Location: result.original_url,
      },
    });
  } catch (error) {
    console.error('Error in redirect handler:', error);
    if (error instanceof HTTPException) {
      return c.json({ message: error.message }, error.status);
    }
    return c.json({ message: 'Internal server error' }, 500);
  }
});

export default app;
