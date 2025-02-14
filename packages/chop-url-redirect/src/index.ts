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

async function trackEvent(
  c: CFContext,
  urlId: number,
  eventType: string,
  eventName: string,
  additionalProperties: Record<string, unknown> = {}
) {
  try {
    const cf = c.req.raw.cf;
    const ipAddress =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      c.req.header('x-real-ip') ||
      'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    const referrer = c.req.header('referer') || null;

    // Parse user agent
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    // Device info
    const deviceInfo = {
      userAgent,
      ip: ipAddress,
      browser: browser.name,
      browserVersion: browser.version,
      os: os.name,
      osVersion: os.version,
      deviceType: device.type || 'unknown',
    };

    // Geo info
    const geoInfo = {
      country: cf?.country || 'Unknown',
      city: cf?.city || 'Unknown',
      region: cf?.region || 'Unknown',
      regionCode: cf?.regionCode || 'Unknown',
      timezone: cf?.timezone || 'Unknown',
      longitude: cf?.longitude || null,
      latitude: cf?.latitude || null,
      postalCode: cf?.postalCode || null,
    };

    // Parse URL for UTM parameters
    const url = new URL(c.req.url);
    const utmParams = {
      source: url.searchParams.get('utm_source'),
      medium: url.searchParams.get('utm_medium'),
      campaign: url.searchParams.get('utm_campaign'),
      term: url.searchParams.get('utm_term'),
      content: url.searchParams.get('utm_content'),
    };

    // Combine all properties
    const properties = {
      ...utmParams,
      ...additionalProperties,
    };

    // Track event
    await c.env.DB.prepare(`
      INSERT INTO events (
        url_id,
        event_type,
        event_name,
        properties,
        device_info,
        geo_info,
        referrer
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        urlId,
        eventType,
        eventName,
        JSON.stringify(properties),
        JSON.stringify(deviceInfo),
        JSON.stringify(geoInfo),
        referrer
      )
      .run();

    console.log('Event tracked:', {
      urlId,
      eventType,
      eventName,
      properties,
      deviceInfo,
      geoInfo,
      referrer,
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

// this endpoint is used to redirect the user to the original URL
app.get('/:shortId', async (c: CFContext) => {
  try {
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

    // Track redirect event
    await trackEvent(c, result.id, 'REDIRECT', 'url_redirect', {
      shortId,
      originalUrl: result.original_url,
    });

    // Update visit count
    await c.env.DB.prepare(
      'UPDATE urls SET visit_count = visit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(result.id)
      .run();

    // Redirect to original URL
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
