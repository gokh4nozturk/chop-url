import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IUser } from '../auth/types.js';
import app from '../index.js';
import type { Env } from '../index.js';

type Variables = {
  user: IUser;
};

let shouldSimulateDatabaseError = false;
const mockChopUrl = {
  generateShortUrl: vi.fn().mockImplementation((url) => {
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
    };
  }),
  getOriginalUrl: vi.fn(),
};

vi.mock('@chop-url/lib', () => ({
  ChopUrl: vi.fn().mockImplementation(() => mockChopUrl),
  isValidUrl: vi.fn().mockImplementation((url) => url !== 'not-a-url'),
}));

type Bindings = {
  DB: D1Database;
};

interface TestResponse {
  shortUrl: string;
  originalUrl: string;
  shortId: string;
  createdAt: string;
}

describe('Backend Service', () => {
  let testApp: Hono<{ Bindings: Env; Variables: Variables }>;

  beforeEach(() => {
    shouldSimulateDatabaseError = false;
    testApp = app;
    vi.clearAllMocks();
    mockChopUrl.generateShortUrl.mockClear();
    mockChopUrl.getOriginalUrl.mockClear();
  });

  const mockDb = {
    prepare: () => ({
      bind: () => ({
        run: async () => ({ success: true }),
        first: async () => null,
        all: async () => ({ results: [] }),
      }),
    }),
  } as unknown as D1Database;

  const createTestRequest = (path: string, options: RequestInit = {}) => {
    const env = {
      DB: mockDb,
      BASE_URL: 'http://localhost:8787',
      ENVIRONMENT: 'test',
    };
    const executionCtx = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    };
    const req = new Request(`http://localhost${path}`, options);
    return testApp.fetch(req, env, executionCtx);
  };

  it('GET /health should return 200', async () => {
    const res = await createTestRequest('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });

  describe('POST /shorten', () => {
    it('should return 400 for invalid URL', async () => {
      const res = await createTestRequest('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: '',
        }),
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
        body: JSON.stringify({
          url: 'https://example.com',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as TestResponse;
      expect(data).toHaveProperty('shortUrl');
      expect(data.originalUrl).toBe('https://example.com');
    });

    it('should return 500 for database errors', async () => {
      shouldSimulateDatabaseError = true;

      const res = await createTestRequest('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
        }),
      });

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Failed to create short URL' });
    });
  });
});
