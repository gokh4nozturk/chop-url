import type { D1Database } from '@cloudflare/workers-types';
import { customAlphabet } from 'nanoid';
import { CreateUrlOptions, IChopUrlConfig, IUrlInfo } from './types';

/**
 * Main class for URL shortening and management
 */
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

  async createShortUrl(
    url: string,
    options?: CreateUrlOptions
  ): Promise<{
    shortId: string;
    originalUrl: string;
    shortUrl: string;
    createdAt: Date;
  }> {
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL');
    }

    try {
      let shortId: string;

      if (options?.customSlug) {
        // Custom slug kullanılmak isteniyorsa, önce bu slug'ın kullanılabilir olup olmadığını kontrol et
        const existingUrl = await this.db
          .prepare('SELECT short_id FROM urls WHERE short_id = ?')
          .bind(options.customSlug)
          .first<{ short_id: string }>();

        if (existingUrl) {
          throw new Error('Custom slug is already taken');
        }

        shortId = options.customSlug;
      } else {
        shortId = generateShortId();
      }

      const shortUrl = `${this.baseUrl}/${shortId}`;

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
      if (
        error instanceof Error &&
        error.message === 'Custom slug is already taken'
      ) {
        throw error;
      }
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
        last_accessed_at: string | null;
      }>();

    if (!result) {
      throw new Error('URL not found');
    }

    return {
      originalUrl: result.original_url,
      createdAt: new Date(result.created_at),
      visitCount: result.visit_count,
      lastAccessedAt: result.last_accessed_at
        ? new Date(result.last_accessed_at)
        : null,
    };
  }
}

/**
 * Generates a QR code image URL
 * @param text Text to encode in the QR code
 * @returns URL of the QR code image
 */
export const generateQRCode = async (text: string): Promise<string> => {
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    text
  )}`;
  return apiUrl;
};

/**
 * Generates a TOTP code
 * @param secret TOTP secret
 * @returns TOTP code
 */
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

/**
 * Verifies a TOTP code against the current TOTP code
 * @param code TOTP code to verify
 * @param secret TOTP secret
 * @returns boolean indicating if the code is valid
 */
export const verifyTOTP = async (
  code: string,
  secret: string
): Promise<boolean> => {
  const currentWindow = Math.floor(Date.now() / 30000);

  // Önceki, mevcut ve sonraki zaman pencerelerini kontrol et
  for (let window = -1; window <= 1; window++) {
    const counter = new ArrayBuffer(8);
    const view = new DataView(counter);
    view.setBigInt64(0, BigInt(currentWindow + window), false);

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
    const generatedCode =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      1000000;

    const expectedCode = generatedCode.toString().padStart(6, '0');

    if (code === expectedCode) {
      return true;
    }
  }
  return false;
};

/**
 * Converts a base32 encoded string to a buffer
 * @param str Base32 encoded string
 * @returns Buffer representation of the base32 string
 */
const base32ToBuffer = (str: string): Uint8Array => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedInput = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bits: string[] = [];

  // Her karakteri 5-bit binary'ye çevir
  for (const char of cleanedInput) {
    const value = alphabet.indexOf(char);
    if (value === -1) continue;
    bits.push(value.toString(2).padStart(5, '0'));
  }

  // 8-bit gruplarına böl
  const bytes = new Uint8Array(Math.floor(bits.join('').length / 8));
  const binaryStr = bits.join('');

  for (let i = 0; i < bytes.length; i++) {
    const byte = binaryStr.slice(i * 8, (i + 1) * 8);
    bytes[i] = parseInt(byte, 2);
  }

  return bytes;
};

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
 * Generates a short ID using only alphanumeric characters
 * @param length Length of the short ID
 * @returns Generated short ID
 */
export function generateShortId(length = 6): string {
  const nanoid = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  );
  return nanoid(length);
}

export * from './types';
