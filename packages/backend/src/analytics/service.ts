import { and, eq, sql } from 'drizzle-orm';
import { createDb } from '../db/client';
import { events, customEvents } from '../db/schema/analytics';
import { urls } from '../db/schema/urls';

interface AnalyticsServiceConfig {
  database: ReturnType<typeof createDb>;
}

export interface EventData {
  urlId: number;
  userId?: number;
  eventType: string;
  eventName: string;
  properties?: Record<string, unknown>;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    device: string;
    browser: string;
    os: string;
  };
  geoInfo?: {
    country: string;
    city: string;
    region: string;
    timezone: string;
    latitude?: number;
    longitude?: number;
  };
  referrer?: string;
}

export interface CustomEventData {
  userId: number;
  name: string;
  description?: string;
  properties: string[];
}

type TimeRange = '24h' | '7d' | '30d' | '90d';

const getTimeRangeCondition = (timeRange: TimeRange) => {
  const now = new Date();
  switch (timeRange) {
    case '24h':
      return sql`datetime(created_at) >= datetime('now', '-1 day')`;
    case '7d':
      return sql`datetime(created_at) >= datetime('now', '-7 days')`;
    case '30d':
      return sql`datetime(created_at) >= datetime('now', '-30 days')`;
    case '90d':
      return sql`datetime(created_at) >= datetime('now', '-90 days')`;
  }
};

export class AnalyticsService {
  private readonly database: ReturnType<typeof createDb>;

  constructor(config: AnalyticsServiceConfig) {
    this.database = config.database;
  }

  async trackEvent(data: EventData) {
    const eventData = {
      ...data,
      properties: data.properties ? JSON.stringify(data.properties) : null,
      deviceInfo: data.deviceInfo ? JSON.stringify(data.deviceInfo) : null,
      geoInfo: data.geoInfo ? JSON.stringify(data.geoInfo) : null,
    };

    return this.database.insert(events).values(eventData);
  }

  async createCustomEvent(data: CustomEventData) {
    const customEventData = {
      ...data,
      properties: JSON.stringify(data.properties),
    };

    return this.database.insert(customEvents).values(customEventData);
  }

  async getEvents(urlId: number) {
    const results = await this.database
      .select()
      .from(events)
      .where(eq(events.urlId, urlId));

    return results.map((event) => ({
      ...event,
      properties: event.properties ? JSON.parse(event.properties) : null,
      deviceInfo: event.deviceInfo ? JSON.parse(event.deviceInfo) : null,
      geoInfo: event.geoInfo ? JSON.parse(event.geoInfo) : null,
    }));
  }

  async getCustomEvents(userId: number) {
    const results = await this.database
      .select()
      .from(customEvents)
      .where(eq(customEvents.userId, userId));

    return results.map((event) => ({
      ...event,
      properties: event.properties ? JSON.parse(event.properties) : [],
    }));
  }

  async getUrlStats(shortId: string, timeRange: TimeRange) {
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
    const lastEvent = eventResults[eventResults.length - 1];

    return {
      totalEvents,
      uniqueVisitors,
      lastEventAt: lastEvent?.createdAt,
      url,
    };
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

  async getGeoStats(shortId: string, timeRange: TimeRange) {
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

    const geoStats = eventResults.reduce(
      (
        acc: {
          countries: Record<string, number>;
          cities: Record<string, number>;
          regions: Record<string, number>;
        },
        event
      ) => {
        if (!event.geoInfo) return acc;

        const geoInfo = JSON.parse(event.geoInfo);
        const country = geoInfo.country || 'Unknown';
        const city = geoInfo.city || 'Unknown';
        const region = geoInfo.region || 'Unknown';

        acc.countries[country] = (acc.countries[country] || 0) + 1;
        acc.cities[city] = (acc.cities[city] || 0) + 1;
        acc.regions[region] = (acc.regions[region] || 0) + 1;

        return acc;
      },
      {
        countries: {},
        cities: {},
        regions: {},
      }
    );

    return geoStats;
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
          operatingSystems: Record<string, number>;
          deviceTypes: Record<string, number>;
        },
        event
      ) => {
        if (!event.deviceInfo) return acc;

        const deviceInfo = JSON.parse(event.deviceInfo);
        const browser = deviceInfo.browser || 'Unknown';
        const os = deviceInfo.os || 'Unknown';
        const deviceType = deviceInfo.deviceType || 'Unknown';

        acc.browsers[browser] = (acc.browsers[browser] || 0) + 1;
        acc.operatingSystems[os] = (acc.operatingSystems[os] || 0) + 1;
        acc.deviceTypes[deviceType] = (acc.deviceTypes[deviceType] || 0) + 1;

        return acc;
      },
      {
        browsers: {},
        operatingSystems: {},
        deviceTypes: {},
      }
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

    return dates.map((date) => ({
      date,
      clicks: clicksByDate[date] || 0,
    }));
  }
}
