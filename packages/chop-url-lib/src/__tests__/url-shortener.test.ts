import { describe, it, expect } from 'vitest';
import { generateShortId, isValidUrl, createShortUrl } from '../url-shortener';

describe('URL Shortener', () => {
  describe('generateShortId', () => {
    it('should generate a string of the specified length', () => {
      const length = 8;
      const shortId = generateShortId(length);
      expect(shortId).toHaveLength(length);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateShortId());
      }
      expect(ids.size).toBe(1000);
    });

    it('should use default length of 6 when no length is specified', () => {
      const shortId = generateShortId();
      expect(shortId).toHaveLength(6);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://sub.domain.com/path?query=1#hash',
        'http://192.168.1.1',
      ];

      for (const url of validUrls) {
        expect(isValidUrl(url)).toBe(true);
      }
    });

    it('should return false for invalid URLs', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'http://',
        'https://',
        'ftp://example.com',
        'javascript:alert(1)',
        'data:text/plain;base64,SGVsbG8=',
      ];

      for (const url of invalidUrls) {
        expect(isValidUrl(url)).toBe(false);
      }
    });
  });

  describe('createShortUrl', () => {
    it('should create a shortened URL with default options', () => {
      const originalUrl = 'https://example.com/long/path';
      const baseUrl = 'https://short.url';
      const result = createShortUrl(originalUrl, baseUrl);

      expect(result.originalUrl).toBe(originalUrl);
      expect(result.shortUrl).toMatch(
        new RegExp(`^${baseUrl}/[A-Za-z0-9_-]{6}$`)
      );
      expect(result.shortId).toHaveLength(6);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should create a shortened URL with custom options', () => {
      const originalUrl = 'https://example.com/long/path';
      const baseUrl = 'https://short.url';
      const options = {
        customSlug: 'custom-slug',
        expiresAt: new Date('2025-01-01'),
        userId: 'user123',
      };

      const result = createShortUrl(originalUrl, baseUrl, options);

      expect(result.originalUrl).toBe(originalUrl);
      expect(result.shortUrl).toBe(`${baseUrl}/${options.customSlug}`);
      expect(result.shortId).toBe(options.customSlug);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.expiresAt).toEqual(options.expiresAt);
      expect(result.userId).toBe(options.userId);
    });

    it('should throw error for invalid original URL', () => {
      expect(() => {
        createShortUrl('not-a-url', 'https://short.url');
      }).toThrow('Invalid URL');
    });

    it('should throw error for invalid base URL', () => {
      expect(() => {
        createShortUrl('https://example.com', 'not-a-url');
      }).toThrow('Invalid base URL');
    });
  });
});
