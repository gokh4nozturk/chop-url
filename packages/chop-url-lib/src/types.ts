/**
 * Database interface for ChopUrl operations
 */
export interface Database {
  prepare: (query: string) => {
    bind: (...params: unknown[]) => {
      run: () => Promise<unknown>;
      first: <T = unknown>() => Promise<T | undefined>;
      all: <T = unknown>() => Promise<{ results: T[] }>;
    };
  };
}

/**
 * Configuration options for ChopUrl instance
 */
export interface ChopUrlConfig {
  /** Base URL for generating short URLs (e.g., https://example.com) */
  baseUrl: string;
  /** Database instance */
  db: Database;
  shortIdLength?: number;
}

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
  lastAccessedAt: Date;
}

/**
 * Custom error class for ChopUrl operations
 */
export class ChopUrlError extends Error {
  constructor(
    public code: ChopUrlErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ChopUrlError';
  }
}

/**
 * Error codes for ChopUrl operations
 */
export enum ChopUrlErrorCode {
  INVALID_URL = 'INVALID_URL',
  URL_NOT_FOUND = 'URL_NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_SHORT_ID = 'INVALID_SHORT_ID',
  INVALID_BASE_URL = 'INVALID_BASE_URL',
  CUSTOM_SLUG_TAKEN = 'CUSTOM_SLUG_TAKEN',
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
