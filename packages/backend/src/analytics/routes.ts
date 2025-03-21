import { auth } from '@/auth/middleware';
import { H } from '@/types';
import { errorResponseSchemas, handleError } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';

import { analyticsHandlers } from './handlers';
import { analyticsSchemas } from './schemas';

const analyticsRouter = new OpenAPIHono<H>();

analyticsRouter.use('*', auth());

// Track events endpoint
analyticsRouter.openapi(
  createRoute({
    method: 'post',
    path: '/events',
    description: 'Track an event',
    tags: ['Analytics Events'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: analyticsSchemas.trackEvent,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.success,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
    },
  }),
  // @ts-ignore
  (c) => {
    return analyticsHandlers.trackEvent(c);
  }
);

// Custom events endpoints
analyticsRouter.openapi(
  createRoute({
    method: 'post',
    path: '/custom-events',
    description: 'Create a custom event',
    tags: ['Analytics/Custom Events'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: analyticsSchemas.createCustomEvent,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.success,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
    },
  }),
  // @ts-ignore
  (c) => {
    return analyticsHandlers.createCustomEvent(c);
  }
);

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/me/custom-events',
    description: 'Get custom events for the logged-in user',
    tags: ['Analytics/Custom Events'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.customEvents,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
    },
  }),
  // @ts-ignore
  (c) => {
    return analyticsHandlers.getCustomEvents(c);
  }
);

// User analytics endpoints
analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/me',
    description: 'Get analytics for the logged-in user',
    tags: ['Analytics/User Analytics'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.userAnalytics,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
    },
  }),
  // @ts-ignore
  (c) => {
    return analyticsHandlers.getUserAnalytics(c);
  }
);

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/export',
    description: 'Export URL statistics data for the logged-in user',
    tags: ['Analytics'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.analyticsResponse,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
    },
  }),
  // @ts-ignore
  (c) => {
    return analyticsHandlers.exportUrlAnalytics(c);
  }
);

// URL analytics endpoints - consolidated and standardized
analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/urls/:shortId/stats',
    description: 'Get statistics for a URL',
    tags: ['Analytics/URL Stats'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.urlStats,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
    },
  }),
  // @ts-ignore
  (c) => {
    return analyticsHandlers.getUrlStats(c);
  }
);

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/urls/:shortId/events',
    description: 'Get events for a URL',
    tags: ['Analytics/URL Events'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.urlEvents,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
    },
  }),
  // @ts-ignore
  (c) => {
    return analyticsHandlers.getUrlEvents(c);
  }
);

// Detailed URL analytics endpoints
analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/urls/:shortId/geo',
    description: 'Get geographic statistics for a URL',
    tags: ['Analytics/URL Detailed Stats'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.geoStats,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
    },
  }),
  // @ts-ignore
  (c) => {
    return analyticsHandlers.getGeoStats(c);
  }
);

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/urls/:shortId/devices',
    description: 'Get device statistics for a URL',
    tags: ['Analytics/URL Detailed Stats'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.deviceStats,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
    },
  }),
  // @ts-ignore
  (c) => {
    return analyticsHandlers.getDeviceStats(c);
  }
);

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/urls/:shortId/utm',
    description: 'Get UTM statistics for a URL',
    tags: ['Analytics/URL Detailed Stats'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.utmStats,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
    },
  }),
  // @ts-ignore
  (c) => {
    return analyticsHandlers.getUtmStats(c);
  }
);

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/urls/:shortId/clicks',
    description: 'Get click history for a URL',
    tags: ['Analytics/URL Detailed Stats'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.clickHistory,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
    },
  }),
  // @ts-ignore
  (c) => {
    return analyticsHandlers.getClickHistory(c);
  }
);

export default analyticsRouter;
