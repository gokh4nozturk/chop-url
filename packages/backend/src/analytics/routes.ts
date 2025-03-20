import { auth } from '@/auth/middleware';
import { Env, Variables } from '@/types';
import { errorResponseSchemas, handleError } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';

import { analyticsHandlers } from './handlers';
import { analyticsSchemas } from './schemas';

const analyticsRouter = new OpenAPIHono<{
  Bindings: Env;
  Variables: Variables;
}>();

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
  async (c) => {
    try {
      // Get user analytics
      const result = await analyticsHandlers.trackEvent(c);

      // Ensure we return with a 200 status code
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
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
  async (c) => {
    try {
      const result = await analyticsHandlers.getEvents(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
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
  async (c) => {
    try {
      const result = await analyticsHandlers.createCustomEvent(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
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
  async (c) => {
    try {
      const result = await analyticsHandlers.getCustomEvents(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
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
  async (c) => {
    try {
      const result = await analyticsHandlers.getUrlStats(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
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
  async (c) => {
    try {
      const result = await analyticsHandlers.getUrlEvents(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
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
  async (c) => {
    try {
      const result = await analyticsHandlers.getGeoStats(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
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
  async (c) => {
    try {
      const result = await analyticsHandlers.getDeviceStats(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
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
  async (c) => {
    try {
      const result = await analyticsHandlers.getUtmStats(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
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
  async (c) => {
    try {
      const result = await analyticsHandlers.getClickHistory(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
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
  async (c) => {
    try {
      const result = await analyticsHandlers.getUserAnalytics(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

export default analyticsRouter;
