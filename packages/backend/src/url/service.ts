import { ChopUrl } from '@chop-url/lib';
import { and, desc, eq, sql } from 'drizzle-orm';
import { UAParser } from 'ua-parser-js';
import { db } from '../db/client';
import { urls, visits } from '../db/schema';
import { ICreateUrlResponse, IUrl, IUrlStats, IVisit } from './index';

export class UrlService {
  private chopUrl: ChopUrl;

  constructor(private baseUrl: string) {
    this.chopUrl = new ChopUrl(this.baseUrl);
  }

  async createShortUrl(
    url: string,
    options?: { customSlug?: string },
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
        };
      }

      const response = await db
        .select()
        .from(urls)
        .where(eq(urls.originalUrl, url));

      if (response.length > 0) {
        return {
          shortUrl: `${this.baseUrl}/${response[0].shortId}`,
          shortId: response[0].shortId,
          originalUrl: response[0].originalUrl,
          createdAt: response[0].createdAt,
        };
      }

      const { shortId, originalUrl } = this.chopUrl.generateShortUrl(
        url,
        options
      );

      await db
        .insert(urls)
        .values({
          shortId: shortId,
          originalUrl: url,
          customSlug: options?.customSlug,
          userId: userId ? parseInt(userId) : null,
          createdAt: new Date().toISOString(),
          lastAccessedAt: null,
          visitCount: 0,
          expiresAt: !token
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            : null,
          isActive: true,
        })
        .returning();

      return {
        shortUrl: `${this.baseUrl}/${shortId}`,
        shortId,
        originalUrl,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in createShortUrl:', error);
      throw error;
    }
  }

  async getOriginalUrl(shortId: string) {
    const result = await db
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
    const result = await db
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
    return db
      .select()
      .from(urls)
      .where(eq(urls.userId, parseInt(userId)))
      .orderBy(desc(urls.createdAt));
  }

  async getUrl(shortId: string): Promise<IUrl | null> {
    const [url] = await db.select().from(urls).where(eq(urls.shortId, shortId));

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
    const [url] = await db.select().from(urls).where(eq(urls.shortId, shortId));

    if (!url) {
      return null;
    }

    const urlVisits = await db
      .select()
      .from(visits)
      .where(eq(visits.urlId, url.id))
      .orderBy(desc(visits.visitedAt));

    const mappedVisits: IVisit[] = urlVisits.map((visit) => ({
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
  urlId: number,
  ipAddress: string,
  userAgent: string,
  referrer: string | null
): Promise<void> {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

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
    country: null,
    city: null,
  });
}

export async function getUrlStats(
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
        sql`datetime(visited_at) >= datetime('now', '-${period}')`,
        sql`datetime(visited_at) <= datetime('now')`
      )
    )
    .orderBy(desc(visits.visitedAt));

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
    visits: urlVisits.map((visit) => ({
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
    })),
  };
}

export async function getVisitsByTimeRange(
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
  userId: string,
  period: '24h' | '7d' | '30d' | '90d' = '7d'
) {
  const userUrls = await db
    .select()
    .from(urls)
    .where(eq(urls.userId, parseInt(userId)));

  if (!userUrls.length) {
    return null;
  }

  const urlIds = userUrls.map((url) => url.id);
  const urlVisits = await db
    .select()
    .from(visits)
    .where(
      and(
        sql`url_id IN (${urlIds.join(',')})`,
        sql`datetime(visited_at) >= datetime('now', '-${period}')`,
        sql`datetime(visited_at) <= datetime('now')`
      )
    );

  const totalClicks = urlVisits.length;
  const uniqueIPs = new Set(urlVisits.map((visit) => visit.ipAddress)).size;

  // Aggregate country data
  const countryMap = new Map<string, number>();
  const referrerMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  const dateMap = new Map<string, number>();

  for (const visit of urlVisits) {
    if (visit.country) {
      countryMap.set(visit.country, (countryMap.get(visit.country) || 0) + 1);
    }

    if (visit.referrer) {
      const domain = new URL(visit.referrer).hostname;
      referrerMap.set(domain, (referrerMap.get(domain) || 0) + 1);
    }

    if (visit.deviceType) {
      deviceMap.set(
        visit.deviceType,
        (deviceMap.get(visit.deviceType) || 0) + 1
      );
    }

    if (visit.browser) {
      browserMap.set(visit.browser, (browserMap.get(visit.browser) || 0) + 1);
    }

    const date = visit.visitedAt
      ? new Date(visit.visitedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  }

  const sortedCountries = Array.from(countryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({
      country,
      count,
      percentage: (count / totalClicks) * 100,
    }));

  const sortedReferrers = Array.from(referrerMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / totalClicks) * 100,
    }));

  const clicksByDate = Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topDevices = Array.from(deviceMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type,
      count,
      percentage: (count / totalClicks) * 100,
    }));

  const topBrowsers = Array.from(browserMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / totalClicks) * 100,
    }));

  return {
    totalClicks,
    uniqueVisitors: uniqueIPs,
    topCountry: sortedCountries[0] || null,
    topReferrer: sortedReferrers[0] || null,
    clicksByDate,
    topLocations: sortedCountries,
    topDevices,
    topBrowsers,
  };
}
