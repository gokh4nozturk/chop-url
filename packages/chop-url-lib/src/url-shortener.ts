import { nanoid } from 'nanoid';

/**
 * Generates a short ID for URL shortening
 * @param length Length of the short ID
 * @returns Generated short ID
 */
export function generateShortId(length = 6): string {
  return nanoid(length);
}

/**
 * Validates if a string is a valid URL
 * @param url URL to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * URL shortening options
 */
export interface UrlShortenerOptions {
  customSlug?: string;
  expiresAt?: Date;
  userId?: string;
}

/**
 * Shortened URL response
 */
export interface ShortenedUrl {
  shortId: string;
  originalUrl: string;
  shortUrl: string;
  createdAt: Date;
  expiresAt?: Date;
  userId?: string;
}

/**
 * Creates a shortened URL
 * @param url URL to shorten
 * @param baseUrl Base URL for the shortened URL
 * @param options Additional options
 * @returns Shortened URL details
 */
export function createShortUrl(
  url: string,
  baseUrl: string,
  options: UrlShortenerOptions = {}
): ShortenedUrl {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL');
  }

  if (!isValidUrl(baseUrl)) {
    throw new Error('Invalid base URL');
  }

  const shortId = options.customSlug || generateShortId();
  const shortUrl = new URL(shortId, baseUrl).toString();

  return {
    shortId,
    originalUrl: url,
    shortUrl,
    createdAt: new Date(),
    expiresAt: options.expiresAt,
    userId: options.userId,
  };
}
