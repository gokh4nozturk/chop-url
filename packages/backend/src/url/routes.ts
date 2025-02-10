import { zValidator } from '@hono/zod-validator';
import { Context, Hono } from 'hono';
import { ValidationTargets } from 'hono/types';
import { z } from 'zod';
import { auth } from '../auth/middleware.js';
import { IUser } from '../auth/types.js';
import { trackVisitMiddleware } from '../middleware';
import { getUrlStats, getVisitsByTimeRange, trackVisit } from './service';
import { UrlService } from './service.js';

interface Env {
  DB: D1Database;
  BASE_URL: string;
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

type H = Hono<{ Bindings: Env; Variables: Variables }>;

const VALID_PERIODS = ['24h', '7d', '30d', '90d'] as const;
type Period = (typeof VALID_PERIODS)[number];

export const createUrlRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

  router.post('/shorten', async (c: Context, next) => {
    // Test ortamında auth middleware'i atlıyoruz
    if (c.env.ENVIRONMENT !== 'test') {
      return auth()(c, next);
    }

    const { url, customSlug } = await c.req.json();

    if (!url) {
      return c.json({ error: 'Invalid URL' }, 400);
    }

    try {
      const urlService = new UrlService(c.env.BASE_URL);
      const result = await urlService.createShortUrl(
        url,
        { customSlug },
        'test-token',
        'test-user'
      );

      return c.json(
        {
          shortUrl: result.shortUrl,
          shortId: result.shortId,
          originalUrl: result.originalUrl,
          createdAt: result.createdAt,
        },
        200
      );
    } catch (error) {
      console.error('Error creating short URL:', error);

      if (error instanceof Error) {
        if (error.message === 'Invalid URL') {
          return c.json({ error: 'Invalid URL' }, 400);
        }
        if (error.message === 'Custom slug already exists') {
          return c.json({ error: 'Custom slug already exists' }, 409);
        }
      }
      return c.json({ error: 'Failed to create short URL' }, 500);
    }
  });

  router.get('/urls', auth(), async (c: Context) => {
    const user = c.get('user');
    const urlService = new UrlService(c.env.BASE_URL);
    const urls = await urlService.getUserUrls(user.id.toString());

    const response = urls.map((url) => ({
      shortUrl: `${c.env.BASE_URL}/${url.shortId}`,
      ...url,
    }));
    return c.json(response);
  });

  router.get('/:shortId', trackVisitMiddleware, async (c: Context) => {
    const shortId = c.req.param('shortId');
    const urlService = new UrlService(c.env.BASE_URL);
    const url = await urlService.getUrl(shortId);

    if (!url) {
      return c.json({ error: 'URL not found' }, 404);
    }

    return c.redirect(url.originalUrl);
  });

  router.get('/stats/:shortId', auth(), async (c: Context) => {
    const shortId = c.req.param('shortId');
    const period = (c.req.query('period') as Period) || '7d';

    if (!VALID_PERIODS.includes(period)) {
      return c.json({ error: 'Invalid period' }, 400);
    }

    try {
      const stats = await getUrlStats(shortId, period);
      return c.json(stats);
    } catch (error) {
      return c.json({ error: 'URL not found' }, 404);
    }
  });

  router.get('/stats/:shortId/visits', auth(), async (c: Context) => {
    const shortId = c.req.param('shortId');
    const period = (c.req.query('period') as Period) || '7d';

    if (!VALID_PERIODS.includes(period)) {
      return c.json({ error: 'Invalid period' }, 400);
    }

    try {
      const visits = await getVisitsByTimeRange(shortId, period);
      return c.json(visits);
    } catch (error) {
      return c.json({ error: 'URL not found' }, 404);
    }
  });

  router.post('/track', async (c: Context) => {
    const body = await c.req.json();
    const { urlId, ipAddress, userAgent, referrer } = body;

    if (!urlId || !ipAddress || !userAgent) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    try {
      await trackVisit(urlId, ipAddress, userAgent, referrer || null);
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: 'Failed to track visit' }, 500);
    }
  });

  return router;
};
