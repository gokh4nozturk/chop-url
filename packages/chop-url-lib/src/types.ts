import type { D1Database } from '@cloudflare/workers-types';

/**
 * Information about a shortened URL
 */
export interface IUrlInfo {
  /** Original URL */
  originalUrl: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Number of visits */
  visitCount: number;
  /** Last access timestamp */
  lastAccessedAt: Date | null;
}

/**
 * Response interface for creating a shortened URL
 */
export interface ICreateUrlResponse {
  shortUrl: string;
  originalUrl: string;
  shortId: string;
  expiresAt: string | null;
}

/**
 * Interface for URL statistics
 */
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

/**
 * Configuration interface for ChopUrl instance
 */
export interface IChopUrlConfig {
  db: D1Database;
  baseUrl: string;
  shortIdLength?: number;
}

/**
 * Options for creating a shortened URL
 */
export interface CreateUrlOptions {
  customSlug?: string;
}
