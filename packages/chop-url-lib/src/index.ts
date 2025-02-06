import {
  ChopUrlConfig,
  ChopUrlError,
  ChopUrlErrorCode,
  Database,
  IUrlInfo,
} from './types';
import { nanoid } from 'nanoid';
import type { D1Database } from '@cloudflare/workers-types';
import { isValidUrl } from './url-shortener';

export { isValidUrl };

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
}

export class ChopUrl {
  private baseUrl: string;
  private db: D1Database;

  constructor(config: IChopUrlConfig) {
    if (!isValidUrl(config.baseUrl)) {
      throw new Error('Invalid base URL');
    }

    if (!config.db) {
      throw new Error('Database is required');
    }

    // Remove trailing slash from base URL
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.db = config.db;
  }

  async createShortUrl(url: string): Promise<{
    shortId: string;
    originalUrl: string;
    shortUrl: string;
    createdAt: Date;
  }> {
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL');
    }

    const shortId = Math.random().toString(36).substring(2, 8);
    const shortUrl = `${this.baseUrl}/${shortId}`;

    try {
      await this.db
        .prepare('INSERT INTO urls (short_id, original_url) VALUES (?, ?)')
        .bind(shortId, url)
        .run();

      return {
        shortId,
        originalUrl: url,
        shortUrl,
        createdAt: new Date(),
      };
    } catch (error) {
      throw new Error('Database error');
    }
  }

  async getOriginalUrl(shortId: string): Promise<string> {
    if (!shortId) {
      throw new Error('Invalid short ID');
    }

    const result = await this.db
      .prepare('SELECT original_url FROM urls WHERE short_id = ?')
      .bind(shortId)
      .first<{ original_url: string }>();

    if (!result) {
      throw new Error('URL not found');
    }

    return result.original_url;
  }

  async getUrlInfo(shortId: string): Promise<IUrlInfo> {
    if (!shortId) {
      throw new Error('Invalid short ID');
    }

    const result = await this.db
      .prepare(
        'SELECT original_url, created_at, visit_count, last_accessed_at FROM urls WHERE short_id = ?'
      )
      .bind(shortId)
      .first<{
        original_url: string;
        created_at: string;
        visit_count: number;
        last_accessed_at: string;
      }>();

    if (!result) {
      throw new Error('URL not found');
    }

    return {
      originalUrl: result.original_url,
      createdAt: new Date(result.created_at),
      visitCount: result.visit_count,
      lastAccessedAt: new Date(result.last_accessed_at),
    };
  }
}

export const generateQRCode = async (text: string): Promise<string> => {
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    text
  )}`;
  return apiUrl;
};

export const generateTOTP = async (secret: string): Promise<string> => {
  const time = Math.floor(Date.now() / 30000); // 30-second window
  const counter = new ArrayBuffer(8);
  const view = new DataView(counter);
  view.setBigInt64(0, BigInt(time), false);

  const key = await crypto.subtle.importKey(
    'raw',
    base32ToBuffer(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const hmacBuffer = await crypto.subtle.sign('HMAC', key, counter);
  const hmac = new Uint8Array(hmacBuffer);

  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1000000;

  return code.toString().padStart(6, '0');
};

export const verifyTOTP = async (
  code: string,
  secret: string
): Promise<boolean> => {
  const currentCode = await generateTOTP(secret);
  return code === currentCode;
};

const base32ToBuffer = (str: string): Uint8Array => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const binary = str
    .toUpperCase()
    .replace(/[^A-Z2-7]/g, '')
    .split('')
    .map((char) => alphabet.indexOf(char).toString(2).padStart(5, '0'))
    .join('');

  const bytes = new Uint8Array(Math.floor(binary.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(binary.slice(i * 8, (i + 1) * 8), 2);
  }

  return bytes;
};

export * from './types';
