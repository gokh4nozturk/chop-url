import { Context } from 'hono';
import { RouteGroup } from '../../types/route.types';
import { rateLimitHandler } from '../middleware/rate-limit';
import {
  createUrlSchema,
  urlResponseSchema,
  urlValidationErrorSchema,
} from '../schemas';
import { UrlService } from '../service';

export const shorteningRoutes: RouteGroup[] = [
  {
    prefix: '/urls',
    tag: 'URL_SHORTENING',
    description: 'URL shortening operations',
    defaultMetadata: {
      requiresAuth: false,
    },
    routes: [
      {
        path: '/shorten',
        method: 'post',
        description: 'Create a shortened URL',
        handler: async (c: Context) => {
          try {
            const body = await c.req.json();
            const data = createUrlSchema.parse(body);
            const user = c.get('user');
            const db = c.get('db');

            const urlService = new UrlService(c.env.BASE_URL, db);
            const url = await urlService.createShortUrl(
              data.url,
              {
                customSlug: data.customSlug,
                expiresAt: data.expiresAt,
                tags: data.tags,
                groupId: data.groupId,
              },
              user?.id?.toString()
            );

            return c.json(url, 200);
          } catch (error) {
            console.error('Error creating URL:', error);

            if (error instanceof Error) {
              return c.json({ error: error.message }, 400);
            }

            return c.json({ error: 'Failed to create URL' }, 500);
          }
        },
        schema: {
          request: createUrlSchema,
          response: urlResponseSchema,
          errors: {
            400: urlValidationErrorSchema,
          },
        },
      },
      {
        path: '/chop',
        method: 'post',
        schema: {
          request: createUrlSchema,
          response: urlResponseSchema,
          errors: {
            400: urlValidationErrorSchema,
          },
        },
        description: 'Create a shortened URL (alternative endpoint)',
        handler: async (c: Context) => {
          try {
            const body = await c.req.json();
            const data = createUrlSchema.parse(body);
            const user = c.get('user');
            const db = c.get('db');

            const urlService = new UrlService(c.env.BASE_URL, db);
            const url = await urlService.createShortUrl(
              data.url,
              {
                customSlug: data.customSlug,
                expiresAt: data.expiresAt,
                tags: data.tags,
                groupId: data.groupId,
              },
              user?.id?.toString()
            );

            return c.json(url, 200);
          } catch (error) {
            console.error('Error creating URL:', error);

            if (error instanceof Error) {
              return c.json({ error: error.message }, 400);
            }

            return c.json({ error: 'Failed to create URL' }, 500);
          }
        },
      },
    ],
  },
];
