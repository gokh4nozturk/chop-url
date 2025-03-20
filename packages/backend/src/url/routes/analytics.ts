import { auth } from '@/auth/middleware';
import { Env, Variables } from '@/types';
import { errorResponseSchemas, handleError } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { analyticsResponseSchema, urlStatsSchema } from '../schemas';
import { UrlService } from '../service';
import { Period, VALID_PERIODS } from '../types';

const analyticsRouter = new OpenAPIHono<{
  Bindings: Env;
  Variables: Variables;
}>();

analyticsRouter.use('*', auth());

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/:id',
    summary: 'Get statistics for a specific URL',
    description: 'Get statistics for a specific URL',
    tags: ['Url Analytics'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: urlStatsSchema,
          },
        },
      },
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.serverError,
    },
  }),
  async (c) => {
    try {
      const { id } = c.req.param();
      const { period = '24h' } = c.req.query();
      const db = c.get('db');

      const urlService = new UrlService(c.env.BASE_URL, db);
      const stats = await urlService.getUrlStats(id, period as Period);

      if (!stats) {
        return c.json({ error: 'URL not found' }, 404);
      }

      return c.json(stats, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/list',
    summary: 'Get statistics for all URLs of the authenticated user',
    description: 'Get statistics for all URLs of the authenticated user',
    tags: ['Url Analytics'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  async (c) => {
    try {
      const user = c.get('user');
      const { period = '7d' } = c.req.query();
      const db = c.get('db');

      const urlService = new UrlService(c.env.BASE_URL, db);
      const analytics = await urlService.getUserAnalytics(
        user.id.toString(),
        period as Period
      );

      return c.json(analytics, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/export',
    summary: 'Export URL statistics data',
    description: 'Export URL statistics data',
    tags: ['Url Analytics'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  async (c) => {
    try {
      const user = c.get('user');
      const { period = '7d' } = c.req.query();

      if (!VALID_PERIODS.includes(period as Period)) {
        return c.json(
          {
            error: 'Invalid period. Valid periods are: 24h, 7d, 30d, 90d',
          },
          400
        );
      }

      const db = c.get('db');

      const urlService = new UrlService(c.env.BASE_URL, db);
      const data = await urlService.getUserAnalytics(
        user.id.toString(),
        period as Period
      );

      return c.json(data, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

export default analyticsRouter;
