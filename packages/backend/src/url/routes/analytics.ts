import { Context } from 'hono';
import { RouteGroup } from '../../types/route.types';
import { analyticsResponseSchema, urlStatsSchema } from '../schemas';
import { UrlService } from '../service';
import { Period, VALID_PERIODS } from '../types';

export const analyticsRoutes: RouteGroup[] = [
  {
    prefix: '/urls',
    tag: ['URL_STATISTICS'],
    description: 'URL statistics endpoints',
    defaultMetadata: {
      requiresAuth: true,
    },
    routes: [
      {
        path: '/:id/statistics',
        method: 'get',
        description: 'Get statistics for a specific URL',
        handler: async (c: Context) => {
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
            console.error('Error fetching URL stats:', error);
            return c.json({ error: 'Failed to fetch URL stats' }, 500);
          }
        },
        schema: {
          response: urlStatsSchema,
        },
      },
      {
        path: '/statistics',
        method: 'get',
        description: 'Get statistics for all URLs of the authenticated user',
        handler: async (c: Context) => {
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
            console.error('Error fetching URL statistics:', error);
            return c.json({ error: 'Failed to fetch URL statistics' }, 500);
          }
        },
        schema: {
          response: analyticsResponseSchema,
        },
      },
      {
        path: '/statistics/export',
        method: 'get',
        description: 'Export URL statistics data',
        handler: async (c: Context) => {
          try {
            const user = c.get('user');
            const period = (c.req.query('period') as Period) || '7d';

            if (!VALID_PERIODS.includes(period)) {
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
              period
            );

            return c.json(data, 200);
          } catch (error) {
            console.error('Error exporting statistics:', error);
            return c.json({ error: 'Failed to export statistics' }, 500);
          }
        },
        schema: {
          response: analyticsResponseSchema,
        },
      },
    ],
  },
];
