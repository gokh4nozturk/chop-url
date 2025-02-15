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
      return this.database.insert(customEvents).values(data);
    } catch (error) {
      throw new ValidationError('Invalid custom event data', error);
    }
  }

  async getEvents(urlId: number) {
    return this.database.select().from(events).where(eq(events.urlId, urlId));
  }

  async getCustomEvents(userId: number) {
    return this.database
      .select()
      .from(customEvents)
      .where(eq(customEvents.userId, userId));
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
      const result = await this.database
        .select({ name: sql<string>`name` })
        .from(sql`sqlite_master`)
        .where(sql`type = 'table' AND name = ${tableName}`)
        .get();

      if (!result) {
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

  async getUrlStats(shortId: string, timeRange: TimeRange): Promise<UrlStats> {
    try {
      const url = await this.ensureUrlExists(shortId);
      await this.ensureTableExists('events');

      const timeCondition = getTimeRangeCondition(timeRange);
      const eventResults = await this.database
        .select()
        .from(events)
        .where(and(eq(events.urlId, url.id), timeCondition));

      const stats: UrlStats = {
        totalEvents: eventResults.length,
        uniqueVisitors: new Set(
          eventResults
            .filter((e) => e.deviceInfo)
            .map((e) => {
              try {
                const deviceInfo = JSON.parse(e.deviceInfo || '{}');
                return deviceInfo.ip || 'unknown';
              } catch {
                return 'unknown';
              }
            })
        ).size,
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
    const url = await this.database
      .select()
      .from(urls)
      .where(eq(urls.shortId, shortId))
      .get();

    if (!url) {
      throw new Error('URL not found');
    }

    const timeCondition = getTimeRangeCondition(timeRange);
    const conditions = [eq(events.urlId, url.id), timeCondition];

    if (eventType) {
      conditions.push(eq(events.eventType, eventType));
    }

    return this.database
      .select()
      .from(events)
      .where(and(...conditions));
  }

  async getGeoStats(shortId: string, timeRange: TimeRange): Promise<GeoStats> {
    try {
      const url = await this.ensureUrlExists(shortId);
      await this.ensureTableExists('events');

      const timeCondition = getTimeRangeCondition(timeRange);
      const eventResults = await this.database
        .select()
        .from(events)
        .where(and(eq(events.urlId, url.id), timeCondition));

      const geoStats = eventResults.reduce(
        (acc: GeoStats, event) => {
          if (!event.geoInfo) return acc;

          try {
            const geoInfo = JSON.parse(event.geoInfo);
            const country = geoInfo.country || 'Unknown';
            const city = geoInfo.city || 'Unknown';
            const region = geoInfo.region || 'Unknown';
            const timezone = geoInfo.timezone || 'Unknown';

            acc.countries[country] = (acc.countries[country] || 0) + 1;
            acc.cities[city] = (acc.cities[city] || 0) + 1;
            acc.regions[region] = (acc.regions[region] || 0) + 1;
            acc.timezones[timezone] = (acc.timezones[timezone] || 0) + 1;
          } catch (error) {
            console.error('Error parsing geo info:', error);
          }

          return acc;
        },
        { countries: {}, cities: {}, regions: {}, timezones: {} }
      );

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

  async getDeviceStats(shortId: string, timeRange: TimeRange) {
    const url = await this.database
      .select()
      .from(urls)
      .where(eq(urls.shortId, shortId))
      .get();

    if (!url) {
      throw new Error('URL not found');
    }

    const timeCondition = getTimeRangeCondition(timeRange);
    const eventResults = await this.database
      .select()
      .from(events)
      .where(and(eq(events.urlId, url.id), timeCondition));

    const deviceStats = eventResults.reduce(
      (
        acc: {
          browsers: Record<string, number>;
          devices: Record<string, number>;
          operatingSystems: Record<string, number>;
        },
        event
      ) => {
        if (!event.deviceInfo) return acc;

        try {
          const deviceInfo = JSON.parse(event.deviceInfo);
          const browser = deviceInfo.browser || 'Unknown';
          const device = deviceInfo.device || 'Unknown';
          const os = deviceInfo.os || 'Unknown';

          acc.browsers[browser] = (acc.browsers[browser] || 0) + 1;
          acc.devices[device] = (acc.devices[device] || 0) + 1;
          acc.operatingSystems[os] = (acc.operatingSystems[os] || 0) + 1;
        } catch (error) {
          console.error('Error parsing device info:', error);
        }

        return acc;
      },
      { browsers: {}, devices: {}, operatingSystems: {} }
    );

    return deviceStats;
  }

  async getUtmStats(shortId: string, timeRange: TimeRange) {
    const url = await this.database
      .select()
      .from(urls)
      .where(eq(urls.shortId, shortId))
      .get();

    if (!url) {
      throw new Error('URL not found');
    }

    const timeCondition = getTimeRangeCondition(timeRange);
    const eventResults = await this.database
      .select()
      .from(events)
      .where(and(eq(events.urlId, url.id), timeCondition));

    const utmStats = eventResults.reduce(
      (
        acc: {
          sources: Record<string, number>;
          mediums: Record<string, number>;
          campaigns: Record<string, number>;
        },
        event
      ) => {
        if (!event.properties) return acc;

        const properties = JSON.parse(event.properties);
        const source = properties.source || 'Direct';
        const medium = properties.medium || 'None';
        const campaign = properties.campaign || 'None';

        acc.sources[source] = (acc.sources[source] || 0) + 1;
        acc.mediums[medium] = (acc.mediums[medium] || 0) + 1;
        acc.campaigns[campaign] = (acc.campaigns[campaign] || 0) + 1;

        return acc;
      },
      {
        sources: {},
        mediums: {},
        campaigns: {},
      }
    );

    return utmStats;
  }

  async getClickHistory(shortId: string, timeRange: TimeRange) {
    const url = await this.database
      .select()
      .from(urls)
      .where(eq(urls.shortId, shortId))
      .get();

    if (!url) {
      throw new Error('URL not found');
    }

    const timeCondition = getTimeRangeCondition(timeRange);
    const eventResults = await this.database
      .select({
        createdAt: events.createdAt,
      })
      .from(events)
      .where(and(eq(events.urlId, url.id), timeCondition));

    // Group events by date
    const clicksByDate = eventResults.reduce(
      (acc: Record<string, number>, event) => {
        if (!event.createdAt) return acc;
        const date = new Date(event.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {}
    );

    // Fill in missing dates with 0 clicks
    const startDate = new Date();
    switch (timeRange) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    const endDate = new Date();
    const dates: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const filledClicksByDate = dates.map((date) => ({
      name: date,
      value: clicksByDate[date] || 0,
    }));

    return filledClicksByDate;
  }

  async getUserAnalytics(userId: number, timeRange: TimeRange) {
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

    const timeCondition = getTimeRangeCondition(timeRange);
    const urlIds = userUrls.map((url) => url.id);

    console.log('urlIds:', urlIds);
    console.log('timeCondition:', timeCondition);

    // Get all events for user's URLs
    const eventResults = await this.database
      .select()
      .from(events)
      .where(and(inArray(events.urlId, urlIds), timeCondition));

    console.log(
      'SQL Query:',
      this.database
        .select()
        .from(events)
        .where(and(inArray(events.urlId, urlIds), timeCondition))
        .toSQL()
    );
    console.log('eventResults:', eventResults);

    // Calculate total events and unique visitors
    const totalEvents = eventResults.length;
    const uniqueVisitors = new Set(
      eventResults
        .filter((e) => e.deviceInfo)
        .map((e) => {
          try {
            const deviceInfo = JSON.parse(e.deviceInfo || '{}');
            return deviceInfo.ip || 'unknown';
          } catch {
            return 'unknown';
          }
        })
    ).size;

    // Process device stats
    const deviceStats = eventResults.reduce(
      (
        acc: {
          browsers: Record<string, number>;
          devices: Record<string, number>;
          operatingSystems: Record<string, number>;
        },
        event
      ) => {
        if (!event.deviceInfo) return acc;

        try {
          const deviceInfo = JSON.parse(event.deviceInfo);
          const browser = deviceInfo.browser || 'Unknown';
          const device = deviceInfo.device || 'Unknown';
          const os = deviceInfo.os || 'Unknown';

          acc.browsers[browser] = (acc.browsers[browser] || 0) + 1;
          acc.devices[device] = (acc.devices[device] || 0) + 1;
          acc.operatingSystems[os] = (acc.operatingSystems[os] || 0) + 1;
        } catch (error) {
          console.error('Error parsing device info:', error);
        }

        return acc;
      },
      { browsers: {}, devices: {}, operatingSystems: {} }
    );

    // Process geo stats with timezones
    const geoStats = eventResults.reduce(
      (
        acc: {
          countries: Record<string, number>;
          cities: Record<string, number>;
          regions: Record<string, number>;
          timezones: Record<string, number>;
        },
        event
      ) => {
        if (!event.geoInfo) return acc;

        try {
          const geoInfo = JSON.parse(event.geoInfo);
          const country = geoInfo.country || 'Unknown';
          const city = geoInfo.city || 'Unknown';
          const region = geoInfo.region || 'Unknown';
          const timezone = geoInfo.timezone || 'Unknown';

          acc.countries[country] = (acc.countries[country] || 0) + 1;
          acc.cities[city] = (acc.cities[city] || 0) + 1;
          acc.regions[region] = (acc.regions[region] || 0) + 1;
          acc.timezones[timezone] = (acc.timezones[timezone] || 0) + 1;
        } catch (error) {
          console.error('Error parsing geo info:', error);
        }

        return acc;
      },
      { countries: {}, cities: {}, regions: {}, timezones: {} }
    );

    // Process UTM stats
    const utmStats = eventResults.reduce(
      (
        acc: {
          sources: Record<string, number>;
          mediums: Record<string, number>;
          campaigns: Record<string, number>;
        },
        event
      ) => {
        if (!event.properties) return acc;

        try {
          const properties = JSON.parse(event.properties);
          const source = properties.utm_source || 'direct';
          const medium = properties.utm_medium || 'none';
          const campaign = properties.utm_campaign || 'none';

          acc.sources[source] = (acc.sources[source] || 0) + 1;
          acc.mediums[medium] = (acc.mediums[medium] || 0) + 1;
          acc.campaigns[campaign] = (acc.campaigns[campaign] || 0) + 1;
        } catch (error) {
          console.error('Error parsing UTM properties:', error);
        }

        return acc;
      },
      { sources: {}, mediums: {}, campaigns: {} }
    );

    // Process clicks by date
    const clicksByDate = eventResults.reduce(
      (acc: Record<string, number>, event) => {
        if (!event.createdAt) return acc;
        const date = new Date(event.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {}
    );

    // Fill in missing dates with 0 clicks
    const startDate = new Date();
    switch (timeRange) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    const endDate = new Date();
    const dates: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const filledClicksByDate = dates.map((date) => ({
      name: date,
      value: clicksByDate[date] || 0,
    }));

    return {
      totalEvents,
      uniqueVisitors,
      geoStats,
      deviceStats,
      utmStats,
      clicksByDate: filledClicksByDate,
    };
  }
}

function getTimeRangeCondition(timeRange: TimeRange) {
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
