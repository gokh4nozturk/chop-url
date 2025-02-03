import { ChopUrlConfig, UrlInfo, ChopUrlError, ChopUrlErrorCode } from './types';

/**
 * ChopUrl - A URL shortening library
 */
export class ChopUrl {
  private baseUrl: string;
  private db: D1Database;

  constructor(config: ChopUrlConfig) {
    this.validateConfig(config);
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.db = config.db;
  }

  /**
   * Creates a short URL for the given original URL
   * @throws {ChopUrlError} If the URL is invalid or database operation fails
   */
  async createShortUrl(url: string): Promise<UrlInfo> {
    this.validateUrl(url);
    const shortId = this.generateShortId();
    const now = new Date();

    try {
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
    } catch (error) {
      throw new ChopUrlError(
        'Failed to create short URL',
        ChopUrlErrorCode.DATABASE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Retrieves the original URL for a given short ID
   * @throws {ChopUrlError} If the URL is not found or database operation fails
   */
  async getOriginalUrl(shortId: string): Promise<string> {
    this.validateShortId(shortId);

    try {
      const result = await this.db.prepare(
        `SELECT original_url FROM urls WHERE short_id = ?`
      )
      .bind(shortId)
      .first<{ original_url: string }>();

      if (!result) {
        throw new ChopUrlError(
          'Short URL not found',
          ChopUrlErrorCode.URL_NOT_FOUND,
          { shortId }
        );
      }

      // Increment visit count
      await this.db.prepare(
        `UPDATE urls SET visits = visits + 1 WHERE short_id = ?`
      )
      .bind(shortId)
      .run();

      return result.original_url;
    } catch (error) {
      if (error instanceof ChopUrlError) throw error;
      
      throw new ChopUrlError(
        'Failed to retrieve original URL',
        ChopUrlErrorCode.DATABASE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Gets detailed information about a shortened URL
   * @throws {ChopUrlError} If the URL is not found or database operation fails
   */
  async getUrlInfo(shortId: string): Promise<UrlInfo> {
    this.validateShortId(shortId);

    try {
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
        throw new ChopUrlError(
          'Short URL not found',
          ChopUrlErrorCode.URL_NOT_FOUND,
          { shortId }
        );
      }

      return {
        shortId: result.short_id,
        originalUrl: result.original_url,
        shortUrl: `${this.baseUrl}/${result.short_id}`,
        createdAt: new Date(result.created_at),
        visits: result.visits
      };
    } catch (error) {
      if (error instanceof ChopUrlError) throw error;

      throw new ChopUrlError(
        'Failed to retrieve URL information',
        ChopUrlErrorCode.DATABASE_ERROR,
        { originalError: error }
      );
    }
  }

  private validateConfig(config: ChopUrlConfig): void {
    if (!config.baseUrl) {
      throw new ChopUrlError(
        'Base URL is required',
        ChopUrlErrorCode.INVALID_URL
      );
    }

    try {
      new URL(config.baseUrl);
    } catch {
      throw new ChopUrlError(
        'Invalid base URL',
        ChopUrlErrorCode.INVALID_URL,
        { baseUrl: config.baseUrl }
      );
    }

    if (!config.db) {
      throw new ChopUrlError(
        'Database instance is required',
        ChopUrlErrorCode.DATABASE_ERROR
      );
    }
  }

  private validateUrl(url: string): void {
    if (!url) {
      throw new ChopUrlError(
        'URL is required',
        ChopUrlErrorCode.INVALID_URL
      );
    }

    try {
      new URL(url);
    } catch {
      throw new ChopUrlError(
        'Invalid URL format',
        ChopUrlErrorCode.INVALID_URL,
        { url }
      );
    }
  }

  private validateShortId(shortId: string): void {
    if (!shortId || !/^[a-zA-Z0-9]{7}$/.test(shortId)) {
      throw new ChopUrlError(
        'Invalid short ID format',
        ChopUrlErrorCode.INVALID_SHORT_ID,
        { shortId }
      );
    }
  }

  private generateShortId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from(
      { length: 7 },
      () => chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }
} 