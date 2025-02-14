import type { D1Database } from '@cloudflare/workers-types';
import { Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { UAParser } from 'ua-parser-js';
import { WebSocketService } from './WebSocketService';

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

// Create WebSocket service instance
const wsService = new WebSocketService();

app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://chop-url.com',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowHeaders: [
      'Origin',
      'Content-Type',
      'Accept',
      'Authorization',
      'Upgrade',
      'Connection',
      'Sec-WebSocket-Key',
      'Sec-WebSocket-Version',
      'Sec-WebSocket-Extensions',
      'Sec-WebSocket-Protocol',
    ],
    exposeHeaders: [
      'Content-Length',
      'X-Requested-With',
      'Upgrade',
      'Connection',
      'Sec-WebSocket-Accept',
    ],
    credentials: true,
    maxAge: 86400,
  })
);

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

    // Create event data for WebSocket
    const eventData = {
      urlId,
      eventType,
      eventName,
      properties,
      deviceInfo,
      geoInfo,
      referrer,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to WebSocket clients
    console.log('[WebSocket] Broadcasting to WebSocket clients:', {
      room: `url:${urlId}`,
      eventData,
    });
    wsService.broadcast(`url:${urlId}`, eventData);

    console.log('[Event] Event tracked successfully:', {
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

// WebSocket endpoint
app.get('/ws', async (c) => {
  try {
    // Log all request headers for debugging
    console.log(
      '[WebSocket] Request headers:',
      Object.fromEntries(
        Object.entries(c.req.raw.headers).map(([key, value]) => [key, value])
      )
    );

    const upgradeHeader = c.req.header('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      console.log(
        '[WebSocket] Missing or invalid Upgrade header:',
        upgradeHeader
      );
      return c.json({ error: 'Expected Upgrade: websocket' }, 426);
    }

    console.log('[WebSocket] New connection request');

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();
    console.log('[WebSocket] Connection accepted');

    // Add ping/pong to keep connection alive
    const pingInterval = setInterval(() => {
      if (server.readyState === WebSocket.OPEN) {
        server.send(JSON.stringify({ type: 'ping' }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);

    server.addEventListener('message', async (event) => {
      try {
        const data =
          typeof event.data === 'string'
            ? event.data
            : new TextDecoder().decode(event.data);
        const message = JSON.parse(data);
        console.log('[WebSocket] Received message:', message);

        // Handle ping/pong
        if (message.type === 'ping') {
          server.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (message.type === 'pong') {
          console.log('[WebSocket] Received pong');
          return;
        }

        if (message.type === 'subscribe' && message.room) {
          const room = message.room;
          console.log('[WebSocket] Subscribe request for room:', room);

          if (wsService.addToRoom(room, server)) {
            server.send(
              JSON.stringify({
                type: 'subscribed',
                room,
              })
            );
            console.log('[WebSocket] Subscription confirmed for room:', room);
          }
        }

        if (message.type === 'unsubscribe' && message.room) {
          const room = message.room;
          console.log('[WebSocket] Unsubscribe request for room:', room);

          if (wsService.removeFromRoom(room, server)) {
            server.send(
              JSON.stringify({
                type: 'unsubscribed',
                room,
              })
            );
            console.log('[WebSocket] Unsubscription confirmed for room:', room);
          }
        }
      } catch (error) {
        console.error('[WebSocket] Error handling message:', error);
      }
    });

    server.addEventListener('close', () => {
      console.log('[WebSocket] Connection closed');
      clearInterval(pingInterval);
      const rooms = wsService.getAllRooms();
      for (const room of rooms) {
        wsService.removeFromRoom(room, server);
      }
    });

    server.addEventListener('error', (error) => {
      console.error('[WebSocket] Error:', error);
      clearInterval(pingInterval);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: {
        Upgrade: 'websocket',
        Connection: 'Upgrade',
      },
    });
  } catch (error) {
    console.error('[WebSocket] Error establishing connection:', error);
    return c.json({ error: 'Failed to establish WebSocket connection' }, 500);
  }
});

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

    // Track event asynchronously using waitUntil
    c.executionCtx.waitUntil(
      trackEvent(c, result.id, 'REDIRECT', 'url_redirect', {
        shortId,
        originalUrl: result.original_url,
      })
    );

    // Update visit count asynchronously
    c.executionCtx.waitUntil(
      c.env.DB.prepare(
        'UPDATE urls SET visit_count = visit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
        .bind(result.id)
        .run()
    );

    // Redirect to original URL immediately
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
