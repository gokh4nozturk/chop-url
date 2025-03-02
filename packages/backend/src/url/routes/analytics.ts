import { Context } from 'hono';
import { RouteGroup } from '../../types/route.types';
import { analyticsResponseSchema, urlStatsSchema } from '../schemas';
import { UrlService } from '../service';
import { Period, VALID_PERIODS } from '../types';

export const analyticsRoutes: RouteGroup[] = [
  {
    prefix: '/api/analytics',
    tag: 'URL_ANALYTICS',
    description: 'URL analytics endpoints',
    defaultMetadata: {
      requiresAuth: true,
    },
    routes: [
      {
        path: '/:shortId/stats',
        method: 'get',
        description: 'Get URL statistics',
        handler: async (c: Context) => {
          try {
            const { shortId } = c.req.param();
            const { period = '24h' } = c.req.query();
            const db = c.get('db');

            const urlService = new UrlService(c.env.BASE_URL, db);
            const stats = await urlService.getUrlStats(
              shortId,
              period as Period
            );

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
        path: '',
        method: 'get',
        description: 'Get user analytics',
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
            console.error('Error fetching user analytics:', error);
            return c.json({ error: 'Failed to fetch user analytics' }, 500);
          }
        },
        schema: {
          response: analyticsResponseSchema,
        },
      },
      {
        path: '/export',
        method: 'get',
        description: 'Export analytics data',
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
            console.error('Error exporting analytics:', error);
            return c.json({ error: 'Failed to export analytics' }, 500);
          }
        },
        schema: {
          response: analyticsResponseSchema,
        },
      },
    ],
  },
];
