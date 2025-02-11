import { Context, Hono } from 'hono';
import { ValidationTargets } from 'hono/types';
import { z } from 'zod';
import { auth } from '../auth/middleware.js';
import { AuthService } from '../auth/service.js';
import { IUser } from '../auth/types.js';
import { createDb } from '../db/client';
import { IUrl } from './index.js';
import { trackVisitMiddleware } from './middleware.js';
import {
  getUrlStats,
  getUserAnalytics,
  getVisitsByTimeRange,
  trackVisit,
} from './service';
import { UrlService } from './service.js';

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

type ValidatedContext = Context<{
  Bindings: Env;
  Variables: Variables;
  ValidationTargets: ValidationTargets;
  ValidatedData: {
    query: { period?: '24h' | '7d' | '30d' | '90d' };
    json: z.infer<typeof trackVisitSchema>;
  };
}>;

const periodSchema = z.enum(['24h', '7d', '30d', '90d']).default('7d');

const trackVisitSchema = z.object({
  urlId: z.number(),
  ipAddress: z.string(),
  userAgent: z.string(),
  referrer: z.string().nullable().optional(),
});

const createUrlSchema = z.object({
  url: z.string().url(),
  customSlug: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

type H = Hono<{ Bindings: Env; Variables: Variables }>;

const VALID_PERIODS = ['24h', '7d', '30d', '90d'] as const;
type Period = (typeof VALID_PERIODS)[number];

export const createUrlRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

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
      const stats = await urlService.getUrlStats(shortId);
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

  router.post('/track', async (c: Context) => {
    const body = await c.req.json();
    const { urlId, ipAddress, userAgent, referrer } = body;
    const db = createDb(c.env.DB);

    if (!urlId || !ipAddress || !userAgent) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    try {
      await trackVisit(db, urlId, ipAddress, userAgent, referrer || null);
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: 'Failed to track visit' }, 500);
    }
  });

  router.get('/analytics', auth(), async (c: Context) => {
    try {
      console.log('Analytics request received');
      const user = c.get('user');
      const db = createDb(c.env.DB);
      console.log('User:', user);
      const period = (c.req.query('period') as Period) || '7d';
      console.log('Period:', period);

      if (!VALID_PERIODS.includes(period)) {
        console.log('Invalid period:', period);
        return c.json({ error: 'Invalid period' }, 400);
      }

      try {
        console.log('Fetching analytics for user:', user.id);
        const analytics = await getUserAnalytics(
          db,
          user.id.toString(),
          period
        );
        console.log('Analytics result:', analytics);
        if (!analytics) {
          console.log('No data found');
          return c.json({ error: 'No data found' }, 404);
        }
        return c.json(analytics);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        return c.json({ error: 'Failed to fetch analytics' }, 500);
      }
    } catch (error) {
      console.error('Error in analytics route:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  router.get('/:shortId', trackVisitMiddleware, async (c: Context) => {
    const shortId = c.req.param('shortId');
    const db = createDb(c.env.DB);
    const urlService = new UrlService(c.env.BASE_URL, db);
    const url = await urlService.getUrl(shortId);

    if (!url) {
      return c.json({ error: 'URL not found' }, 404);
    }

    return c.redirect(url.originalUrl);
  });

  return router;
};
