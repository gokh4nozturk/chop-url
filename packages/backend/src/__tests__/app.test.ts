import { ChopUrl } from '@chop-url/lib';
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
} from '@cloudflare/workers-types';
import type { ExecutionContext } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../app.js';
import type { AppType } from '../app.js';

let shouldSimulateDatabaseError = false;
const mockChopUrl = {
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
  let testApp: Hono<AppType>;

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
      ENVIRONMENT: 'test',
    };
    const executionCtx = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    };
    const services = { chopUrl: mockChopUrl };
    const req = new Request(`http://localhost${path}`, options);
    const c = { env, executionCtx, var: { services } };
    return testApp.fetch(req, env, executionCtx);
  };

  beforeEach(() => {
    shouldSimulateDatabaseError = false;
    testApp = app;
    vi.clearAllMocks();
    mockChopUrl.createShortUrl.mockClear();
    mockChopUrl.getOriginalUrl.mockClear();
  });

  it('GET /health should return 200', async () => {
    const res = await createTestRequest('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  describe('POST /shorten', () => {
    it('should return 400 for invalid URL', async () => {
      const res = await createTestRequest('/shorten', {
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
      const res = await createTestRequest('/shorten', {
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

      const res = await createTestRequest('/shorten', {
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

  describe('GET /:shortId', () => {
    it('should redirect to original URL', async () => {
      mockChopUrl.getOriginalUrl.mockResolvedValue('https://example.com');
      const res = await createTestRequest('/abc123');
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('https://example.com');
    });

    it('should return 404 for non-existent URL', async () => {
      mockChopUrl.getOriginalUrl.mockRejectedValue(new Error('URL not found'));
      const res = await createTestRequest('/nonexistent');
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'URL not found' });
    });
  });
});
