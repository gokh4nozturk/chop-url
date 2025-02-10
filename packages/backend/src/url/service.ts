import { ChopUrl } from '@chop-url/lib';
import { D1Database } from '@cloudflare/workers-types';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { urls } from '../db/schema';

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
  ): Promise<{
    shortUrl: string;
    shortId: string;
    originalUrl: string;
    createdAt: string | null;
  }> {
    try {
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
          userId: parseInt(userId ?? '0'),
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
      if (error instanceof Error) {
        throw new Error('Failed to create short URL');
      }
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

  async getUrlInfo(shortId: string) {
    const result = await db
      .select()
      .from(urls)
      .where(eq(urls.shortId, shortId))
      .limit(1);

    if (!result.length) {
      throw new Error('URL not found');
    }

    const url = result[0];
    return {
      originalUrl: url.originalUrl,
      createdAt: url.createdAt ? new Date(url.createdAt) : new Date(),
      visitCount: url.visitCount,
      lastAccessedAt: url.lastAccessedAt ? new Date(url.lastAccessedAt) : null,
    };
  }

  async getUserUrls(userId: string) {
    return db
      .select()
      .from(urls)
      .where(eq(urls.userId, parseInt(userId)))
      .orderBy(urls.createdAt);
  }
}
