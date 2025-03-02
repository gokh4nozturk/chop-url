import { Context, Hono } from 'hono';
import { z } from 'zod';
import { auth } from '../auth/middleware.js';
import { IUser } from '../auth/types.js';
import { withOpenAPI } from '../utils/openapi';
import { getVisitsByTimeRange } from './service';
import { UrlService } from './service.js';
import { H } from './types';

// Rate limit constants
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS = 50; // Maximum requests per window

interface RateLimitInfo {
  count: number;
  timestamp: number;
}

const rateLimitStore = new Map<string, RateLimitInfo>();

const rateLimitHandler = () => {
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

const VALID_PERIODS = ['24h', '7d', '30d', '90d'] as const;

const createUrlSchema = z.object({
  url: z.string().url(),
  customSlug: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  groupId: z.number().optional(),
});

const createUrlGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateUrlGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const updateUrlSchema = z.object({
  originalUrl: z.string().url().optional(),
  customSlug: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  groupId: z.number().optional(),
  isActive: z.boolean().optional(),
});

type Period = (typeof VALID_PERIODS)[number];

const createBaseUrlRoutes = () => {
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
  router.post('/chop', rateLimitHandler(), async (c: Context) => {
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

  router.patch('/urls/:shortId', auth(), async (c: Context) => {
    try {
      const shortId = c.req.param('shortId');
      const user = c.get('user');
      const db = c.get('db');
      const urlService = new UrlService(c.env.BASE_URL, db);
      const body = await c.req.json();
      const data = updateUrlSchema.parse(body);
      const url = await urlService.updateUrl(shortId, user.id.toString(), data);

      return c.json(url, 200);
    } catch (error) {
      if (error instanceof Error && error.message === 'URL not found') {
        return c.json({ error: 'URL not found' }, 404);
      }
      return c.json({ error: 'Failed to update URL' }, 500);
    }
  });

  router.delete('/urls/:shortId', auth(), async (c: Context) => {
    try {
      const shortId = c.req.param('shortId');
      const user = c.get('user');
      const db = c.get('db');

      const urlService = new UrlService(c.env.BASE_URL, db);
      await urlService.deleteUrl(shortId, user.id.toString());

      return c.json({ message: 'URL deleted successfully' }, 200);
    } catch (error) {
      if (error instanceof Error && error.message === 'URL not found') {
        return c.json({ error: 'URL not found' }, 404);
      }
      return c.json({ error: 'Failed to delete URL' }, 500);
    }
  });

  router.get('/urls/:shortId', auth(), async (c: Context) => {
    try {
      const shortId = c.req.param('shortId');
      const db = c.get('db');
      const urlService = new UrlService(c.env.BASE_URL, db);
      const url = await urlService.getUrl(shortId);
      return c.json(url);
    } catch (error) {
      return c.json({ error: 'URL not found' }, 404);
    }
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

  router.get('/analytics/export', auth(), async (c: Context) => {
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

      // Convert analytics data to CSV format
      const csvRows = [
        // Headers
        ['Date', 'Total Clicks', 'Unique Visitors'].join(','),
        // Data rows
        ...analytics.clicksByDate.map(
          (item) => `${item.date},${item.count},${analytics.uniqueVisitors}`
        ),
        '', // Empty line
        ['Top Countries'].join(','),
        ['Country', 'Visits'].join(','),
        ...analytics.countries.map((item) => `${item.name},${item.count}`),
        '', // Empty line
        ['Top Referrers'].join(','),
        ['Referrer', 'Visits'].join(','),
        ...analytics.referrers.map((item) => `${item.name},${item.count}`),
        '', // Empty line
        ['Device Types'].join(','),
        ['Device', 'Visits'].join(','),
        ...analytics.devices.map((item) => `${item.name},${item.count}`),
        '', // Empty line
        ['Browsers'].join(','),
        ['Browser', 'Visits'].join(','),
        ...analytics.browsers.map((item) => `${item.name},${item.count}`),
        '', // Empty line
        ['Operating Systems'].join(','),
        ['OS', 'Visits'].join(','),
        ...analytics.operatingSystems.map(
          (item) => `${item.name},${item.count}`
        ),
      ].join('\n');

      // Set response headers for CSV download
      c.header('Content-Type', 'text/csv');
      c.header(
        'Content-Disposition',
        `attachment; filename="analytics-${period}-${new Date().toISOString()}.csv"`
      );

      return c.text(csvRows);
    } catch (error) {
      return c.json({ error: 'Failed to export analytics' }, 500);
    }
  });

  // URL Group endpoints
  router.post('/url-groups', auth(), async (c: Context) => {
    try {
      const body = await c.req.json();
      const { name, description } = createUrlGroupSchema.parse(body);
      const user = c.get('user');
      const db = c.get('db');

      const urlService = new UrlService(c.env.BASE_URL, db);
      const group = await urlService.createUrlGroup(
        name,
        description || null,
        user.id
      );

      return c.json(group, 200);
    } catch (error) {
      console.error('Error creating URL group:', error);

      if (error instanceof z.ZodError) {
        return c.json(
          { error: 'Invalid request body', details: error.errors },
          400
        );
      }

      return c.json({ error: 'Failed to create URL group' }, 500);
    }
  });

  router.put('/url-groups/:id', auth(), async (c: Context) => {
    try {
      const groupId = parseInt(c.req.param('id'));
      const body = await c.req.json();
      const data = updateUrlGroupSchema.parse(body);
      const user = c.get('user');
      const db = c.get('db');

      const urlService = new UrlService(c.env.BASE_URL, db);
      const group = await urlService.updateUrlGroup(groupId, user.id, data);

      return c.json(group, 200);
    } catch (error) {
      console.error('Error updating URL group:', error);

      if (error instanceof z.ZodError) {
        return c.json(
          { error: 'Invalid request body', details: error.errors },
          400
        );
      }

      if (error instanceof Error && error.message === 'URL group not found') {
        return c.json({ error: 'URL group not found' }, 404);
      }

      return c.json({ error: 'Failed to update URL group' }, 500);
    }
  });

  router.delete('/url-groups/:id', auth(), async (c: Context) => {
    try {
      const groupId = parseInt(c.req.param('id'));
      const user = c.get('user');
      const db = c.get('db');

      const urlService = new UrlService(c.env.BASE_URL, db);
      await urlService.deleteUrlGroup(groupId, user.id);

      return c.json({ message: 'URL group deleted successfully' }, 200);
    } catch (error) {
      console.error('Error deleting URL group:', error);

      if (error instanceof Error && error.message === 'URL group not found') {
        return c.json({ error: 'URL group not found' }, 404);
      }

      return c.json({ error: 'Failed to delete URL group' }, 500);
    }
  });

  router.get('/url-groups', auth(), async (c: Context) => {
    try {
      const user = c.get('user');
      const db = c.get('db');

      const urlService = new UrlService(c.env.BASE_URL, db);
      const groups = await urlService.getUserUrlGroups(user.id);

      return c.json(groups, 200);
    } catch (error) {
      console.error('Error fetching URL groups:', error);
      return c.json({ error: 'Failed to fetch URL groups' }, 500);
    }
  });

  return router;
};

// Wrap with OpenAPI documentation
export const createUrlRoutes = withOpenAPI(createBaseUrlRoutes, '/api');
