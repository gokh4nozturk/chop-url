import { ChopUrlConfig, UrlInfo, ChopUrlError, ChopUrlErrorCode } from './types';
import { D1Database } from '@cloudflare/workers-types';
import { nanoid } from 'nanoid';

export interface ICreateUrlResponse {
    shortUrl: string;
    originalUrl: string;
    shortId: string;
}

export interface IUrlStats {
    shortId: string;
    originalUrl: string;
    created: Date;
    lastAccessed: Date | null;
    visitCount: number;
    totalVisits: number;
}

export interface IChopUrlConfig {
    db: D1Database;
    baseUrl: string;
    shortIdLength?: number;
}

/**
 * ChopUrl - A URL shortening library
 */
export class ChopUrl {
  private readonly db: D1Database;
  private readonly baseUrl: string;
  private readonly shortIdLength: number;

  constructor(config: IChopUrlConfig) {
    this.db = config.db;
    this.baseUrl = config.baseUrl;
    this.shortIdLength = config.shortIdLength ?? 8;
  }

  /**
   * Creates a short URL for the given original URL
   * @throws {ChopUrlError} If the URL is invalid or database operation fails
   */
  async createShortUrl(originalUrl: string): Promise<ICreateUrlResponse> {
    try {
      const shortId = nanoid(this.shortIdLength);
      
      const stmt = this.db.prepare(
        'INSERT INTO urls (short_id, original_url) VALUES (?, ?)'
      );
      
      console.log('Executing SQL with params:', { shortId, originalUrl });
      await stmt.bind(shortId, originalUrl).run();

      return {
        shortUrl: `${this.baseUrl}/${shortId}`,
        originalUrl,
        shortId
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create short URL');
    }
  }

  /**
   * Retrieves the original URL for a given short ID
   * @throws {ChopUrlError} If the URL is not found or database operation fails
   */
  async getOriginalUrl(shortId: string): Promise<string> {
    try {
      const stmt = this.db.prepare(
        'UPDATE urls SET visit_count = visit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE short_id = ? RETURNING original_url'
      );
      
      const result = await stmt.bind(shortId).first<{ original_url: string }>();

      if (!result) {
        throw new Error('URL not found');
      }

      return result.original_url;
    } catch (error) {
      console.error('Database error:', error);
      if (error instanceof Error && error.message === 'URL not found') {
        throw error;
      }
      throw new Error('Failed to retrieve URL');
    }
  }

  /**
   * Gets detailed information about a shortened URL
   * @throws {ChopUrlError} If the URL is not found or database operation fails
   */
  async getUrlStats(shortId: string): Promise<IUrlStats> {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM urls WHERE short_id = ?'
      );
      
      const result = await stmt.bind(shortId).first<{
        id: number;
        short_id: string;
        original_url: string;
        created_at: string;
        last_accessed_at: string | null;
        visit_count: number;
      }>();

      if (!result) {
        throw new Error('URL not found');
      }

      const visitsStmt = this.db.prepare(
        'SELECT COUNT(*) as total_visits FROM visits WHERE url_id = ?'
      );
      
      const visits = await visitsStmt.bind(result.id).first<{ total_visits: number }>();

      return {
        shortId,
        originalUrl: result.original_url,
        created: new Date(result.created_at),
        lastAccessed: result.last_accessed_at ? new Date(result.last_accessed_at) : null,
        visitCount: result.visit_count,
        totalVisits: visits?.total_visits ?? 0
      };
    } catch (error) {
      console.error('Database error:', error);
      if (error instanceof Error && error.message === 'URL not found') {
        throw error;
      }
      throw new Error('Failed to retrieve URL stats');
    }
  }

  public async logVisit(shortId: string, visitorInfo: { ip: string; userAgent?: string; referrer?: string }): Promise<void> {
    try {
      const stmt = this.db.prepare(
        'SELECT id FROM urls WHERE short_id = ?'
      );
      
      const urlResult = await stmt.bind(shortId).first<{ id: number }>();

      if (!urlResult) {
        throw new Error('URL not found');
      }

      const visitStmt = this.db.prepare(
        'INSERT INTO visits (url_id, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)'
      );
      
      await visitStmt.bind(
        urlResult.id,
        visitorInfo.ip,
        visitorInfo.userAgent ?? null,
        visitorInfo.referrer ?? null
      ).run();
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to log visit');
    }
  }

  public async initializeDatabase(): Promise<void> {
    try {
      const statements = [
        this.db.prepare('CREATE TABLE IF NOT EXISTS urls (id INTEGER PRIMARY KEY AUTOINCREMENT, short_id TEXT UNIQUE NOT NULL, original_url TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_accessed_at DATETIME, visit_count INTEGER DEFAULT 0)'),
        this.db.prepare('CREATE INDEX IF NOT EXISTS idx_urls_short_id ON urls(short_id)'),
        this.db.prepare('CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY AUTOINCREMENT, url_id INTEGER REFERENCES urls(id), visited_at DATETIME DEFAULT CURRENT_TIMESTAMP, ip_address TEXT, user_agent TEXT, referrer TEXT)'),
        this.db.prepare('CREATE INDEX IF NOT EXISTS idx_visits_url_id ON visits(url_id)'),
        this.db.prepare('CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at)')
      ];

      await this.db.batch(statements);
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to initialize database');
    }
  }
} 