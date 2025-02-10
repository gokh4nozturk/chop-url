import { beforeEach, describe, expect, it } from 'vitest';
import { ChopUrl } from '../index';

describe('ChopUrl', () => {
  let chopUrl: ChopUrl;

  beforeEach(() => {
    chopUrl = new ChopUrl('https://example.com');
  });

  describe('constructor', () => {
    it('should throw error for invalid base URL', () => {
      expect(() => new ChopUrl('')).toThrow('Invalid base URL');
      expect(() => new ChopUrl('invalid-url')).toThrow('Invalid base URL');
    });
  });

  describe('generateShortUrl', () => {
    it('should create a short URL successfully', () => {
      const result = chopUrl.generateShortUrl('https://long-url.com');

      expect(result.originalUrl).toBe('https://long-url.com');
      expect(result.shortUrl).toMatch(
        /^https:\/\/example\.com\/[A-Za-z0-9]{6}$/
      );
      expect(result.shortId).toHaveLength(6);
    });

    it('should throw error for invalid URL', () => {
      expect(() => chopUrl.generateShortUrl('')).toThrow('Invalid URL');
      expect(() => chopUrl.generateShortUrl('invalid-url')).toThrow(
        'Invalid URL'
      );
    });
  });

  describe('getOriginalUrl', () => {
    it('should throw error for invalid short ID', async () => {
      await expect(chopUrl.getOriginalUrl('')).rejects.toThrow(
        'Invalid short ID'
      );
    });
  });
});
