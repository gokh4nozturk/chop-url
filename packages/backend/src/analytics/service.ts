import { withSchema } from '@/db/helpers';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { createDb } from '../db/client';
import {
  events,
  EVENT_TYPES,
  EventType,
  customEvents,
  schemas,
} from '../db/schema/analytics';
import { urls } from '../db/schema/urls';
import { WebSocketService } from '../websocket/service';
import {
  CustomEventData,
  DeviceStats,
  EventData,
  GeoStats,
  TimeRange,
  UrlStats,
  UtmStats,
} from './types';

// Type definitions for parsed JSON objects
interface DeviceInfoData {
  ip?: string;
  browser?: string;
  device?: string;
  os?: string;
  [key: string]: unknown;
}

interface GeoInfoData {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  [key: string]: unknown;
}

interface UtmPropertiesData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  [key: string]: unknown;
}

interface AnalyticsServiceConfig {
  database: ReturnType<typeof createDb>;
  wsService: WebSocketService;
}

// Custom error classes for better error handling
export class UrlNotFoundError extends Error {
  constructor(shortId: string) {
    super(`URL with shortId "${shortId}" not found`);
    this.name = 'UrlNotFoundError';
  }
}

export class DatabaseTableError extends Error {
  constructor(tableName: string, operation: string) {
    super(`Error ${operation} table "${tableName}". Table might be missing.`);
    this.name = 'DatabaseTableError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AnalyticsService {
  private readonly database: ReturnType<typeof createDb>;
  private readonly wsService: WebSocketService;

  constructor(config: AnalyticsServiceConfig) {
    this.database = config.database;
    this.wsService = config.wsService;
  }

  async trackEvent(data: EventData) {
    // Validate data using Zod schemas
    try {
      if (data.deviceInfo) {
        data.deviceInfo = schemas.deviceInfo.parse(data.deviceInfo);
      }
      if (data.geoInfo) {
        data.geoInfo = schemas.geoInfo.parse(data.geoInfo);
      }
      if (data.properties) {
        data.properties = schemas.eventProperties.parse(data.properties);
      }

      // Validate event type
      if (!EVENT_TYPES.includes(data.eventType as EventType)) {
        throw new ValidationError('Invalid event type', data.eventType);
      }

      // Prepare data for insertion
      const insertData = {
        ...data,
        properties: data.properties ? JSON.stringify(data.properties) : null,
        deviceInfo: data.deviceInfo ? JSON.stringify(data.deviceInfo) : null,
        geoInfo: data.geoInfo ? JSON.stringify(data.geoInfo) : null,
      };

      // Insert validated data
      await this.database.insert(events).values(insertData);

      // Broadcast event to WebSocket subscribers
      this.wsService.broadcast(`url:${data.urlId}`, data);

      return true;
    } catch (error) {
      throw new ValidationError('Invalid event data', error);
    }
  }

  async createCustomEvent(data: CustomEventData) {
    // Validate properties array
    try {
      if (data.properties) {
        const validatedProperties = schemas.eventProperties
          .array()
          .parse(data.properties);
        const insertData = {
          ...data,
          properties: JSON.stringify(validatedProperties),
        };
        return this.database.insert(customEvents).values(insertData);
      }
      return this.database.insert(customEvents).values(
        withSchema({
          ...data,
          properties: data.properties ? JSON.stringify(data.properties) : null,
        })
      );
    } catch (error) {
      throw new ValidationError('Invalid custom event data', error);
    }
  }

  async getEvents(urlId: number, timeRange: TimeRange) {
    const timeCondition = this.getTimeRangeCondition(timeRange);
    return this.database
      .select()
      .from(events)
      .where(and(eq(events.urlId, urlId), timeCondition));
  }

  async getCustomEvents(userId: number) {
    return this.database
      .select()
      .from(customEvents)
      .where(eq(customEvents.userId, userId));
  }

  // Helper method to safely parse JSON
  private safeJsonParse<T>(jsonString: string | null, defaultValue: T): T {
    if (!jsonString) return defaultValue;
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      this.logError('JSON parse error', error);
      return defaultValue;
    }
  }

  // Helper method for structured error logging
  private logError(context: string, error: unknown, data?: unknown) {
    const errorInfo = {
      context,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      data,
    };

    console.error(JSON.stringify(errorInfo));
  }

  private async ensureUrlExists(shortId: string) {
    const url = await this.database
      .select()
      .from(urls)
      .where(eq(urls.shortId, shortId))
      .get();

    if (!url) {
      throw new UrlNotFoundError(shortId);
    }

    return url;
  }

  private async ensureTableExists(tableName: string) {
    try {
      // Validate table name (whitelist approach)
      const validTables = ['custom_events', 'events', 'urls'];
      if (!validTables.includes(tableName)) {
        throw new Error(`Invalid table name: ${tableName}`);
      }

      const result = await this.database
        .select({ name: sql<string>`name` })
        .from(sql`sqlite_master`)
        .where(sql`type = 'table' AND name = ${tableName}`);

      if (!result.length) {
        // If table doesn't exist, create it
        if (tableName === 'custom_events') {
          await this.database.run(sql`
            CREATE TABLE IF NOT EXISTS custom_events (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              name TEXT NOT NULL,
              description TEXT,
              properties TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
          `);
        }
        // Add more table creations as needed
      }
    } catch (error) {
      throw new DatabaseTableError(tableName, 'accessing/creating');
    }
  }

  // Generic function to process events for statistics
  private processEvents<T>(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    events: Array<{ [key: string]: any }>,
    propertyKey: string,
    fieldExtractor: (data: T) => Record<string, string>,
    defaultValue: T
  ): Record<string, number> {
    // Type assertion for the initial accumulator
    const initialAcc: Record<string, number> = {};

    return events.reduce((acc: Record<string, number>, event) => {
      if (!event[propertyKey]) return acc;

      try {
        const data = this.safeJsonParse<T>(
          event[propertyKey] as string,
          defaultValue
        );
        const fields = fieldExtractor(data);

        for (const [key, value] of Object.entries(fields)) {
          const normalizedValue = value || 'Unknown';
          acc[normalizedValue] = (acc[normalizedValue] || 0) + 1;
        }
      } catch (error) {
        this.logError(`Error processing ${propertyKey}`, error);
      }

      return acc;
    }, initialAcc);
  }

  async getUrlStats(shortId: string, timeRange: TimeRange): Promise<UrlStats> {
    try {
      const url = await this.ensureUrlExists(shortId);
      await this.ensureTableExists('events');

      const timeCondition = this.getTimeRangeCondition(timeRange);
      const eventResults = await this.database
        .select()
        .from(events)
        .where(and(eq(events.urlId, url.id), timeCondition));

      const uniqueIps = new Set<string>();
      for (const event of eventResults) {
        if (event.deviceInfo) {
          try {
            const deviceInfo = this.safeJsonParse<DeviceInfoData>(
              event.deviceInfo,
              {}
            );
            if (deviceInfo.ip) uniqueIps.add(deviceInfo.ip);
          } catch (err) {
            // Already handled in safeJsonParse
          }
        }
      }

      const stats: UrlStats = {
        totalEvents: eventResults.length,
        uniqueVisitors: uniqueIps.size,
        lastEventAt: eventResults[eventResults.length - 1]?.createdAt || null,
        url: {
          id: url.id,
          shortId: url.shortId,
          originalUrl: url.originalUrl,
          createdAt: url.createdAt || '',
        },
      };

      return stats;
    } catch (error) {
      if (
        error instanceof UrlNotFoundError ||
        error instanceof DatabaseTableError
      ) {
        throw error;
      }
      throw new Error(`Failed to get URL stats: ${(error as Error).message}`);
    }
  }

  async getUrlEvents(
    shortId: string,
    timeRange: TimeRange,
    eventType?: string
  ) {
    try {
      const url = await this.ensureUrlExists(shortId);
      const timeCondition = this.getTimeRangeCondition(timeRange);
      const conditions = [eq(events.urlId, url.id), timeCondition];

      if (eventType) {
        conditions.push(eq(events.eventType, eventType as EventType));
      }

      return this.database
        .select()
        .from(events)
        .where(and(...conditions));
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get URL events: ${(error as Error).message}`);
    }
  }

  async getGeoStats(shortId: string, timeRange: TimeRange): Promise<GeoStats> {
    try {
      const url = await this.ensureUrlExists(shortId);
      await this.ensureTableExists('events');

      const timeCondition = this.getTimeRangeCondition(timeRange);
      const eventResults = await this.database
        .select()
        .from(events)
        .where(and(eq(events.urlId, url.id), timeCondition));

      const geoStats: GeoStats = {
        countries: {},
        cities: {},
        regions: {},
        timezones: {},
      };

      for (const event of eventResults) {
        if (!event.geoInfo) continue;

        try {
          const geoInfo = this.safeJsonParse<GeoInfoData>(event.geoInfo, {});
          const country = geoInfo.country || 'Unknown';
          const city = geoInfo.city || 'Unknown';
          const region = geoInfo.region || 'Unknown';
          const timezone = geoInfo.timezone || 'Unknown';

          geoStats.countries[country] = (geoStats.countries[country] || 0) + 1;
          geoStats.cities[city] = (geoStats.cities[city] || 0) + 1;
          geoStats.regions[region] = (geoStats.regions[region] || 0) + 1;
          geoStats.timezones[timezone] =
            (geoStats.timezones[timezone] || 0) + 1;
        } catch (error) {
          // Already handled in safeJsonParse
        }
      }

      return geoStats;
    } catch (error) {
      if (
        error instanceof UrlNotFoundError ||
        error instanceof DatabaseTableError
      ) {
        throw error;
      }
      throw new Error(`Failed to get geo stats: ${(error as Error).message}`);
    }
  }

  async getDeviceStats(
    shortId: string,
    timeRange: TimeRange
  ): Promise<DeviceStats> {
    try {
      const url = await this.ensureUrlExists(shortId);
      const timeCondition = this.getTimeRangeCondition(timeRange);
      const eventResults = await this.database
        .select()
        .from(events)
        .where(and(eq(events.urlId, url.id), timeCondition));

      const deviceStats: DeviceStats = {
        browsers: {},
        devices: {},
        operatingSystems: {},
      };

      for (const event of eventResults) {
        if (!event.deviceInfo) continue;

        try {
          const deviceInfo = this.safeJsonParse<DeviceInfoData>(
            event.deviceInfo,
            {}
          );
          const browser = deviceInfo.browser || 'Unknown';
          const device = deviceInfo.device || 'Unknown';
          const os = deviceInfo.os || 'Unknown';

          deviceStats.browsers[browser] =
            (deviceStats.browsers[browser] || 0) + 1;
          deviceStats.devices[device] = (deviceStats.devices[device] || 0) + 1;
          deviceStats.operatingSystems[os] =
            (deviceStats.operatingSystems[os] || 0) + 1;
        } catch (error) {
          // Already handled in safeJsonParse
        }
      }

      return deviceStats;
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        throw error;
      }
      throw new Error(
        `Failed to get device stats: ${(error as Error).message}`
      );
    }
  }

  async getUtmStats(shortId: string, timeRange: TimeRange): Promise<UtmStats> {
    try {
      const url = await this.ensureUrlExists(shortId);
      const timeCondition = this.getTimeRangeCondition(timeRange);
      const eventResults = await this.database
        .select()
        .from(events)
        .where(and(eq(events.urlId, url.id), timeCondition));

      const utmStats: UtmStats = {
        sources: {},
        mediums: {},
        campaigns: {},
      };

      for (const event of eventResults) {
        if (!event.properties) continue;

        try {
          const properties = this.safeJsonParse<UtmPropertiesData>(
            event.properties,
            {}
          );
          const source = properties.utm_source || 'Direct';
          const medium = properties.utm_medium || 'None';
          const campaign = properties.utm_campaign || 'None';

          utmStats.sources[source] = (utmStats.sources[source] || 0) + 1;
          utmStats.mediums[medium] = (utmStats.mediums[medium] || 0) + 1;
          utmStats.campaigns[campaign] =
            (utmStats.campaigns[campaign] || 0) + 1;
        } catch (error) {
          // Already handled in safeJsonParse
        }
      }

      return utmStats;
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get UTM stats: ${(error as Error).message}`);
    }
  }

  async getClickHistory(shortId: string, timeRange: TimeRange) {
    try {
      const url = await this.ensureUrlExists(shortId);
      const timeCondition = this.getTimeRangeCondition(timeRange);
      const eventResults = await this.database
        .select({
          createdAt: events.createdAt,
        })
        .from(events)
        .where(and(eq(events.urlId, url.id), timeCondition));

      // Group events by date
      const clicksByDate: Record<string, number> = {};

      // Fill in dates with zero values first
      const dates = this.getDatesInRange(timeRange);
      for (const date of dates) {
        clicksByDate[date] = 0;
      }

      // Now count actual events
      for (const event of eventResults) {
        if (!event.createdAt) continue;
        const date = new Date(event.createdAt).toISOString().split('T')[0];
        clicksByDate[date] = (clicksByDate[date] || 0) + 1;
      }

      return Object.entries(clicksByDate).map(([date, value]) => ({
        name: date,
        value,
      }));
    } catch (error) {
      if (error instanceof UrlNotFoundError) {
        throw error;
      }
      throw new Error(
        `Failed to get click history: ${(error as Error).message}`
      );
    }
  }

  async getUserAnalytics(userId: number, timeRange: TimeRange) {
    try {
      // Get all URLs for the user
      const userUrls = await this.database
        .select()
        .from(urls)
        .where(eq(urls.userId, userId));

      if (!userUrls.length) {
        return {
          totalEvents: 0,
          uniqueVisitors: 0,
          geoStats: { countries: {}, cities: {}, regions: {}, timezones: {} },
          deviceStats: { browsers: {}, devices: {}, operatingSystems: {} },
          utmStats: { sources: {}, mediums: {}, campaigns: {} },
          clicksByDate: [],
        };
      }

      const timeCondition = this.getTimeRangeCondition(timeRange);
      const urlIds = userUrls.map((url) => url.id);

      // Get all events for user's URLs
      const eventResults = await this.database
        .select()
        .from(events)
        .where(and(inArray(events.urlId, urlIds), timeCondition));

      // Calculate unique visitors
      const uniqueIps = new Set<string>();
      for (const event of eventResults) {
        if (event.deviceInfo) {
          try {
            const deviceInfo = this.safeJsonParse<DeviceInfoData>(
              event.deviceInfo,
              {}
            );
            if (deviceInfo.ip) uniqueIps.add(deviceInfo.ip);
          } catch (err) {
            // Already handled in safeJsonParse
          }
        }
      }

      // Process device stats
      const deviceStats: DeviceStats = {
        browsers: {},
        devices: {},
        operatingSystems: {},
      };
      const geoStats: GeoStats = {
        countries: {},
        cities: {},
        regions: {},
        timezones: {},
      };
      const utmStats: UtmStats = { sources: {}, mediums: {}, campaigns: {} };

      // Process each event only once for all stats
      for (const event of eventResults) {
        // Process device info
        if (event.deviceInfo) {
          try {
            const deviceInfo = this.safeJsonParse<DeviceInfoData>(
              event.deviceInfo,
              {}
            );
            const browser = deviceInfo.browser || 'Unknown';
            const device = deviceInfo.device || 'Unknown';
            const os = deviceInfo.os || 'Unknown';

            deviceStats.browsers[browser] =
              (deviceStats.browsers[browser] || 0) + 1;
            deviceStats.devices[device] =
              (deviceStats.devices[device] || 0) + 1;
            deviceStats.operatingSystems[os] =
              (deviceStats.operatingSystems[os] || 0) + 1;
          } catch (error) {
            // Already handled in safeJsonParse
          }
        }

        // Process geo info
        if (event.geoInfo) {
          try {
            const geoInfo = this.safeJsonParse<GeoInfoData>(event.geoInfo, {});
            const country = geoInfo.country || 'Unknown';
            const city = geoInfo.city || 'Unknown';
            const region = geoInfo.region || 'Unknown';
            const timezone = geoInfo.timezone || 'Unknown';

            geoStats.countries[country] =
              (geoStats.countries[country] || 0) + 1;
            geoStats.cities[city] = (geoStats.cities[city] || 0) + 1;
            geoStats.regions[region] = (geoStats.regions[region] || 0) + 1;
            geoStats.timezones[timezone] =
              (geoStats.timezones[timezone] || 0) + 1;
          } catch (error) {
            // Already handled in safeJsonParse
          }
        }

        // Process UTM properties
        if (event.properties) {
          try {
            const properties = this.safeJsonParse<UtmPropertiesData>(
              event.properties,
              {}
            );
            const source = properties.utm_source || 'Direct';
            const medium = properties.utm_medium || 'None';
            const campaign = properties.utm_campaign || 'None';

            utmStats.sources[source] = (utmStats.sources[source] || 0) + 1;
            utmStats.mediums[medium] = (utmStats.mediums[medium] || 0) + 1;
            utmStats.campaigns[campaign] =
              (utmStats.campaigns[campaign] || 0) + 1;
          } catch (error) {
            // Already handled in safeJsonParse
          }
        }
      }

      // Process click history
      const clicksByDate: Record<string, number> = {};

      // Initialize with zero values
      const dates = this.getDatesInRange(timeRange);
      for (const date of dates) {
        clicksByDate[date] = 0;
      }

      // Count events by date
      for (const event of eventResults) {
        if (!event.createdAt) continue;
        const date = new Date(event.createdAt).toISOString().split('T')[0];
        clicksByDate[date] = (clicksByDate[date] || 0) + 1;
      }

      const filledClicksByDate = Object.entries(clicksByDate).map(
        ([date, value]) => ({
          name: date,
          value,
        })
      );

      return {
        totalEvents: eventResults.length,
        uniqueVisitors: uniqueIps.size,
        geoStats,
        deviceStats,
        utmStats,
        clicksByDate: filledClicksByDate,
      };
    } catch (error) {
      throw new Error(
        `Failed to get user analytics: ${(error as Error).message}`
      );
    }
  }

  // Helper function to get time range condition
  private getTimeRangeCondition(timeRange: TimeRange) {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    return sql`created_at >= ${startDate.toISOString()}`;
  }

  // Helper function to get all dates in a time range
  private getDatesInRange(timeRange: TimeRange): string[] {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    const dates: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= now) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }
}
