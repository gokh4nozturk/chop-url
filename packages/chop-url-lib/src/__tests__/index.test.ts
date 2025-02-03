import { ChopUrl } from '../index';
import { ChopUrlError, ChopUrlErrorCode } from '../types';

describe('ChopUrl', () => {
  let chopUrl: ChopUrl;
  let mockDb: jest.Mocked<D1Database>;

  beforeEach(() => {
    mockDb = {
      prepare: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<D1Database>;

    chopUrl = new ChopUrl({
      baseUrl: 'https://example.com',
      db: mockDb,
    });
  });

  describe('constructor', () => {
    it('should throw error for invalid base URL', () => {
      expect(() => new ChopUrl({ baseUrl: '', db: mockDb })).toThrow(ChopUrlError);
      expect(() => new ChopUrl({ baseUrl: 'invalid-url', db: mockDb })).toThrow(ChopUrlError);
    });

    it('should throw error for missing database', () => {
      expect(() => new ChopUrl({ baseUrl: 'https://example.com', db: null as unknown as D1Database }))
        .toThrow(ChopUrlError);
    });

    it('should remove trailing slash from base URL', () => {
      const chopUrl = new ChopUrl({
        baseUrl: 'https://example.com/',
        db: mockDb,
      });
      expect(chopUrl['baseUrl']).toBe('https://example.com');
    });
  });

  describe('createShortUrl', () => {
    it('should create a short URL successfully', async () => {
      const mockRun = jest.fn().mockResolvedValue({ success: true });
      mockDb.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnValue({ run: mockRun }),
      } as unknown as D1PreparedStatement);

      const result = await chopUrl.createShortUrl('https://long-url.com');

      expect(result).toEqual({
        shortId: expect.any(String),
        originalUrl: 'https://long-url.com',
        shortUrl: expect.stringMatching(/^https:\/\/example\.com\/[a-zA-Z0-9]{7}$/),
        createdAt: expect.any(Date),
        visits: 0,
      });
    });

    it('should throw error for invalid URL', async () => {
      await expect(chopUrl.createShortUrl('')).rejects.toThrow(ChopUrlError);
      await expect(chopUrl.createShortUrl('invalid-url')).rejects.toThrow(ChopUrlError);
    });

    it('should throw error on database failure', async () => {
      const mockRun = jest.fn().mockRejectedValue(new Error('DB Error'));
      mockDb.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnValue({ run: mockRun }),
      } as unknown as D1PreparedStatement);

      await expect(chopUrl.createShortUrl('https://example.com'))
        .rejects.toThrow(ChopUrlError);
    });
  });

  describe('getOriginalUrl', () => {
    it('should retrieve original URL successfully', async () => {
      const mockFirst = jest.fn().mockResolvedValue({ original_url: 'https://long-url.com' });
      const mockRun = jest.fn().mockResolvedValue({ success: true });
      mockDb.prepare = jest.fn()
        .mockReturnValueOnce({
          bind: jest.fn().mockReturnValue({ first: mockFirst }),
        } as unknown as D1PreparedStatement)
        .mockReturnValueOnce({
          bind: jest.fn().mockReturnValue({ run: mockRun }),
        } as unknown as D1PreparedStatement);

      const result = await chopUrl.getOriginalUrl('abc1234');
      expect(result).toBe('https://long-url.com');
    });

    it('should throw error for invalid short ID', async () => {
      await expect(chopUrl.getOriginalUrl('')).rejects.toThrow(ChopUrlError);
      await expect(chopUrl.getOriginalUrl('abc')).rejects.toThrow(ChopUrlError);
    });

    it('should throw error when URL not found', async () => {
      const mockFirst = jest.fn().mockResolvedValue(null);
      mockDb.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnValue({ first: mockFirst }),
      } as unknown as D1PreparedStatement);

      await expect(chopUrl.getOriginalUrl('abc1234'))
        .rejects.toThrow(new ChopUrlError('Short URL not found', ChopUrlErrorCode.URL_NOT_FOUND));
    });
  });

  describe('getUrlInfo', () => {
    it('should retrieve URL info successfully', async () => {
      const mockFirst = jest.fn().mockResolvedValue({
        short_id: 'abc1234',
        original_url: 'https://long-url.com',
        created_at: '2024-02-01T00:00:00.000Z',
        visits: 42,
      });
      mockDb.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnValue({ first: mockFirst }),
      } as unknown as D1PreparedStatement);

      const result = await chopUrl.getUrlInfo('abc1234');
      expect(result).toEqual({
        shortId: 'abc1234',
        originalUrl: 'https://long-url.com',
        shortUrl: 'https://example.com/abc1234',
        createdAt: new Date('2024-02-01T00:00:00.000Z'),
        visits: 42,
      });
    });

    it('should throw error for invalid short ID', async () => {
      await expect(chopUrl.getUrlInfo('')).rejects.toThrow(ChopUrlError);
      await expect(chopUrl.getUrlInfo('abc')).rejects.toThrow(ChopUrlError);
    });

    it('should throw error when URL not found', async () => {
      const mockFirst = jest.fn().mockResolvedValue(null);
      mockDb.prepare = jest.fn().mockReturnValue({
        bind: jest.fn().mockReturnValue({ first: mockFirst }),
      } as unknown as D1PreparedStatement);

      await expect(chopUrl.getUrlInfo('abc1234'))
        .rejects.toThrow(new ChopUrlError('Short URL not found', ChopUrlErrorCode.URL_NOT_FOUND));
    });
  });
}); 