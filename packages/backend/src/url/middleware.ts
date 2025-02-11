import { eq } from 'drizzle-orm';
import { Context, Next } from 'hono';
import { db } from '../db/client';
import { urls } from '../db/schema/urls';
import { trackVisit } from './service';

interface Env {
  DB: D1Database;
  BASE_URL: string;
  FRONTEND_URL: string;
}

interface CFContext extends Context<{ Bindings: Env }> {
  req: {
    cf?: {
      country?: string;
      city?: string;
    };
  } & Context<{ Bindings: Env }>['req'];
}

export async function trackVisitMiddleware(c: CFContext, next: Next) {
  try {
    console.log('CF Object:', c.req.cf);

    const shortId = c.req.param('shortId');
    const url = await db.select().from(urls).where(eq(urls.shortId, shortId));

    if (!url || url.length === 0) {
      return c.json({ error: 'URL not found' }, 404);
    }

    const ipAddress =
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    const referrer = c.req.header('referer') || null;

    console.log('Request Headers:', {
      ip: ipAddress,
      userAgent,
      referrer,
      cf: c.req.cf,
    });

    await trackVisit(db, url[0].id, ipAddress, userAgent, referrer, c.req.cf);
    await next();
  } catch (error) {
    console.error('Error in trackVisitMiddleware:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}
