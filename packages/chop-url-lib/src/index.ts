import { ChopUrlConfig, UrlInfo, ChopUrlError, ChopUrlErrorCode } from './types';
import { D1Database } from '@cloudflare/workers-types';
import { nanoid } from 'nanoid';

export interface ICreateUrlResponse {
  shortUrl: string;
  originalUrl: string;
  shortId: string;
  expiresAt: string | null;
}

interface D1Result<T> {
  results: T[];
  success: boolean;
  error?: string;
}

interface D1UrlResult {
  id: number;
  short_id: string;
  original_url: string;
  custom_slug: string | null;
  expires_at: string | null;
  created_at: string;
  last_accessed_at: string | null;
  visit_count: number;
}

interface D1VisitResult {
  visited_at: string;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
}

export interface IUrlStats {
  visitCount: number;
  lastAccessedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
  visits: {
    visitedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    referrer: string | null;
  }[];
}

export interface IChopUrlConfig {
  db: D1Database;
  baseUrl: string;
  shortIdLength?: number;
}

interface CreateUrlOptions {
  customSlug?: string;
  expiresAt?: string;
}

export class ChopUrl {
  private readonly db: D1Database;
  private readonly baseUrl: string;
  private readonly shortIdLength: number;

  constructor(config: IChopUrlConfig) {
    this.db = config.db;
    this.baseUrl = config.baseUrl;
    this.shortIdLength = config.shortIdLength ?? 8;
  }

  async createShortUrl(originalUrl: string, options?: CreateUrlOptions): Promise<ICreateUrlResponse> {
    const shortId = options?.customSlug || this.generateShortId();
    const expiresAt = options?.expiresAt || null;

    // Check if custom slug is already taken
    if (options?.customSlug) {
      const existing = await this.db
        .prepare('SELECT id FROM urls WHERE custom_slug = ?')
        .bind(options.customSlug)
        .first<{ id: number }>();
      if (existing) {
        throw new Error('Custom slug is already taken');
      }
    }

    try {
      await this.db
        .prepare(
          `INSERT INTO urls (short_id, original_url, custom_slug, expires_at)
           VALUES (?, ?, ?, ?)`
        )
        .bind(shortId, originalUrl, options?.customSlug || null, expiresAt)
        .run();

      return {
        shortUrl: `${this.baseUrl}/${shortId}`,
        originalUrl,
        shortId,
        expiresAt
      };
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create short URL');
    }
  }

  async getOriginalUrl(shortId: string): Promise<string> {
    try {
      const result = await this.db
        .prepare(
          `SELECT original_url, expires_at, id FROM urls 
           WHERE (short_id = ? OR custom_slug = ?)
           AND (expires_at IS NULL OR expires_at > datetime('now'))`
        )
        .bind(shortId, shortId)
        .first<D1UrlResult>();

      if (!result) {
        throw new Error('URL not found');
      }

      // Update visit count and last accessed
      await this.db
        .prepare(
          `UPDATE urls 
           SET visit_count = visit_count + 1,
               last_accessed_at = datetime('now')
           WHERE id = ?`
        )
        .bind(result.id)
        .run();

      // Record visit
      await this.recordVisit(result.id);

      return result.original_url;
    } catch (error) {
      console.error('Database error:', error);
      if (error instanceof Error && error.message === 'URL not found') {
        throw error;
      }
      throw new Error('Failed to retrieve URL');
    }
  }

  async getUrlStats(shortId: string): Promise<IUrlStats> {
    try {
      const urlInfo = await this.db
        .prepare(
          `SELECT visit_count, last_accessed_at, created_at, expires_at
           FROM urls
           WHERE short_id = ? OR custom_slug = ?`
        )
        .bind(shortId, shortId)
        .first<D1UrlResult>();

      if (!urlInfo) {
        throw new Error('URL not found');
      }

      const visits = await this.db
        .prepare(
          `SELECT visited_at, ip_address, user_agent, referrer
           FROM visits v
           JOIN urls u ON v.url_id = u.id
           WHERE u.short_id = ? OR u.custom_slug = ?
           ORDER BY visited_at DESC
           LIMIT 100`
        )
        .bind(shortId, shortId)
        .all<D1VisitResult>();

      return {
        visitCount: urlInfo.visit_count,
        lastAccessedAt: urlInfo.last_accessed_at ? new Date(urlInfo.last_accessed_at) : null,
        createdAt: new Date(urlInfo.created_at),
        expiresAt: urlInfo.expires_at ? new Date(urlInfo.expires_at) : null,
        visits: visits.results.map(v => ({
          visitedAt: new Date(v.visited_at),
          ipAddress: v.ip_address,
          userAgent: v.user_agent,
          referrer: v.referrer
        }))
      };
    } catch (error) {
      console.error('Database error:', error);
      if (error instanceof Error && error.message === 'URL not found') {
        throw error;
      }
      throw new Error('Failed to retrieve URL stats');
    }
  }

  private async recordVisit(urlId: number) {
    await this.db
      .prepare(
        `INSERT INTO visits (url_id, ip_address, user_agent, referrer)
         VALUES (?, ?, ?, ?)`
      )
      .bind(
        urlId,
        null, // In a real app, you'd get these from the request
        null,
        null
      )
      .run();
  }

  private generateShortId(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export class QRCodeGenerator {
  static async toDataURL(text: string): Promise<string> {
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    return apiUrl;
  }
} 