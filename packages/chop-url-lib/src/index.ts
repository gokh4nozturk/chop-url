interface ChopUrlConfig {
  baseUrl: string;
  db: D1Database;
}

interface UrlInfo {
  shortId: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: Date;
  visits: number;
}

export class ChopUrl {
  private baseUrl: string;
  private db: D1Database;

  constructor(config: ChopUrlConfig) {
    this.baseUrl = config.baseUrl;
    this.db = config.db;
  }

  async createShortUrl(url: string): Promise<UrlInfo> {
    const shortId = this.generateShortId();
    const now = new Date();

    await this.db.prepare(
      `INSERT INTO urls (short_id, original_url, created_at, visits) 
       VALUES (?, ?, ?, 0)`
    )
    .bind(shortId, url, now.toISOString())
    .run();

    return {
      shortId,
      originalUrl: url,
      shortUrl: `${this.baseUrl}/${shortId}`,
      createdAt: now,
      visits: 0
    };
  }

  async getOriginalUrl(shortId: string): Promise<string> {
    const result = await this.db.prepare(
      `SELECT original_url FROM urls WHERE short_id = ?`
    )
    .bind(shortId)
    .first<{ original_url: string }>();

    if (!result) {
      throw new Error('URL not found');
    }

    // Increment visit count
    await this.db.prepare(
      `UPDATE urls SET visits = visits + 1 WHERE short_id = ?`
    )
    .bind(shortId)
    .run();

    return result.original_url;
  }

  async getUrlInfo(shortId: string): Promise<UrlInfo> {
    const result = await this.db.prepare(
      `SELECT * FROM urls WHERE short_id = ?`
    )
    .bind(shortId)
    .first<{
      short_id: string;
      original_url: string;
      created_at: string;
      visits: number;
    }>();

    if (!result) {
      throw new Error('URL not found');
    }

    return {
      shortId: result.short_id,
      originalUrl: result.original_url,
      shortUrl: `${this.baseUrl}/${result.short_id}`,
      createdAt: new Date(result.created_at),
      visits: result.visits
    };
  }

  private generateShortId(): string {
    // Generate a random 7-character string
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(
      { length: 7 },
      () => chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }
} 