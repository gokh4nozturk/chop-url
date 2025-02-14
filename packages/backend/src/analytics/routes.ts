import { zValidator } from '@hono/zod-validator';
import { Context, Hono } from 'hono';
import { z } from 'zod';
import { auth } from '../auth/middleware';
import { IUser } from '../auth/types';
import { createDb } from '../db/client';
import { AnalyticsService } from './service';
const timeRangeSchema = z.enum(['24h', '7d', '30d', '90d']);
type TimeRange = z.infer<typeof timeRangeSchema>;

interface Env {
  DB: D1Database;
}

type Variables = {
  db: ReturnType<typeof createDb>;
  user: IUser;
};

type HandlerContext = Context<{
  Bindings: Env;
  Variables: Variables;
}>;

export const createAnalyticsRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

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
    const analyticsService = new AnalyticsService({ database: c.get('db') });
    const result = await trackEventSchema.safeParseAsync(await c.req.json());

    if (!result.success) {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    await analyticsService.trackEvent(result.data);
    return c.json({ success: true });
  });

  router.post('/custom-events', async (c: HandlerContext) => {
    const analyticsService = new AnalyticsService({ database: c.get('db') });
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
    const analyticsService = new AnalyticsService({ database: c.get('db') });
    const urlId = Number(c.req.param('urlId'));

    const events = await analyticsService.getEvents(urlId);
    return c.json(events);
  });

  router.get('/custom-events/:userId', async (c) => {
    const analyticsService = new AnalyticsService({ database: c.get('db') });
    const userId = Number(c.req.param('userId'));

    const events = await analyticsService.getCustomEvents(userId);
    return c.json(events);
  });

  // URL Stats endpoint
  router.get('/urls/:shortId/stats', async (c) => {
    const analyticsService = new AnalyticsService({ database: c.get('db') });
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    const stats = await analyticsService.getUrlStats(
      shortId,
      timeRange as TimeRange
    );
    return c.json(stats);
  });

  // Event Analytics endpoints
  router.get('/urls/:shortId/events', async (c) => {
    const analyticsService = new AnalyticsService({ database: c.get('db') });
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';
    const eventType = c.req.query('eventType');

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    const events = await analyticsService.getUrlEvents(
      shortId,
      timeRange as TimeRange,
      eventType || undefined
    );
    return c.json(events);
  });

  // Geographic Analytics
  router.get('/urls/:shortId/geo', async (c) => {
    const analyticsService = new AnalyticsService({ database: c.get('db') });
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    const geoStats = await analyticsService.getGeoStats(
      shortId,
      timeRange as TimeRange
    );
    return c.json(geoStats);
  });

  // Device Analytics
  router.get('/urls/:shortId/devices', async (c) => {
    const analyticsService = new AnalyticsService({ database: c.get('db') });
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    const deviceStats = await analyticsService.getDeviceStats(
      shortId,
      timeRange as TimeRange
    );
    return c.json(deviceStats);
  });

  // UTM Analytics
  router.get('/urls/:shortId/utm', async (c) => {
    const analyticsService = new AnalyticsService({ database: c.get('db') });
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    const utmStats = await analyticsService.getUtmStats(
      shortId,
      timeRange as TimeRange
    );
    return c.json(utmStats);
  });

  // Click History
  router.get('/urls/:shortId/clicks', async (c) => {
    const analyticsService = new AnalyticsService({ database: c.get('db') });
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    if (!timeRangeSchema.safeParse(timeRange).success) {
      return c.json({ error: 'Invalid time range' }, 400);
    }

    const clickHistory = await analyticsService.getClickHistory(
      shortId,
      timeRange as TimeRange
    );
    return c.json(clickHistory);
  });

  // User Analytics -> Dashboard
  router.get('/user/analytics', auth(), async (c) => {
    const analyticsService = new AnalyticsService({ database: c.get('db') });
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
