import { zValidator } from '@hono/zod-validator';
import { Context, Hono } from 'hono';
import { z } from 'zod';
import { auth } from '../auth/middleware';
import { IUser } from '../auth/types';
import { createDb } from '../db/client';
import { WebSocketService } from '../websocket/service';
import { AnalyticsService } from './service';
import { DatabaseTableError, UrlNotFoundError } from './service';
import { TimeRange } from './types';
const timeRangeSchema = z.enum(['24h', '7d', '30d', '90d']);

interface Variables {
  user?: IUser;
}

interface Env {
  DB: D1Database;
}

type HandlerContext = Context<{ Bindings: Env; Variables: Variables }>;

export const createAnalyticsRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();
  const wsService = new WebSocketService();

  const trackEventSchema = z.object({
    urlId: z.number(),
    userId: z.number().optional(),
    eventType: z.string(),
    eventName: z.string(),
    properties: z.record(z.unknown()).optional(),
    deviceInfo: z
      .object({
        userAgent: z.string(),
        ip: z.string(),
        device: z.string(),
        browser: z.string(),
        os: z.string(),
      })
      .optional(),
    geoInfo: z
      .object({
        country: z.string(),
        city: z.string(),
        region: z.string(),
        timezone: z.string(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
      .optional(),
    referrer: z.string().optional(),
  });

  const createCustomEventSchema = z.object({
    userId: z.number(),
    name: z.string(),
    description: z.string().optional(),
    properties: z.array(z.string()),
  });

  type TrackEventInput = z.infer<typeof trackEventSchema>;
  type CreateCustomEventInput = z.infer<typeof createCustomEventSchema>;

  router.post('/events', async (c: HandlerContext) => {
    const db = createDb(c.env.DB);
    const analyticsService = new AnalyticsService({
      database: db,
      wsService,
    });

    const result = await trackEventSchema.safeParseAsync(await c.req.json());

    if (!result.success) {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    await analyticsService.trackEvent(result.data);
    return c.json({ success: true });
  });

  router.post('/custom-events', async (c: HandlerContext) => {
    const db = createDb(c.env.DB);
    const analyticsService = new AnalyticsService({
      database: db,
      wsService,
    });

    const result = await createCustomEventSchema.safeParseAsync(
      await c.req.json()
    );

    if (!result.success) {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    await analyticsService.createCustomEvent(result.data);
    return c.json({ success: true });
  });

  router.get('/events/:urlId', async (c) => {
    const db = createDb(c.env.DB);
    const analyticsService = new AnalyticsService({
      database: db,
      wsService,
    });
    const urlId = Number(c.req.param('urlId'));

    const events = await analyticsService.getEvents(urlId);
    return c.json(events);
  });

  router.get('/custom-events/:userId', async (c) => {
    const db = createDb(c.env.DB);
    const analyticsService = new AnalyticsService({
      database: db,
      wsService,
    });
    const userId = Number(c.req.param('userId'));

    const events = await analyticsService.getCustomEvents(userId);
    return c.json(events);
  });

  // URL Stats endpoint
  router.get('/urls/:shortId/stats', async (c) => {
    const db = createDb(c.env.DB);
    const analyticsService = new AnalyticsService({
      database: db,
      wsService,
    });

    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    try {
      const stats = await analyticsService.getUrlStats(
        shortId,
        timeRange as TimeRange
      );
      return c.json(stats);
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof DatabaseTableError) {
        return c.json({ error: error.message }, 503);
      }
      console.error('Error getting URL stats:', error);
      return c.json({ error: 'Failed to get URL stats' }, 500);
    }
  });

  // Event Analytics endpoints
  router.get('/urls/:shortId/events', async (c) => {
    const db = createDb(c.env.DB);
    const analyticsService = new AnalyticsService({
      database: db,
      wsService,
    });
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';
    const eventType = c.req.query('eventType');

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    try {
      const events = await analyticsService.getUrlEvents(
        shortId,
        timeRange as TimeRange,
        eventType || undefined
      );
      return c.json(events);
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof DatabaseTableError) {
        return c.json({ error: error.message }, 503);
      }
      console.error('Error getting URL events:', error);
      return c.json({ error: 'Failed to get URL events' }, 500);
    }
  });

  // Geographic Analytics
  router.get('/urls/:shortId/geo', async (c) => {
    const db = createDb(c.env.DB);
    const analyticsService = new AnalyticsService({
      database: db,
      wsService,
    });

    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    try {
      const geoStats = await analyticsService.getGeoStats(
        shortId,
        timeRange as TimeRange
      );
      return c.json(geoStats);
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof DatabaseTableError) {
        return c.json({ error: error.message }, 503);
      }
      console.error('Error getting geo stats:', error);
      return c.json({ error: 'Failed to get geo stats' }, 500);
    }
  });

  // Device Analytics
  router.get('/urls/:shortId/devices', async (c) => {
    const db = createDb(c.env.DB);
    const analyticsService = new AnalyticsService({
      database: db,
      wsService,
    });
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    try {
      const deviceStats = await analyticsService.getDeviceStats(
        shortId,
        timeRange as TimeRange
      );
      return c.json(deviceStats);
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof DatabaseTableError) {
        return c.json({ error: error.message }, 503);
      }
      console.error('Error getting device stats:', error);
      return c.json({ error: 'Failed to get device stats' }, 500);
    }
  });

  // UTM Analytics
  router.get('/urls/:shortId/utm', async (c) => {
    const db = createDb(c.env.DB);
    const analyticsService = new AnalyticsService({
      database: db,
      wsService,
    });
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    try {
      const utmStats = await analyticsService.getUtmStats(
        shortId,
        timeRange as TimeRange
      );
      return c.json(utmStats);
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof DatabaseTableError) {
        return c.json({ error: error.message }, 503);
      }
      console.error('Error getting UTM stats:', error);
      return c.json({ error: 'Failed to get UTM stats' }, 500);
    }
  });

  // Click History
  router.get('/urls/:shortId/clicks', async (c) => {
    const db = createDb(c.env.DB);
    const analyticsService = new AnalyticsService({
      database: db,
      wsService,
    });
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    try {
      const clickHistory = await analyticsService.getClickHistory(
        shortId,
        timeRange as TimeRange
      );
      return c.json(clickHistory);
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof DatabaseTableError) {
        return c.json({ error: error.message }, 503);
      }
      console.error('Error getting click history:', error);
      return c.json({ error: 'Failed to get click history' }, 500);
    }
  });

  // User Analytics -> Dashboard
  router.get('/user/analytics', auth(), async (c) => {
    const db = createDb(c.env.DB);
    const analyticsService = new AnalyticsService({
      database: db,
      wsService,
    });
    const timeRange = c.req.query('timeRange') || '7d';
    const user = c.get('user') as IUser;

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    const analytics = await analyticsService.getUserAnalytics(
      user.id,
      timeRange as TimeRange
    );
    return c.json(analytics);
  });

  return router;
};
