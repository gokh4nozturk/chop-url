import { withOpenAPI } from '@/utils/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { auth } from '../auth/middleware';
import { H } from '../types/hono.types';
import { RouteGroup } from '../types/route.types';
import { handleError } from '../utils/error';
import { createRouteGroup } from '../utils/route-factory';
import { analyticsHandlers } from './handlers';
import { analyticsSchemas } from './schemas';

// Analytics route groups
const analyticsRoutes: RouteGroup[] = [
  {
    prefix: '/analytics',
    tag: 'EVENTS',
    description: 'Event tracking endpoints',
    routes: [
      {
        path: '/events',
        method: 'post',
        description: 'Track an event',
        schema: {
          request: analyticsSchemas.trackEvent,
          response: analyticsSchemas.success,
        },
        handler: analyticsHandlers.trackEvent,
      },
      {
        path: '/custom-events',
        method: 'post',
        description: 'Create a custom event',
        schema: {
          request: analyticsSchemas.createCustomEvent,
          response: analyticsSchemas.success,
        },
        handler: analyticsHandlers.createCustomEvent,
      },
      {
        path: '/events/:urlId',
        method: 'get',
        description: 'Get events for a URL by ID',
        schema: {
          response: analyticsSchemas.events,
        },
        handler: analyticsHandlers.getEvents,
      },
      {
        path: '/custom-events/:userId',
        method: 'get',
        description: 'Get custom events for a user',
        schema: {
          response: analyticsSchemas.customEvents,
        },
        handler: analyticsHandlers.getCustomEvents,
      },
    ],
  },
  {
    prefix: '/analytics/urls',
    tag: 'URL_ANALYTICS',
    description: 'URL analytics endpoints',
    routes: [
      {
        path: '/:shortId/stats',
        method: 'get',
        description: 'Get statistics for a URL',
        schema: {
          response: analyticsSchemas.urlStats,
        },
        handler: analyticsHandlers.getUrlStats,
      },
      {
        path: '/:shortId/events',
        method: 'get',
        description: 'Get events for a URL',
        schema: {
          response: analyticsSchemas.urlEvents,
        },
        handler: analyticsHandlers.getUrlEvents,
      },
      {
        path: '/url/:urlId/stats',
        method: 'get',
        description: 'Get statistics for a specific URL',
        handler: async (c) => {
          try {
            return await analyticsHandlers.getUrlStats(c);
          } catch (error) {
            return handleError(c, error);
          }
        },
        schema: {
          response: analyticsSchemas.urlStats,
          errors: {
            404: analyticsSchemas.urlNotFoundError,
            400: analyticsSchemas.validationError,
          },
        },
      },
    ],
  },
  {
    prefix: '/analytics/urls',
    tag: 'DETAILED_ANALYTICS',
    description: 'Detailed analytics endpoints',
    routes: [
      {
        path: '/:shortId/geo',
        method: 'get',
        description: 'Get geographic statistics for a URL',
        schema: {
          response: analyticsSchemas.geoStats,
        },
        handler: analyticsHandlers.getGeoStats,
      },
      {
        path: '/:shortId/devices',
        method: 'get',
        description: 'Get device statistics for a URL',
        schema: {
          response: analyticsSchemas.deviceStats,
        },
        handler: analyticsHandlers.getDeviceStats,
      },
      {
        path: '/:shortId/utm',
        method: 'get',
        description: 'Get UTM statistics for a URL',
        schema: {
          response: analyticsSchemas.utmStats,
        },
        handler: analyticsHandlers.getUtmStats,
      },
      {
        path: '/:shortId/clicks',
        method: 'get',
        description: 'Get click history for a URL',
        schema: {
          response: analyticsSchemas.clickHistory,
        },
        handler: analyticsHandlers.getClickHistory,
      },
    ],
  },
  {
    prefix: '/analytics/users',
    tag: 'USER_ANALYTICS',
    description: 'User analytics endpoints',
    routes: [
      {
        path: '/:userId',
        method: 'get',
        description: 'Get analytics for a user',
        requiresAuth: true,
        schema: {
          response: analyticsSchemas.userAnalytics,
        },
        handler: analyticsHandlers.getUserAnalytics,
      },
    ],
  },
];

// Create base router
const createBaseAnalyticsRoutes = () => {
  const router = new OpenAPIHono<H>();

  // Register all routes with middleware
  for (const route of analyticsRoutes.flatMap((group) =>
    createRouteGroup(group)
  )) {
    const middlewares = [];

    // Add authentication middleware if required
    if (route.metadata.requiresAuth) {
      middlewares.push(auth());
    }

    // Add validation middleware if schema exists
    if (route.schema?.request) {
      middlewares.push(zValidator('json', route.schema.request));
    }

    // Register route with error handling
    router[route.method](route.path, ...middlewares, async (c) => {
      try {
        return await route.handler(c);
      } catch (error) {
        return handleError(c, error);
      }
    });
  }

  return router;
};

export const createAnalyticsRoutes = withOpenAPI(createBaseAnalyticsRoutes, '');
