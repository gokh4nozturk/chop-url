import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../index.js';
import { H } from '../types.js';

type Variables = {
  user: {
    id: number;
    email: string;
    name: string;
    isEmailVerified: boolean;
    isTwoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
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

// Path resolution issue fixed, now we can run tests
describe('Backend Service', () => {
  let testApp: Hono<H>;

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
    } as H['Bindings'];
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
});
