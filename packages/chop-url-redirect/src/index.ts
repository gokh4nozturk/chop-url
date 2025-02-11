import type { D1Database } from '@cloudflare/workers-types';
import { Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { UAParser } from 'ua-parser-js';

interface Env {
  DB: D1Database;
  FRONTEND_URL: string;
}

type Variables = Record<string, never>;

type CFContext = Context<{
  Bindings: Env;
  Variables: Variables;
}>;

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

// this endpoint is used to redirect the user to the original URL
app.get('/:shortId', async (c: CFContext) => {
  try {
    // CF objesi doğrudan request üzerinde geliyor
    const cf = c.req.raw.cf;
    console.log('CF Object:', cf);
    const shortId = c.req.param('shortId');

    if (!shortId) {
      throw new HTTPException(400, { message: 'Short ID is required' });
    }

    const result = await c.env.DB.prepare(
      'SELECT id, original_url FROM urls WHERE short_id = ?'
    )
      .bind(shortId)
      .first<{ id: number; original_url: string }>();

    if (!result) {
      return c.json({ message: 'Short URL not found' }, 404);
    }

    // Ziyaret bilgilerini kaydet
    try {
      const ipAddress =
        c.req.header('cf-connecting-ip') ||
        c.req.header('x-forwarded-for') ||
        c.req.header('x-real-ip') ||
        'unknown';
      const userAgent = c.req.header('user-agent') || 'unknown';
      const referrer = c.req.header('referer') || null;
      const country = cf?.country || 'Unknown';
      const city = cf?.city || 'Unknown';

      // Parse user agent
      const parser = new UAParser(userAgent);
      const browser = parser.getBrowser();
      const os = parser.getOS();
      const device = parser.getDevice();

      console.log('Visit Info:', {
        ip: ipAddress,
        userAgent,
        referrer,
        country,
        city,
        browser: browser.name,
        browserVersion: browser.version,
        os: os.name,
        osVersion: os.version,
        deviceType: device.type,
      });

      // Ziyaret sayısını artır
      await c.env.DB.prepare(
        'UPDATE urls SET visit_count = visit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
        .bind(result.id)
        .run();

      // Ziyaret kaydı ekle
      await c.env.DB.prepare(`
        INSERT INTO visits (
          url_id, ip_address, user_agent, referrer, 
          browser, browser_version, os, os_version, 
          device_type, country, city, region, region_code,
          timezone, longitude, latitude, postal_code,
          visited_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
        .bind(
          result.id,
          ipAddress,
          userAgent,
          referrer,
          browser.name || null,
          browser.version || null,
          os.name || null,
          os.version || null,
          device.type || null,
          country,
          city,
          cf?.region || 'Unknown',
          cf?.regionCode || 'Unknown',
          cf?.timezone || 'Unknown',
          cf?.longitude || null,
          cf?.latitude || null,
          cf?.postalCode || null
        )
        .run();
    } catch (error) {
      console.error('Error tracking visit:', error);
      // Ziyaret kaydı başarısız olsa bile yönlendirmeye devam et
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
