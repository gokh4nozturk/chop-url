import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import app from '../app.js';
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
} from '@cloudflare/workers-types';
import type { ExecutionContext } from '@cloudflare/workers-types';
import { ChopUrl } from '@chop-url/lib';

let shouldSimulateDatabaseError = false;

vi.mock('@chop-url/lib', () => ({
  ChopUrl: vi.fn().mockImplementation(() => ({
    createShortUrl: vi.fn().mockImplementation(async (url) => {
      if (url === 'not-a-url') {
        throw new Error('Invalid URL');
      }
      if (shouldSimulateDatabaseError) {
        throw new Error('Database error');
      }
      return {
        shortId: 'abc123',
        originalUrl: url,
        shortUrl: 'https://chop.url/abc123',
        createdAt: new Date(),
      };
    }),
  })),
  isValidUrl: vi.fn().mockImplementation((url) => url !== 'not-a-url'),
}));

type Bindings = {
  DB: D1Database;
};

describe('Backend Service', () => {
  let testApp: Hono<{ Bindings: Bindings }>;
  let mockDb: D1Database;
  let mockPreparedStatement: D1PreparedStatement;

  beforeEach(() => {
    shouldSimulateDatabaseError = false;
    mockPreparedStatement = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
      run: vi.fn().mockResolvedValue({ success: true } as D1Result),
    } as unknown as D1PreparedStatement;

    mockDb = {
      prepare: vi.fn().mockReturnValue(mockPreparedStatement),
    } as unknown as D1Database;

    testApp = app;
  });

  const createTestRequest = (path: string, init?: RequestInit) => {
    const req = new Request(`http://localhost${path}`, init);
    const env = { DB: mockDb };
    const executionContext: ExecutionContext = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
      props: {},
    };
    return testApp.fetch(req, env, executionContext);
  };

  it('GET /health should return 200', async () => {
    const res = await createTestRequest('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  describe('POST /api/shorten', () => {
    it('should return 400 for invalid URL', async () => {
      const res = await createTestRequest('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'not-a-url' }),
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Invalid URL' });
    });

    it('should create a short URL', async () => {
      const res = await createTestRequest('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as { shortUrl: string };
      expect(data).toHaveProperty('shortUrl');
      expect(typeof data.shortUrl).toBe('string');
    });

    it('should return 500 for database errors', async () => {
      shouldSimulateDatabaseError = true;

      const res = await createTestRequest('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Failed to create short URL' });
    });
  });
});
