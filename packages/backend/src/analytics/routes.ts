import { auth } from '@/auth/middleware';
import { H } from '@/types';
import { errorResponseSchemas, handleError } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';

import { analyticsHandlers } from './handlers';
import { analyticsSchemas } from './schemas';

const analyticsRouter = new OpenAPIHono<H>();

analyticsRouter.use('*', auth());

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

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/events/:urlId',
    description: 'Get events for a URL by ID',
    tags: ['Analytics Events'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: analyticsSchemas.events,
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
    return analyticsHandlers.getEvents(c);
  }
);

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
    path: '/custom-events/:userId',
    description: 'Get custom events for a user',
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

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/:shortId/stats',
    description: 'Get statistics for a URL',
    tags: ['Analytics/URL Events Analytics'],
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
    path: '/:shortId/events',
    description: 'Get events for a URL',
    tags: ['Analytics/URL Events Analytics'],
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

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/:shortId/geo',
    description: 'Get geographic statistics for a URL',
    tags: ['Analytics/Detailed Analytics'],
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
    path: '/:shortId/devices',
    description: 'Get device statistics for a URL',
    tags: ['Analytics/Detailed Analytics'],
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
    path: '/:shortId/utm',
    description: 'Get UTM statistics for a URL',
    tags: ['Analytics/Detailed Analytics'],
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
    path: '/:shortId/clicks',
    description: 'Get click history for a URL',
    tags: ['Analytics/Detailed Analytics'],
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

analyticsRouter.openapi(
  createRoute({
    method: 'get',
    path: '/:userId',
    description: 'Get analytics for a user',
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

export default analyticsRouter;
