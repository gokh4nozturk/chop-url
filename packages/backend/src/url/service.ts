import { withSchema } from '@/db/helpers';
import { ChopUrl } from '@chop-url/lib';
import { and, desc, eq, gte, inArray, or, sql } from 'drizzle-orm';
import { UAParser } from 'ua-parser-js';
import { createDb } from '../db/client';
import { urlGroups, urls, visits } from '../db/schema';
import {
  ICreateUrlResponse,
  IUrl,
  IUrlGroup,
  IUrlStats,
  IVisit,
  UpdateUrlOptions,
} from './types';

type Visit = typeof visits.$inferSelect;
type Url = typeof urls.$inferSelect;
type DbClient = ReturnType<typeof createDb>;

interface CreateUrlOptions {
  customSlug?: string;
  expiresAt?: string;
}

interface CFProperties {
  country?: string;
  city?: string;
}

export class UrlService {
  private chopUrl: ChopUrl;
  private db: DbClient;
  private baseUrl: string;

  constructor(baseUrl: string, db: DbClient) {
    this.chopUrl = new ChopUrl(baseUrl);
    this.db = db;
    this.baseUrl = baseUrl;
  }

  private async isShortIdUnique(shortId: string): Promise<boolean> {
    const existing = await this.db
      .select()
      .from(urls)
      .where(eq(urls.shortId, shortId))
      .limit(1);
    return existing.length === 0;
  }

  async createShortUrl(
    url: string,
    options?: {
      customSlug?: string;
      expiresAt?: string;
      tags?: string[];
      groupId?: number;
    },
    token?: string,
    userId?: string
  ): Promise<ICreateUrlResponse> {
    try {
      let shortId: string;

      // If custom slug is provided, check if it's available
      if (options?.customSlug) {
        const existingCustomSlug = await this.db
          .select()
          .from(urls)
          .where(
            or(
              eq(urls.shortId, options.customSlug),
              eq(urls.customSlug, options.customSlug)
            )
          )
          .limit(1);

        if (existingCustomSlug.length > 0) {
          throw new Error('Custom slug already exists');
        }
        shortId = options.customSlug;
      } else {
        // Generate a new unique shortId
        do {
          const generated = this.chopUrl.generateShortUrl(url);
          shortId = generated.shortId;
        } while (!(await this.isShortIdUnique(shortId)));
      }

      // Create the URL record
      const urlData = {
        shortId,
        originalUrl: url,
        customSlug: options?.customSlug,
        userId: userId ? parseInt(userId) : null,
        createdAt: new Date().toISOString(),
        lastAccessedAt: null,
        visitCount: 0,
        expiresAt:
          options?.expiresAt || (!token ? this.getDefaultExpiration() : null),
        tags: options?.tags ? JSON.stringify(options.tags) : null,
        groupId: options?.groupId || null,
      };

      await this.db.insert(urls).values(urlData);

      return {
        shortUrl: `${this.baseUrl}/${shortId}`,
        shortId,
        originalUrl: url,
        createdAt: urlData.createdAt,
        expiresAt: urlData.expiresAt || undefined,
        userId: urlData.userId,
      };
    } catch (error) {
      console.error('Error in createShortUrl:', error);
      throw error;
    }
  }

  private getDefaultExpiration(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 7 days from now
    return date.toISOString();
  }

  async getOriginalUrl(shortId: string) {
    const result = await this.db
      .select()
      .from(urls)
      .where(eq(urls.shortId, shortId))
      .limit(1);

    if (!result.length) {
      throw new Error('URL not found');
    }

    return result[0].originalUrl;
  }

  async getUrlInfo(shortId: string, userId: string) {
    const result = await this.db
      .select()
      .from(urls)
      .where(and(eq(urls.shortId, shortId), eq(urls.userId, parseInt(userId))))
      .limit(1);

    if (!result.length) {
      throw new Error('URL not found');
    }

    const url = result[0];
    return {
      ...url,
      shortUrl: `${this.baseUrl}/${url.shortId}`,
    };
  }

  async getUserUrls(userId: string) {
    console.log('getUserUrls called with userId:', userId);
    console.log('userId type:', typeof userId);

    try {
      console.log('Starting DB query with parsed userId:', parseInt(userId));
      const userUrls = await this.db
        .select()
        .from(urls)
        .where(eq(urls.userId, parseInt(userId)))
        .orderBy(desc(urls.createdAt));

      console.log('DB query completed, results:', userUrls.length);
      console.log(
        'First result (if any):',
        userUrls[0] ? JSON.stringify(userUrls[0]) : 'No results'
      );

      return userUrls.map((url: Url) => ({
        id: url.id,
        shortId: url.shortId,
        shortUrl: `${this.baseUrl}/${url.shortId}`,
        originalUrl: url.originalUrl,
        createdAt: url.createdAt || '',
        lastAccessedAt: url.lastAccessedAt || '',
        visitCount: url.visitCount || 0,
        isActive: url.isActive || false,
        expiresAt: url.expiresAt || '',
        userId: url.userId || 0,
        customSlug: url.customSlug || '',
      }));
    } catch (error) {
      console.error('Error in getUserUrls:', error);
      throw error;
    }
  }

  async getUrl(shortId: string): Promise<IUrl | null> {
    const [url] = await this.db
      .select()
      .from(urls)
      .where(eq(urls.shortId, shortId));

    if (!url) {
      return null;
    }

    return {
      id: url.id,
      shortId: url.shortId,
      shortUrl: `${this.baseUrl}/${url.shortId}`,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt || '',
      lastAccessedAt: url.lastAccessedAt || '',
      visitCount: url.visitCount || 0,
      isActive: url.isActive || false,
      expiresAt: url.expiresAt || '',
      userId: url.userId || 0,
      customSlug: url.customSlug || '',
    };
  }

  async getUserAnalytics(
    userId: string,
    period: '24h' | '7d' | '30d' | '90d' = '7d'
  ) {
    try {
      // Get user's URLs
      const userUrls = await this.db
        .select()
        .from(urls)
        .where(eq(urls.userId, parseInt(userId)));

      if (!userUrls.length) {
        return {
          totalClicks: 0,
          uniqueVisitors: 0,
          countries: [],
          cities: [],
          regions: [],
          timezones: [],
          referrers: [],
          devices: [],
          browsers: [],
          operatingSystems: [],
          clicksByDate: [],
        };
      }

      const urlIds = userUrls.map((url: Url) => url.id);

      // Get visits for these URLs within the specified period
      const periodMap = {
        '24h': '1 day',
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days',
      };

      const startDate = new Date();
      switch (period) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
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

      const urlVisits = await this.db
        .select()
        .from(visits)
        .where(
          and(
            inArray(visits.urlId, urlIds),
            gte(visits.visitedAt, startDate.toISOString())
          )
        )
        .orderBy(desc(visits.visitedAt));

      const totalClicks = urlVisits.length;
      const uniqueIPs = new Set(
        urlVisits.map((visit: Visit) => visit.ipAddress)
      ).size;

      // Aggregate data
      const countryMap = new Map<string, number>();
      const cityMap = new Map<string, number>();
      const regionMap = new Map<string, number>();
      const timezoneMap = new Map<string, number>();
      const referrerMap = new Map<string, number>();
      const deviceMap = new Map<string, number>();
      const browserMap = new Map<string, number>();
      const osMap = new Map<string, number>();
      const dateMap = new Map<string, number>();

      for (const visit of urlVisits) {
        // Country stats
        const country = visit.country || 'Unknown';
        countryMap.set(country, (countryMap.get(country) || 0) + 1);

        // City stats
        const city = visit.city || 'Unknown';
        cityMap.set(city, (cityMap.get(city) || 0) + 1);

        // Region stats
        const region = visit.region || 'Unknown';
        regionMap.set(region, (regionMap.get(region) || 0) + 1);

        // Timezone stats
        const timezone = visit.timezone || 'Unknown';
        timezoneMap.set(timezone, (timezoneMap.get(timezone) || 0) + 1);

        // Referrer stats
        const referrer = visit.referrer || 'Direct';
        referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);

        // Device stats
        const device = visit.deviceType || 'Desktop';
        deviceMap.set(device, (deviceMap.get(device) || 0) + 1);

        // Browser stats
        const browser = visit.browser || 'Unknown';
        browserMap.set(browser, (browserMap.get(browser) || 0) + 1);

        // OS stats
        const os = visit.os || 'Unknown';
        osMap.set(os, (osMap.get(os) || 0) + 1);

        // Date stats
        const date = visit.visitedAt
          ? new Date(visit.visitedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }

      return {
        totalClicks,
        uniqueVisitors: uniqueIPs,
        countries: Array.from(countryMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        cities: Array.from(cityMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        regions: Array.from(regionMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        timezones: Array.from(timezoneMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        referrers: Array.from(referrerMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        devices: Array.from(deviceMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        browsers: Array.from(browserMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        operatingSystems: Array.from(osMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        clicksByDate: Array.from(dateMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      };
    } catch (error) {
      console.error('Error in getUserAnalytics:', error);
      throw error;
    }
  }

  async createUrlGroup(
    name: string,
    description: string | null,
    userId: number
  ): Promise<IUrlGroup> {
    const [group] = await this.db
      .insert(urlGroups)
      .values(
        withSchema({
          name,
          description,
          userId,
          createdAt: new Date().toISOString(),
        })
      )
      .returning();

    return {
      ...group,
      description: group.description || undefined,
      createdAt: group.createdAt || '',
      updatedAt: group.updatedAt || undefined,
    };
  }

  async updateUrlGroup(
    groupId: number,
    userId: number,
    data: Partial<IUrlGroup>
  ): Promise<IUrlGroup> {
    const [group] = await this.db
      .update(urlGroups)
      .set(
        withSchema({
          ...data,
          updatedAt: new Date().toISOString(),
        })
      )
      .where(and(eq(urlGroups.id, groupId), eq(urlGroups.userId, userId)))
      .returning();

    if (!group) {
      throw new Error('URL group not found');
    }

    return {
      ...group,
      description: group.description || undefined,
      createdAt: group.createdAt || '',
      updatedAt: group.updatedAt || undefined,
    };
  }

  async deleteUrlGroup(groupId: number, userId: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Remove group association from URLs
      await tx
        .update(urls)
        .set(withSchema({ groupId: null }))
        .where(eq(urls.groupId, groupId));

      // Delete the group
      const result = await tx
        .delete(urlGroups)
        .where(and(eq(urlGroups.id, groupId), eq(urlGroups.userId, userId)));

      if (!result) {
        throw new Error('URL group not found');
      }
    });
  }

  async getUserUrlGroups(userId: number): Promise<IUrlGroup[]> {
    const groups = await this.db
      .select()
      .from(urlGroups)
      .where(eq(urlGroups.userId, userId))
      .orderBy(desc(urlGroups.createdAt));

    return groups.map((group) => ({
      ...group,
      description: group.description || undefined,
      createdAt: group.createdAt || '',
      updatedAt: group.updatedAt || undefined,
    }));
  }

  async getUrlGroup(
    groupId: number,
    userId: number
  ): Promise<IUrlGroup | null> {
    const [group] = await this.db
      .select()
      .from(urlGroups)
      .where(and(eq(urlGroups.id, groupId), eq(urlGroups.userId, userId)));

    if (!group) {
      return null;
    }

    return {
      ...group,
      description: group.description || undefined,
      createdAt: group.createdAt || '',
      updatedAt: group.updatedAt || undefined,
    };
  }

  async updateUrl(
    shortId: string,
    userId: number,
    data: UpdateUrlOptions
  ): Promise<IUrl> {
    const [url] = await this.db
      .update(urls)
      .set(
        withSchema({
          originalUrl: data.originalUrl,
          customSlug: data.customSlug,
          expiresAt: data.expiresAt,
          tags: data.tags ? JSON.stringify(data.tags) : undefined,
          groupId: data.groupId,
          isActive: data.isActive,
        })
      )
      .where(and(eq(urls.shortId, shortId), eq(urls.userId, userId)))
      .returning();

    if (!url) {
      throw new Error('URL not found');
    }

    return {
      ...url,
      tags: url.tags ? JSON.parse(url.tags) : [],
      shortUrl: `${this.baseUrl}/${url.shortId}`,
      createdAt: url.createdAt || '',
      lastAccessedAt: url.lastAccessedAt || undefined,
      visitCount: url.visitCount || 0,
      isActive: url.isActive || false,
      expiresAt: url.expiresAt || undefined,
      userId: url.userId || undefined,
      customSlug: url.customSlug || undefined,
      groupId: url.groupId || undefined,
    };
  }

  async deleteUrl(shortId: string, userId: number): Promise<void> {
    const result = await this.db
      .delete(urls)
      .where(and(eq(urls.shortId, shortId), eq(urls.userId, userId)));

    if (!result) {
      throw new Error('URL not found');
    }
  }
}

export async function trackVisit(
  db: DbClient,
  urlId: number,
  ipAddress: string,
  userAgent: string,
  referrer: string | null,
  cf?: CFProperties
): Promise<void> {
  try {
    console.log('TrackVisit CF Object:', cf);

    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    // Use Cloudflare's location data if available, otherwise use 'Unknown'
    const country = cf?.country || 'Unknown';
    const city = cf?.city || 'Unknown';

    console.log('Location Info:', { country, city });

    // Get current visit count
    const [currentUrl] = await db.select().from(urls).where(eq(urls.id, urlId));

    if (!currentUrl) {
      throw new Error('URL not found');
    }

    // Update visit count and last accessed time
    await db
      .update(urls)
      .set(
        withSchema({
          visitCount: (currentUrl.visitCount || 0) + 1,
          lastAccessedAt: new Date().toISOString(),
        })
      )
      .where(eq(urls.id, urlId));

    // Insert visit record
    await db.insert(visits).values(
      withSchema({
        urlId,
        ipAddress,
        userAgent,
        referrer,
        browser: browser.name || null,
        browserVersion: browser.version || null,
        os: os.name || null,
        osVersion: os.version || null,
        deviceType: device.type || null,
        country,
        city,
        visitedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('Error in trackVisit:', error);
    throw error;
  }
}

export async function getVisitsByTimeRange(
  db: DbClient,
  shortId: string,
  period: '24h' | '7d' | '30d' | '90d' = '7d'
): Promise<{ date: string; count: number }[]> {
  const [url] = await db.select().from(urls).where(eq(urls.shortId, shortId));

  if (!url) {
    throw new Error('URL not found');
  }

  const result = await db
    .select({
      date: sql<string>`date(visited_at)`,
      count: sql<number>`count(*)`,
    })
    .from(visits)
    .where(
      and(
        eq(visits.urlId, url.id),
        sql`datetime(visited_at) >= datetime('now', '-${period}')`,
        sql`datetime(visited_at) <= datetime('now')`
      )
    )
    .groupBy(sql`date(visited_at)`);

  return result;
}
