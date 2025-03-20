import { z } from '@hono/zod-openapi';
import { Context } from 'hono';
import { RouteGroup } from '../../types/route.types';
import {
  updateUrlSchema,
  urlEmailValidationErrorSchema,
  urlNotFoundErrorSchema,
  urlResponseSchema,
  urlValidationErrorSchema,
} from '../schemas';
import { UrlService } from '../service';

// Define a schema specifically for the URL list response
const urlListResponseSchema = z
  .array(urlResponseSchema)
  .openapi('UrlListResponse');

// Create an unauthorized error specific to the URL list endpoint
const urlListUnauthorizedSchema = z
  .object({
    code: z.literal('UNAUTHORIZED').openapi({
      example: 'UNAUTHORIZED',
      description: 'Unauthorized error code',
    }),
    message: z.string().openapi({
      example: 'You must be logged in to view your URLs.',
      description: 'Detailed error message',
    }),
  })
  .openapi('UrlListUnauthorizedSchema');

export const managementRoutes: RouteGroup[] = [
  {
    prefix: '/urls',
    tag: 'URL_MANAGEMENT',
    description: 'URL management endpoints',
    defaultMetadata: {
      requiresAuth: true,
    },
    routes: [
      {
        path: '/list',
        method: 'get',
        description: 'Get all URLs for the authenticated user',
        handler: async (c: Context) => {
          try {
            const user = c.get('user');

            const db = c.get('db');

            const urlService = new UrlService(c.env.BASE_URL, db);

            const urls = await urlService.getUserUrls(user.id.toString());

            return c.json(urls, 200);
          } catch (error) {
            console.error('Error fetching URLs:', error);
            return c.json({ error: 'Failed to fetch URLs' }, 500);
          }
        },
        schema: {
          response: urlListResponseSchema,
          errors: {
            401: urlListUnauthorizedSchema,
            400: urlEmailValidationErrorSchema,
            500: z
              .object({
                code: z.literal('INTERNAL_SERVER_ERROR').openapi({
                  example: 'INTERNAL_SERVER_ERROR',
                  description: 'Server error code',
                }),
                message: z.string().openapi({
                  example: 'Failed to fetch URLs',
                  description: 'Error message',
                }),
              })
              .openapi('UrlListServerErrorSchema'),
          },
        },
      },
      {
        path: '/:shortId',
        method: 'get',
        description: 'Get URL details by short ID',
        handler: async (c: Context) => {
          try {
            const { shortId } = c.req.param();
            const user = c.get('user');
            const db = c.get('db');

            const urlService = new UrlService(c.env.BASE_URL, db);
            const url = await urlService.getUrl(shortId);

            if (!url) {
              return c.json({ error: 'URL not found' }, 404);
            }

            return c.json(url, 200);
          } catch (error) {
            console.error('Error fetching URL:', error);
            return c.json({ error: 'Failed to fetch URL' }, 500);
          }
        },
        schema: {
          response: urlResponseSchema,
          errors: {
            404: urlNotFoundErrorSchema,
            401: urlListUnauthorizedSchema,
          },
        },
      },
      {
        path: '/:shortId',
        method: 'patch',
        description: 'Update a URL',
        handler: async (c: Context) => {
          try {
            const shortId = c.req.param('shortId');
            const body = await c.req.json();
            const data = updateUrlSchema.parse(body);
            const user = c.get('user');
            const db = c.get('db');

            const urlService = new UrlService(c.env.BASE_URL, db);
            const url = await urlService.updateUrl(shortId, user.id, data);

            return c.json(url, 200);
          } catch (error) {
            console.error('Error updating URL:', error);

            if (error instanceof Error && error.message === 'URL not found') {
              return c.json({ error: 'URL not found' }, 404);
            }

            return c.json({ error: 'Failed to update URL' }, 500);
          }
        },
        schema: {
          request: updateUrlSchema,
          response: urlResponseSchema,
          errors: {
            400: urlValidationErrorSchema,
            404: urlNotFoundErrorSchema,
            401: urlListUnauthorizedSchema,
          },
        },
      },
      {
        path: '/:shortId',
        method: 'delete',
        description: 'Delete a URL',
        handler: async (c: Context) => {
          try {
            const shortId = c.req.param('shortId');
            const user = c.get('user');
            const db = c.get('db');

            const urlService = new UrlService(c.env.BASE_URL, db);
            await urlService.deleteUrl(shortId, user.id);

            return c.json({ message: 'URL deleted successfully' }, 200);
          } catch (error) {
            console.error('Error deleting URL:', error);

            if (error instanceof Error && error.message === 'URL not found') {
              return c.json({ error: 'URL not found' }, 404);
            }

            return c.json({ error: 'Failed to delete URL' }, 500);
          }
        },
        schema: {
          response: urlResponseSchema,
          errors: {
            404: urlNotFoundErrorSchema,
            401: urlListUnauthorizedSchema,
          },
        },
      },
    ],
  },
];
