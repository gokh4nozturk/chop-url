import { eq } from 'drizzle-orm';
import { Context, Next } from 'hono';
import { db } from '../db/client';
import { urls } from '../db/schema/urls';
import { trackVisit } from './service';

export async function trackVisitMiddleware(c: Context, next: Next) {
  const shortId = c.req.param('shortId');
  const url = await db.select().from(urls).where(eq(urls.shortId, shortId));

  if (url) {
    const ipAddress =
      c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    const referrer = c.req.header('referer') || null;

    await trackVisit(url[0].id, ipAddress, userAgent, referrer);
  }

  await next();
}
