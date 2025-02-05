import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChopUrl } from '../index';
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
} from '@cloudflare/workers-types';
import { ChopUrlError, ChopUrlErrorCode } from '../types';

describe('ChopUrl', () => {
  let chopUrl: ChopUrl;
  let mockDb: D1Database;
  let mockPreparedStatement: D1PreparedStatement;

  beforeEach(() => {
    mockPreparedStatement = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn().mockResolvedValue({ success: true } as D1Result),
    } as unknown as D1PreparedStatement;

    mockDb = {
      prepare: vi.fn().mockReturnValue(mockPreparedStatement),
    } as unknown as D1Database;

    chopUrl = new ChopUrl({ baseUrl: 'https://example.com', db: mockDb });
  });

  describe('constructor', () => {
    it('should throw error for invalid base URL', () => {
      expect(() => new ChopUrl({ baseUrl: '', db: mockDb })).toThrow(
        'Invalid base URL'
      );
      expect(() => new ChopUrl({ baseUrl: 'invalid-url', db: mockDb })).toThrow(
        'Invalid base URL'
      );
    });

    it('should throw error for missing database', () => {
      expect(
        () =>
          new ChopUrl({
            baseUrl: 'https://example.com',
            db: null as unknown as D1Database,
          })
      ).toThrow('Database is required');
    });
  });

  describe('createShortUrl', () => {
    it('should create a short URL successfully', async () => {
      const result = await chopUrl.createShortUrl('https://long-url.com');

      expect(result.originalUrl).toBe('https://long-url.com');
      expect(result.shortUrl).toMatch(
        /^https:\/\/example\.com\/[A-Za-z0-9]{6}$/
      );
      expect(result.shortId).toHaveLength(6);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid URL', async () => {
      await expect(chopUrl.createShortUrl('')).rejects.toThrow('Invalid URL');
      await expect(chopUrl.createShortUrl('invalid-url')).rejects.toThrow(
        'Invalid URL'
      );
    });

    it('should throw error on database failure', async () => {
      vi.mocked(mockPreparedStatement.run).mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        chopUrl.createShortUrl('https://example.com')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getOriginalUrl', () => {
    it('should retrieve original URL successfully', async () => {
      vi.mocked(mockPreparedStatement.first).mockResolvedValue({
        original_url: 'https://long-url.com',
      });

      const result = await chopUrl.getOriginalUrl('abc123');
      expect(result).toBe('https://long-url.com');
    });

    it('should throw error for invalid short ID', async () => {
      await expect(chopUrl.getOriginalUrl('')).rejects.toThrow(
        'Invalid short ID'
      );
    });

    it('should throw error when URL not found', async () => {
      vi.mocked(mockPreparedStatement.first).mockResolvedValue(null);

      await expect(chopUrl.getOriginalUrl('abc123')).rejects.toThrow(
        'URL not found'
      );
    });
  });

  describe('getUrlInfo', () => {
    it('should retrieve URL info successfully', async () => {
      const urlInfo = {
        original_url: 'https://long-url.com',
        created_at: '2024-02-01T00:00:00.000Z',
        visit_count: 42,
        last_accessed_at: '2024-02-02T00:00:00.000Z',
      };

      vi.mocked(mockPreparedStatement.first).mockResolvedValue(urlInfo);

      const result = await chopUrl.getUrlInfo('abc123');
      expect(result).toEqual({
        originalUrl: urlInfo.original_url,
        createdAt: new Date(urlInfo.created_at),
        visitCount: urlInfo.visit_count,
        lastAccessedAt: new Date(urlInfo.last_accessed_at),
      });
    });

    it('should throw error for invalid short ID', async () => {
      await expect(chopUrl.getUrlInfo('')).rejects.toThrow('Invalid short ID');
    });

    it('should throw error when URL not found', async () => {
      vi.mocked(mockPreparedStatement.first).mockResolvedValue(null);

      await expect(chopUrl.getUrlInfo('abc123')).rejects.toThrow(
        'URL not found'
      );
    });
  });
});
