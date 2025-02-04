/**
 * Configuration options for ChopUrl instance
 */
export interface ChopUrlConfig {
  /** Base URL for generating short URLs (e.g., https://example.com) */
  baseUrl: string;
  /** PostgreSQL Pool instance */
  db: any;
}

/**
 * Information about a shortened URL
 */
export interface UrlInfo {
  /** Generated short ID */
  shortId: string;
  /** Original URL */
  originalUrl: string;
  /** Complete short URL */
  shortUrl: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Number of visits */
  visits: number;
}

/**
 * Custom error class for ChopUrl operations
 */
export class ChopUrlError extends Error {
  constructor(
    message: string,
    public code: ChopUrlErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ChopUrlError';
  }
}

/**
 * Error codes for ChopUrl operations
 */
export enum ChopUrlErrorCode {
  URL_NOT_FOUND = 'URL_NOT_FOUND',
  INVALID_URL = 'INVALID_URL',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_SHORT_ID = 'INVALID_SHORT_ID'
}

declare global {
  /**
   * Cloudflare D1 Database interface
   */
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
  }

  /**
   * Cloudflare D1 Prepared Statement interface
   */
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(): Promise<T | null>;
    run(): Promise<D1Result>;
  }

  /**
   * Cloudflare D1 Query Result interface
   */
  interface D1Result {
    success: boolean;
    error?: string;
    lastRowId?: number;
    changes?: number;
  }
} 