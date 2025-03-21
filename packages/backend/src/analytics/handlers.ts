import { Context } from 'hono';
import { createDb } from '../db/client';
import { WebSocketService } from '../websocket/service';
import { analyticsSchemas } from './schemas';
import { AnalyticsService } from './service';
import { DatabaseTableError, UrlNotFoundError } from './service';
import { TimeRange } from './types';

// Create analytics service instance
const createAnalyticsService = (c: Context) => {
  const db = createDb(c.env.DB);
  const wsService = new WebSocketService();
  return new AnalyticsService({
    database: db,
    wsService,
  });
};

// Event handlers
export const analyticsHandlers = {
  // Event tracking
  trackEvent: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const result = await c.req.json();

    // Validation is handled by zValidator middleware
    await analyticsService.trackEvent(result);
    return c.json({ success: true });
  },

  createCustomEvent: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const result = await c.req.json();

    // Validation is handled by zValidator middleware
    await analyticsService.createCustomEvent(result);
    return c.json({ success: true });
  },

  getEvents: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const urlId = Number(c.req.param('urlId'));

    const events = await analyticsService.getEvents(urlId);
    return c.json(events);
  },

  getCustomEvents: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const user = c.get('user');
    const userId = user.id;

    const events = await analyticsService.getCustomEvents(userId);
    return c.json(events);
  },

  // URL analytics
  getUrlStats: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    try {
      if (!analyticsSchemas.timeRange.safeParse(timeRange).success) {
        return c.json({ error: 'Invalid time range' }, 400);
      }

      const stats = await analyticsService.getUrlStats(
        shortId,
        timeRange as TimeRange
      );
      return c.json(stats);
    } catch (error) {
      return handleAnalyticsError(c, error, 'Failed to get URL stats');
    }
  },

  getUrlEvents: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';
    const eventType = c.req.query('eventType');

    try {
      if (!analyticsSchemas.timeRange.safeParse(timeRange).success) {
        return c.json({ error: 'Invalid time range' }, 400);
      }

      const events = await analyticsService.getUrlEvents(
        shortId,
        timeRange as TimeRange,
        eventType || undefined
      );
      return c.json(events);
    } catch (error) {
      return handleAnalyticsError(c, error, 'Failed to get URL events');
    }
  },

  // Detailed analytics
  getGeoStats: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    try {
      if (!analyticsSchemas.timeRange.safeParse(timeRange).success) {
        return c.json({ error: 'Invalid time range' }, 400);
      }

      const geoStats = await analyticsService.getGeoStats(
        shortId,
        timeRange as TimeRange
      );
      return c.json(geoStats);
    } catch (error) {
      return handleAnalyticsError(c, error, 'Failed to get geo stats');
    }
  },

  getDeviceStats: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    try {
      if (!analyticsSchemas.timeRange.safeParse(timeRange).success) {
        return c.json({ error: 'Invalid time range' }, 400);
      }

      const deviceStats = await analyticsService.getDeviceStats(
        shortId,
        timeRange as TimeRange
      );
      return c.json(deviceStats);
    } catch (error) {
      return handleAnalyticsError(c, error, 'Failed to get device stats');
    }
  },

  getUtmStats: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    try {
      if (!analyticsSchemas.timeRange.safeParse(timeRange).success) {
        return c.json({ error: 'Invalid time range' }, 400);
      }

      const utmStats = await analyticsService.getUtmStats(
        shortId,
        timeRange as TimeRange
      );
      return c.json(utmStats);
    } catch (error) {
      return handleAnalyticsError(c, error, 'Failed to get UTM stats');
    }
  },

  getClickHistory: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const shortId = c.req.param('shortId');
    const timeRange = c.req.query('timeRange') || '7d';

    try {
      if (!analyticsSchemas.timeRange.safeParse(timeRange).success) {
        return c.json({ error: 'Invalid time range' }, 400);
      }

      const clickHistory = await analyticsService.getClickHistory(
        shortId,
        timeRange as TimeRange
      );
      return c.json(clickHistory);
    } catch (error) {
      return handleAnalyticsError(c, error, 'Failed to get click history');
    }
  },

  // User analytics
  getUserAnalytics: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const user = c.get('user');
    const userId = user.id;
    const timeRange = c.req.query('timeRange') || '7d';

    try {
      if (!analyticsSchemas.timeRange.safeParse(timeRange).success) {
        return c.json({ error: 'Invalid time range' }, 400);
      }

      const userAnalytics = await analyticsService.getUserAnalytics(
        userId,
        timeRange as TimeRange
      );
      return c.json(userAnalytics);
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return c.json({ error: 'Failed to get user analytics' }, 500);
    }
  },

  // Consolidated URL analytics endpoints
  getUrlStatsById: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const id = c.req.param('id');
    const timeRange = c.req.query('period') || '24h';

    try {
      if (!analyticsSchemas.timeRange.safeParse(timeRange).success) {
        return c.json({ error: 'Invalid time range' }, 400);
      }

      const stats = await analyticsService.getUrlStats(
        id,
        timeRange as TimeRange
      );
      return c.json(stats);
    } catch (error) {
      return handleAnalyticsError(c, error, 'Failed to get URL stats by ID');
    }
  },

  exportUrlAnalytics: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const user = c.get('user');
    const userId = user.id;
    const timeRange = c.req.query('period') || '7d';

    try {
      if (!analyticsSchemas.timeRange.safeParse(timeRange).success) {
        return c.json({ error: 'Invalid time range' }, 400);
      }

      const analytics = await analyticsService.getUserAnalytics(
        userId,
        timeRange as TimeRange
      );
      return c.json(analytics);
    } catch (error) {
      return handleAnalyticsError(c, error, 'Failed to export URL analytics');
    }
  },
};

// Helper function for error handling
const handleAnalyticsError = (
  c: Context,
  error: unknown,
  defaultMessage: string
) => {
  if (error instanceof UrlNotFoundError) {
    return c.json({ error: error.message }, 404);
  }
  if (error instanceof DatabaseTableError) {
    return c.json({ error: error.message }, 503);
  }
  console.error(`${defaultMessage}:`, error);
  return c.json({ error: defaultMessage }, 500);
};
