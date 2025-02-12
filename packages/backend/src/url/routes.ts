import { Context, Hono } from 'hono';
import { z } from 'zod';
import { auth } from '../auth/middleware.js';
import { IUser } from '../auth/types.js';
import { getVisitsByTimeRange } from './service';
import { UrlService } from './service.js';

// Rate limit constants
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS = 50; // Maximum requests per window

interface RateLimitInfo {
  count: number;
  timestamp: number;
}

const rateLimitStore = new Map<string, RateLimitInfo>();

const rateLimit = () => {
  return async (c: Context, next: () => Promise<void>) => {
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      '0.0.0.0';

    const now = Date.now();
    const limitInfo = rateLimitStore.get(ip) || { count: 0, timestamp: now };

    // Reset count if window has passed
    if (now - limitInfo.timestamp > RATE_LIMIT_WINDOW) {
      limitInfo.count = 0;
      limitInfo.timestamp = now;
    }

    if (limitInfo.count >= MAX_REQUESTS) {
      return c.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(
            (limitInfo.timestamp + RATE_LIMIT_WINDOW - now) / 1000
          ),
        },
        429
      );
    }

    limitInfo.count++;
    rateLimitStore.set(ip, limitInfo);

    await next();
  };
};

interface Env {
  DB: D1Database;
  BASE_URL: string;
  RESEND_API_KEY: string;
  FRONTEND_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

interface Variables {
  user: IUser;
}

const createUrlSchema = z.object({
  url: z.string().url(),
  customSlug: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

type H = { Bindings: Env; Variables: Variables };

const VALID_PERIODS = ['24h', '7d', '30d', '90d'] as const;
type Period = (typeof VALID_PERIODS)[number];

export const createUrlRoutes = () => {
  const router = new Hono<H>();

  // This endpoint is used by authenticated users to create a short URL
  router.post('/shorten', auth(), async (c: Context) => {
    try {
      const body = await c.req.json();
      const { url, customSlug, expiresAt } = createUrlSchema.parse(body);
      const token = c.req.header('Authorization')?.split(' ')[1];
      const user = c.get('user');
      const db = c.get('db');

      const urlService = new UrlService(c.env.BASE_URL, db);
      const result = await urlService.createShortUrl(
        url,
        { customSlug, expiresAt },
        token,
        user.id.toString()
      );

      return c.json(
        {
          shortUrl: result.shortUrl,
          shortId: result.shortId,
          originalUrl: result.originalUrl,
          createdAt: result.createdAt,
          userId: result.userId,
        },
        200
      );
    } catch (error) {
      console.error('Error creating short URL:', error);

      if (error instanceof z.ZodError) {
        return c.json(
          { error: 'Invalid request body', details: error.errors },
          400
        );
      }

      if (error instanceof Error) {
        if (
          error.message === 'Custom slug already exists' ||
          error.message.includes('URL already exists')
        ) {
          return c.json({ error: 'Custom slug already exists' }, 409);
        }
      }
      return c.json({ error: 'Failed to create short URL' }, 500);
    }
  });

  // This endpoint is used by any user to create a short URL, not just authenticated users
  router.post('/chop', rateLimit(), async (c: Context) => {
    try {
      const body = await c.req.json();
      const { url, customSlug } = createUrlSchema.parse(body);
      const db = c.get('db');

      const urlService = new UrlService(c.env.BASE_URL, db);
      const result = await urlService.createShortUrl(url, { customSlug });

      return c.json(
        {
          shortUrl: result.shortUrl,
          shortId: result.shortId,
          expiresAt: result.expiresAt,
        },
        200
      );
    } catch (error) {
      console.error('Error creating short URL:', error);

      if (error instanceof z.ZodError) {
        return c.json(
          { error: 'Invalid request body', details: error.errors },
          400
        );
      }

      if (error instanceof Error) {
        if (
          error.message === 'Custom slug already exists' ||
          error.message.includes('URL already exists')
        ) {
          return c.json({ error: 'Custom slug already exists' }, 409);
        }
      }
      return c.json({ error: 'Failed to create short URL' }, 500);
    }
  });

  router.get('/urls', auth(), async (c: Context) => {
    const user = c.get('user');
    const db = c.get('db');
    const urlService = new UrlService(c.env.BASE_URL, db);
    const urls = await urlService.getUserUrls(user.id.toString());
    return c.json(urls);
  });

  router.get('/stats/:shortId', auth(), async (c: Context) => {
    const shortId = c.req.param('shortId');
    const period = (c.req.query('period') as Period) || '7d';
    const db = c.get('db');

    if (!VALID_PERIODS.includes(period)) {
      return c.json({ error: 'Invalid period' }, 400);
    }

    try {
      const urlService = new UrlService(c.env.BASE_URL, db);
      const stats = await urlService.getUrlStats(shortId, period);
      if (!stats) {
        return c.json({ error: 'URL not found' }, 404);
      }
      return c.json(stats);
    } catch (error) {
      return c.json({ error: 'URL not found' }, 404);
    }
  });

  router.get('/stats/:shortId/visits', auth(), async (c: Context) => {
    const shortId = c.req.param('shortId');
    const period = (c.req.query('period') as Period) || '7d';
    const db = c.get('db');

    if (!VALID_PERIODS.includes(period)) {
      return c.json({ error: 'Invalid period' }, 400);
    }

    try {
      const visits = await getVisitsByTimeRange(db, shortId, period);
      return c.json(visits);
    } catch (error) {
      return c.json({ error: 'URL not found' }, 404);
    }
  });

  router.get('/analytics', auth(), async (c: Context) => {
    const period = (c.req.query('period') as Period) || '7d';
    const db = c.get('db');
    const user = c.get('user') as IUser;

    if (!VALID_PERIODS.includes(period)) {
      return c.json({ error: 'Invalid period' }, 400);
    }

    try {
      const urlService = new UrlService(c.env.BASE_URL, db);
      const analytics = await urlService.getUserAnalytics(
        user.id.toString(),
        period
      );
      return c.json(analytics);
    } catch (error) {
      return c.json({ error: 'Failed to get analytics' }, 500);
    }
  });

  return router;
};
