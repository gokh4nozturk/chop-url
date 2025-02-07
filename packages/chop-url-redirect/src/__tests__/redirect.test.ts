import type {
  D1Database,
  D1PreparedStatement,
} from '@cloudflare/workers-types';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../index';

interface ShortUrlResponse {
  shortId: string;
  shortUrl: string;
  originalUrl: string;
}

describe('Redirect Service', () => {
  const mockDb = {
    prepare: vi.fn((query: string) => ({
      bind: vi.fn(() => ({
        first: vi.fn(() => {
          if (query.includes('SELECT')) {
            return { original_url: 'https://example.com' };
          }
          return null;
        }),
        run: vi.fn(),
        all: vi.fn(),
        raw: vi.fn(),
      })),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    })),
  } as unknown as D1Database;

  const createTestRequest = (path: string, options: RequestInit = {}) => {
    const env = {
      DB: mockDb,
      FRONTEND_URL: 'http://localhost:3000',
    };
    const executionCtx = {
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    };
    const req = new Request(`http://localhost${path}`, options);
    return app.fetch(req, env, executionCtx);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 404 for non-existent short URLs', async () => {
    (mockDb.prepare as Mock) = vi.fn(() => ({
      bind: vi.fn(() => ({
        first: vi.fn(() => null),
        run: vi.fn(),
        all: vi.fn(),
        raw: vi.fn(),
      })),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    }));

    const res = await createTestRequest('/non-existent');
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ message: 'Short URL not found' });
  });

  it('should handle health check endpoint', async () => {
    const res = await createTestRequest('/health');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ status: 'ok' });
  });

  it('should redirect to original URL', async () => {
    (mockDb.prepare as Mock) = vi.fn(() => ({
      bind: vi.fn(() => ({
        first: vi.fn(() => ({ original_url: 'https://example.com' })),
        run: vi.fn(),
        all: vi.fn(),
        raw: vi.fn(),
      })),
      first: vi.fn(),
      run: vi.fn(),
      all: vi.fn(),
      raw: vi.fn(),
    }));

    const res = await createTestRequest('/abc123');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://example.com');
  });
});
