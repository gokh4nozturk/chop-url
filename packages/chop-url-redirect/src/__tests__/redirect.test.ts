import { describe, expect, it } from 'vitest';
import app from '../index';

interface ShortUrlResponse {
  shortId: string;
  shortUrl: string;
  originalUrl: string;
}

describe('Redirect Service', () => {
  it('should return 404 for non-existent short URLs', async () => {
    const res = await app.request('/non-existent');
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({ message: 'Short URL not found' });
  });

  it('should handle health check endpoint', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ status: 'ok' });
  });

  it('should redirect to original URL', async () => {
    const res = await app.request('/abc123');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://example.com');
  });
});
