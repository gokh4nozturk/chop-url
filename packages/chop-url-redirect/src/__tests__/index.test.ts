import type {
  D1Database,
  D1PreparedStatement,
} from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../index';

describe('Redirect Service', () => {
  const testApp = new Hono().route('/', app);

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
      })),
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
    return testApp.fetch(req, env, executionCtx);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const res = await createTestRequest('/health');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'ok' });
    });
  });

  describe('GET /:shortId', () => {
    it('should return 404 for non-existent short URL', async () => {
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
      expect(await res.json()).toEqual({ message: 'Short URL not found' });
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
});
