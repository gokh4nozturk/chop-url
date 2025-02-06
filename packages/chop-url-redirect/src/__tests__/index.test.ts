import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import app from '../index';

describe('Redirect Service', () => {
  const testApp = new Hono().route('/', app);

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const res = await testApp.request('/health');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'ok' });
    });
  });

  describe('GET /:shortId', () => {
    it('should return 404 for non-existent short URL', async () => {
      const res = await testApp.request('/non-existent');
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ message: 'Short URL not found' });
    });

    it('should redirect to original URL', async () => {
      // Using the mock KV store value from index.ts
      const res = await testApp.request('/abc123');
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('https://example.com');
    });
  });
});
