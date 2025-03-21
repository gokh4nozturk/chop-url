import { Context } from 'hono';
import { createDb } from '../db/client';
import { WebSocketService } from '../websocket/service';
import { analyticsSchemas } from './schemas';
import { AnalyticsService } from './service';
import { DatabaseTableError, UrlNotFoundError } from './service';
import { TimeRange } from './types';

// Helper functions for exporting data
const convertToCSV = (data: unknown): string => {
  // If data is an object, wrap it in an array
  const dataArray = Array.isArray(data) ? data : [data];

  if (!dataArray || dataArray.length === 0) {
    return '';
  }

  // For aggregated stats, create a flattened structure
  const flattened = dataArray.map((stat) => {
    const flatItem: Record<string, unknown> = {};

    // Add basic stats
    if ('totalEvents' in stat) flatItem.totalEvents = stat.totalEvents;
    if ('uniqueVisitors' in stat) flatItem.uniqueVisitors = stat.uniqueVisitors;

    // Add countries
    if (stat.geoStats?.countries) {
      for (const [country, count] of Object.entries(stat.geoStats.countries)) {
        flatItem[`country_${country}`] = count;
      }
    } else if (Array.isArray(stat.countries)) {
      for (const country of stat.countries) {
        flatItem[`country_${country.name}`] = country.count;
      }
    }

    // Add cities
    if (stat.geoStats?.cities) {
      for (const [city, count] of Object.entries(stat.geoStats.cities)) {
        flatItem[`city_${city}`] = count;
      }
    } else if (Array.isArray(stat.cities)) {
      for (const city of stat.cities) {
        flatItem[`city_${city.name}`] = city.count;
      }
    }

    // Add device info
    if (stat.deviceStats?.devices) {
      for (const [device, count] of Object.entries(stat.deviceStats.devices)) {
        flatItem[`device_${device}`] = count;
      }
    } else if (Array.isArray(stat.devices)) {
      for (const device of stat.devices) {
        flatItem[`device_${device.name}`] = device.count;
      }
    }

    // Add browser info
    if (stat.deviceStats?.browsers) {
      for (const [browser, count] of Object.entries(
        stat.deviceStats.browsers
      )) {
        flatItem[`browser_${browser}`] = count;
      }
    } else if (Array.isArray(stat.browsers)) {
      for (const browser of stat.browsers) {
        flatItem[`browser_${browser.name}`] = browser.count;
      }
    }

    // Add OS info
    if (stat.deviceStats?.operatingSystems) {
      for (const [os, count] of Object.entries(
        stat.deviceStats.operatingSystems
      )) {
        flatItem[`os_${os}`] = count;
      }
    } else if (Array.isArray(stat.operatingSystems)) {
      for (const os of stat.operatingSystems) {
        flatItem[`os_${os.name}`] = os.count;
      }
    }

    // Add clicks by date
    if (Array.isArray(stat.clicksByDate)) {
      for (const click of stat.clicksByDate) {
        flatItem[`date_${click.name || click.date}`] =
          click.value || click.count;
      }
    }

    return flatItem;
  });

  // Get all headers
  const headers = Array.from(
    new Set(flattened.flatMap((item) => Object.keys(item)))
  );

  // Create CSV content
  const csvRows = [];

  // Add the headers
  csvRows.push(headers.join(','));

  // Add the data
  for (const item of flattened) {
    const values = headers.map((header) => {
      const val = item[header] ?? '';
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

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
    const timeRange = c.req.query('timeRange') || '7d';

    const events = await analyticsService.getEvents(
      urlId,
      timeRange as TimeRange
    );
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

  // Update the exportUrlAnalytics handler
  exportUrlAnalytics: async (c: Context) => {
    const analyticsService = createAnalyticsService(c);
    const user = c.get('user');
    const userId = user.id;
    const timeRange = c.req.query('timeRange') || '7d';
    const format = c.req.query('format') || 'json';

    try {
      if (!analyticsSchemas.timeRange.safeParse(timeRange).success) {
        return c.json({ error: 'Invalid time range' }, 400);
      }

      const analytics = await analyticsService.getUserAnalytics(
        userId,
        timeRange as TimeRange
      );

      const filename = `analytics_export_${
        new Date().toISOString().split('T')[0]
      }`;

      // Export based on requested format
      if (format.toLowerCase() === 'csv') {
        c.header('Content-Type', 'text/csv');
        c.header(
          'Content-Disposition',
          `attachment; filename="${filename}.csv"`
        );
        return c.body(convertToCSV(analytics));
      }

      // Default to JSON
      c.header('Content-Type', 'application/json');
      c.header(
        'Content-Disposition',
        `attachment; filename="${filename}.json"`
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
