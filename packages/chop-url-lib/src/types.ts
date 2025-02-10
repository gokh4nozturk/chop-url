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
 * Interface for URL visit information
 */
export interface IVisit {
  visitedAt: Date;
  ipAddress: string;
  userAgent: string;
  referrer: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: string | null;
  country: string | null;
  city: string | null;
}

/**
 * Interface for URL statistics
 */
export interface IUrlStats {
  shortId: string;
  originalUrl: string;
  created: Date;
  lastAccessed: Date | null;
  visitCount: number;
  totalVisits: number;
  visits: IVisit[];
}

/**
 * Options for creating a shortened URL
 */
export interface CreateUrlOptions {
  customSlug?: string;
}
