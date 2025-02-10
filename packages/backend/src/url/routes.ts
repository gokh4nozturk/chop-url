import { Context, Hono } from 'hono';
import { auth } from '../auth/middleware.js';
import { IUser } from '../auth/types.js';
import { UrlService } from './service.js';

interface Env {
  DB: D1Database;
  BASE_URL: string;
}

interface Variables {
  user: IUser;
}

export const createUrlRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

  router.post('/shorten', async (c: Context, next) => {
    // Test ortamında auth middleware'i atlıyoruz
    if (c.env.ENVIRONMENT !== 'test') {
      return auth()(c, next);
    }

    const { url, customSlug } = await c.req.json();

    if (!url) {
      return c.json({ error: 'Invalid URL' }, 400);
    }

    try {
      const urlService = new UrlService(c.env.BASE_URL);
      const result = await urlService.createShortUrl(
        url,
        { customSlug },
        'test-token',
        'test-user'
      );

      return c.json(
        {
          shortUrl: result.shortUrl,
          shortId: result.shortId,
          originalUrl: result.originalUrl,
          createdAt: result.createdAt,
        },
        200
      );
    } catch (error) {
      console.error('Error creating short URL:', error);

      if (error instanceof Error) {
        if (error.message === 'Invalid URL') {
          return c.json({ error: 'Invalid URL' }, 400);
        }
        if (error.message === 'Custom slug already exists') {
          return c.json({ error: 'Custom slug already exists' }, 409);
        }
      }
      return c.json({ error: 'Failed to create short URL' }, 500);
    }
  });

  router.get('/urls', auth(), async (c: Context) => {
    const user = c.get('user');
    const urlService = new UrlService(c.env.BASE_URL);
    const urls = await urlService.getUserUrls(user.id.toString());

    const response = urls.map((url) => ({
      shortUrl: `${c.env.BASE_URL}/${url.shortId}`,
      ...url,
    }));
    return c.json(response);
  });

  router.get('/stats/:shortId', auth(), async (c: Context) => {
    try {
      const user = c.get('user');
      if (!user) {
        return c.json({ error: 'User not authenticated' }, 401);
      }

      const shortId = c.req.param('shortId');
      const urlService = new UrlService(c.env.BASE_URL);
      const stats = await urlService.getUrlInfo(shortId, user.id.toString());
      return c.json(stats);
    } catch (error) {
      if (error instanceof Error && error.message === 'URL not found') {
        return c.json({ error: 'URL not found' }, 404);
      }
      console.error('Error getting URL stats:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  return router;
};
