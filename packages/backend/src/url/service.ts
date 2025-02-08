import { ChopUrl } from '@chop-url/lib';
import { D1Database } from '@cloudflare/workers-types';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { urls } from '../db/schema';

export class UrlService {
  private chopUrl: ChopUrl;

  constructor(
    private db: D1Database,
    private baseUrl: string
  ) {
    this.chopUrl = new ChopUrl({
      baseUrl: this.baseUrl,
      db: this.db,
    });
  }

  async createShortUrl(url: string, options?: { customSlug?: string }) {
    return this.chopUrl.createShortUrl(url, options);
  }

  async getOriginalUrl(shortId: string) {
    return this.chopUrl.getOriginalUrl(shortId);
  }

  async getUrlInfo(shortId: string) {
    return this.chopUrl.getUrlInfo(shortId);
  }

  async getUserUrls(userId: string) {
    return db
      .select()
      .from(urls)
      .where(eq(urls.userId, parseInt(userId)))
      .orderBy(urls.createdAt);
  }
}
