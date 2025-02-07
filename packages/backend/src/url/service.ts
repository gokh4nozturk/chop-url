import { ChopUrl } from '@chop-url/lib';

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
    return this.db
      .prepare('SELECT * FROM urls WHERE user_id = ? ORDER BY created_at DESC')
      .bind(userId)
      .all();
  }
}
