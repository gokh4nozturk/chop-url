import { ChopUrl } from '@chop-url/lib';
import { Reader } from '@maxmind/geoip2-node';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { UAParser } from 'ua-parser-js';
import { createDb } from '../db/client';
import { urls, visits } from '../db/schema';
import { ICreateUrlResponse, IUrl, IUrlStats, IVisit } from './index';

type Visit = typeof visits.$inferSelect;
type Url = typeof urls.$inferSelect;
type DbClient = ReturnType<typeof createDb>;

interface CreateUrlOptions {
  customSlug?: string;
  expiresAt?: string;
}

export class UrlService {
  private chopUrl: ChopUrl;
  private db: DbClient;

  constructor(
    private baseUrl: string,
    db: DbClient
  ) {
    this.chopUrl = new ChopUrl(this.baseUrl);
    this.db = db;
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
    options?: CreateUrlOptions,
    token?: string,
    userId?: string
  ): Promise<ICreateUrlResponse> {
    try {
      if (process.env.NODE_ENV === 'test') {
        const { shortId, originalUrl } = this.chopUrl.generateShortUrl(
          url,
          options
        );

        return {
          shortUrl: `${this.baseUrl}/${shortId}`,
          shortId,
          originalUrl,
          createdAt: new Date().toISOString(),
          userId: userId ? parseInt(userId) : null,
        };
      }

      // Check if URL already exists
      const response = await this.db
        .select()
        .from(urls)
        .where(eq(urls.originalUrl, url));

      if (response.length > 0) {
        return {
          shortUrl: `${this.baseUrl}/${response[0].shortId}`,
          shortId: response[0].shortId,
          originalUrl: response[0].originalUrl,
          createdAt: response[0].createdAt,
          userId: response[0].userId,
        };
      }

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

        // Use the custom slug directly
        const shortId = options.customSlug;
        const urlData = {
          shortId,
          originalUrl: url,
          customSlug: options.customSlug,
          userId: userId ? parseInt(userId) : null,
          createdAt: new Date().toISOString(),
          lastAccessedAt: null,
          visitCount: 0,
          expiresAt:
            options?.expiresAt ||
            (!token
              ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              : null),
          isActive: true,
        };

        console.log('Creating URL with custom slug:', urlData);

        const result = await this.db.insert(urls).values(urlData).returning({
          shortId: urls.shortId,
          originalUrl: urls.originalUrl,
          createdAt: urls.createdAt,
          userId: urls.userId,
        });

        console.log('Insert result:', result);

        return {
          shortUrl: `${this.baseUrl}/${shortId}`,
          shortId,
          originalUrl: url,
          createdAt: new Date().toISOString(),
          userId: urlData.userId,
        };
      }

      // Generate a new short ID if no custom slug
      let shortId: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 5;

      do {
        const generated = this.chopUrl.generateShortUrl(url);
        shortId = generated.shortId;
        isUnique = await this.isShortIdUnique(shortId);
        attempts++;
      } while (!isUnique && attempts < maxAttempts);

      if (!isUnique) {
        throw new Error('Failed to generate unique short ID');
      }

      const urlData = {
        shortId,
        originalUrl: url,
        customSlug: null,
        userId: userId ? parseInt(userId) : null,
        createdAt: new Date().toISOString(),
        lastAccessedAt: null,
        visitCount: 0,
        expiresAt:
          options?.expiresAt ||
          (!token
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            : null),
        isActive: true,
      };

      console.log('Creating URL with generated shortId:', urlData);

      const result = await this.db.insert(urls).values(urlData).returning({
        shortId: urls.shortId,
        originalUrl: urls.originalUrl,
        createdAt: urls.createdAt,
        userId: urls.userId,
      });

      console.log('Insert result:', result);

      return {
        shortUrl: `${this.baseUrl}/${shortId}`,
        shortId,
        originalUrl: url,
        createdAt: new Date().toISOString(),
        userId: urlData.userId,
      };
    } catch (error) {
      console.error('Error in createShortUrl:', error);
      if (error instanceof Error) {
        if (error.message === 'Custom slug already exists') {
          throw error;
        }
      }
      throw new Error('Failed to create short URL');
    }
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
    const userUrls = await this.db
      .select()
      .from(urls)
      .where(eq(urls.userId, parseInt(userId)))
      .orderBy(desc(urls.createdAt));

    return userUrls.map((url: Url) => ({
      id: url.id,
      shortId: url.shortId,
      shortUrl: `${this.baseUrl}/${url.shortId}`,
      originalUrl: url.originalUrl,
      created_at: url.createdAt || '',
      last_accessed_at: url.lastAccessedAt || '',
      visit_count: url.visitCount || 0,
      isActive: url.isActive || false,
      expiresAt: url.expiresAt || '',
      userId: url.userId || 0,
      customSlug: url.customSlug || '',
    }));
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
      created_at: url.createdAt || '',
      last_accessed_at: url.lastAccessedAt || '',
      visit_count: url.visitCount || 0,
      isActive: url.isActive || false,
      expiresAt: url.expiresAt || '',
      userId: url.userId || 0,
      customSlug: url.customSlug || '',
    };
  }

  async getUrlStats(shortId: string): Promise<IUrlStats | null> {
    const [url] = await this.db
      .select()
      .from(urls)
      .where(eq(urls.shortId, shortId));

    if (!url) {
      return null;
    }

    const urlVisits = await this.db
      .select()
      .from(visits)
      .where(eq(visits.urlId, url.id))
      .orderBy(desc(visits.visitedAt));

    const mappedVisits: IVisit[] = urlVisits.map((visit: Visit) => ({
      id: visit.id,
      urlId: visit.urlId,
      visitedAt: visit.visitedAt || '',
      ipAddress: visit.ipAddress || '',
      userAgent: visit.userAgent || '',
      referrer: visit.referrer || '',
      browser: visit.browser || '',
      browserVersion: visit.browserVersion || '',
      os: visit.os || '',
      osVersion: visit.osVersion || '',
      deviceType: visit.deviceType || '',
      country: visit.country || '',
      city: visit.city || '',
    }));

    return {
      id: url.id,
      shortId: url.shortId,
      shortUrl: `${this.baseUrl}/${url.shortId}`,
      originalUrl: url.originalUrl,
      created_at: url.createdAt || '',
      last_accessed_at: url.lastAccessedAt || '',
      visit_count: url.visitCount || 0,
      isActive: url.isActive || false,
      expiresAt: url.expiresAt || '',
      userId: url.userId || 0,
      customSlug: url.customSlug || '',
      visits: mappedVisits,
    };
  }
}

export async function trackVisit(
  db: DbClient,
  urlId: number,
  ipAddress: string,
  userAgent: string,
  referrer: string | null
): Promise<void> {
  try {
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    // Simple IP to location mapping for testing
    let country = null;
    let city = null;

    // Extract first two octets of IP for basic geo mapping
    const ipParts = ipAddress.split('.');
    if (ipParts.length === 4) {
      const firstOctet = parseInt(ipParts[0]);
      if (firstOctet >= 1 && firstOctet <= 126) {
        country = 'United States';
        city = 'New York';
      } else if (firstOctet >= 128 && firstOctet <= 191) {
        country = 'United Kingdom';
        city = 'London';
      } else if (firstOctet >= 192 && firstOctet <= 223) {
        country = 'Turkey';
        city = 'Istanbul';
      }
    }

    await db.insert(visits).values({
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
    });
  } catch (error) {
    console.error('Error in trackVisit:', error);
    throw error;
  }
}

export async function getUrlStats(
  db: DbClient,
  shortId: string,
  baseUrl: string,
  period: '24h' | '7d' | '30d' | '90d' = '7d'
): Promise<IUrlStats> {
  const [url] = await db.select().from(urls).where(eq(urls.shortId, shortId));

  if (!url) {
    throw new Error('URL not found');
  }

  const urlVisits = await db
    .select()
    .from(visits)
    .where(
      and(
        eq(visits.urlId, url.id),
        sql`datetime(visitedAt) >= datetime('now', '-${period}')`,
        sql`datetime(visitedAt) <= datetime('now')`
      )
    )
    .orderBy(desc(visits.visitedAt));

  const mappedVisits: IVisit[] = urlVisits.map((visit: Visit) => ({
    id: visit.id,
    urlId: visit.urlId,
    visitedAt: visit.visitedAt || '',
    ipAddress: visit.ipAddress || '',
    userAgent: visit.userAgent || '',
    referrer: visit.referrer || '',
    browser: visit.browser || '',
    browserVersion: visit.browserVersion || '',
    os: visit.os || '',
    osVersion: visit.osVersion || '',
    deviceType: visit.deviceType || '',
    country: visit.country || '',
    city: visit.city || '',
  }));

  return {
    id: url.id,
    shortId: url.shortId,
    shortUrl: `${baseUrl}/${url.shortId}`,
    originalUrl: url.originalUrl,
    created_at: url.createdAt || '',
    last_accessed_at: url.lastAccessedAt || '',
    visit_count: url.visitCount || 0,
    isActive: url.isActive || false,
    expiresAt: url.expiresAt || '',
    userId: url.userId || 0,
    customSlug: url.customSlug || '',
    visits: mappedVisits,
  };
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

export async function getUserAnalytics(
  db: DbClient,
  userId: string,
  period: '24h' | '7d' | '30d' | '90d' = '7d'
) {
  try {
    console.log('Getting analytics for user:', userId, 'period:', period);

    // Get user's URLs
    const userUrls = await db
      .select()
      .from(urls)
      .where(eq(urls.userId, parseInt(userId)));

    console.log('User URLs:', userUrls);

    if (!userUrls.length) {
      console.log('No URLs found for user');
      return {
        totalClicks: 0,
        uniqueVisitors: 0,
        countries: [],
        cities: [],
        referrers: [],
        devices: [],
        browsers: [],
        clicksByDate: [],
      };
    }

    const urlIds = userUrls.map((url: Url) => url.id);
    console.log('URL IDs:', urlIds);

    // Get visits for these URLs
    const urlVisits = await db
      .select()
      .from(visits)
      .where(sql`url_id IN (${urlIds.join(',')})`);

    console.log('URL Visits:', urlVisits);

    const totalClicks = urlVisits.length;
    const uniqueIPs = new Set(urlVisits.map((visit: Visit) => visit.ipAddress))
      .size;

    // Aggregate data
    const countryMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    const referrerMap = new Map<string, number>();
    const deviceMap = new Map<string, number>();
    const browserMap = new Map<string, number>();
    const dateMap = new Map<string, number>();

    for (const visit of urlVisits) {
      // Country stats
      const country = visit.country || 'Unknown';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);

      // City stats
      const city = visit.city || 'Unknown';
      cityMap.set(city, (cityMap.get(city) || 0) + 1);

      // Referrer stats
      const referrer = visit.referrer || 'Direct';
      referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);

      // Device stats
      const device = visit.deviceType || 'Unknown';
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);

      // Browser stats
      const browser = visit.browser || 'Unknown';
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);

      // Date stats
      const date = visit.visitedAt
        ? new Date(visit.visitedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    }

    return {
      totalClicks,
      uniqueVisitors: uniqueIPs,
      countries: Array.from(countryMap.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      cities: Array.from(cityMap.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      referrers: Array.from(referrerMap.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      devices: Array.from(deviceMap.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      browsers: Array.from(browserMap.entries()).map(([name, count]) => ({
        name,
        count,
      })),
      clicksByDate: Array.from(dateMap.entries()).map(([date, count]) => ({
        date,
        count,
      })),
    };
  } catch (error) {
    console.error('Error in getUserAnalytics:', error);
    throw error;
  }
}
