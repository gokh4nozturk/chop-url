import { auth } from '@/auth/middleware';
import { Env, Variables } from '@/types';
import { errorResponseSchemas, handleError } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { rateLimitHandler } from '../middleware/rate-limit';
import { createUrlSchema, urlResponseSchema } from '../schemas';
import { UrlService } from '../service';

const shorteningRouter = new OpenAPIHono<{
  Bindings: Env;
  Variables: Variables;
}>();

shorteningRouter.use('*', rateLimitHandler());
shorteningRouter.use('/shorten', auth());

shorteningRouter.openapi(
  createRoute({
    method: 'post',
    path: '/shorten',
    summary: 'Create a shortened URL',
    description: 'Create a shortened URL',
    tags: ['URL Shortening'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: urlResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.serverError,
    },
  }),
  async (c) => {
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
      handleError(c, error);
    }
  }
);

shorteningRouter.openapi(
  createRoute({
    method: 'post',
    path: '/chop',
    summary: 'Create a shortened URL (alternative endpoint)',
    description: 'Create a shortened URL (alternative endpoint)',
    tags: ['URL Shortening'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: urlResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.serverError,
    },
  }),
  async (c) => {
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
      handleError(c, error);
    }
  }
);

export default shorteningRouter;
