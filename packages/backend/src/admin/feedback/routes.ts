import { withOpenAPI } from '@/utils/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { auth } from '../../auth/middleware';
import { H } from '../../types/hono.types';
import { RouteGroup } from '../../types/route.types';
import { handleError } from '../../utils/error';
import { createRouteGroup } from '../../utils/route-factory';
import {
  createFeedbackHandler,
  deleteFeedbackHandler,
  getAllFeedbackHandler,
  getUserFeedbackHandler,
  updateFeedbackPriorityHandler,
  updateFeedbackStatusHandler,
} from './handlers';
import {
  createFeedbackSchema,
  feedbackResponseSchema,
  successResponseSchema,
  updateFeedbackPrioritySchema,
  updateFeedbackStatusSchema,
} from './schemas';

// Feedback route groups
const feedbackRoutes: RouteGroup[] = [
  {
    prefix: '/feedback',
    tag: 'USER_FEEDBACK',
    description: 'User feedback endpoints',
    routes: [
      {
        path: '/submit',
        method: 'post',
        description: 'Submit feedback',
        requiresAuth: true,
        schema: {
          request: createFeedbackSchema,
          response: successResponseSchema,
        },
        handler: createFeedbackHandler,
      },
      {
        path: '/list',
        method: 'get',
        description: 'Get user feedback',
        requiresAuth: true,
        schema: {
          response: feedbackResponseSchema,
        },
        handler: getUserFeedbackHandler,
      },
    ],
  },
  {
    prefix: '/feedback',
    tag: 'ADMIN_FEEDBACK',
    description: 'Admin feedback management endpoints',
    routes: [
      {
        path: '/all',
        method: 'get',
        description: 'Get all feedback',
        requiresAuth: true,
        schema: {
          response: feedbackResponseSchema,
        },
        handler: getAllFeedbackHandler,
      },
      {
        path: '/:id/status',
        method: 'patch',
        description: 'Update feedback status',
        requiresAuth: true,
        schema: {
          request: updateFeedbackStatusSchema,
          response: successResponseSchema,
        },
        handler: updateFeedbackStatusHandler,
      },
      {
        path: '/:id/priority',
        method: 'patch',
        description: 'Update feedback priority',
        requiresAuth: true,
        schema: {
          request: updateFeedbackPrioritySchema,
          response: successResponseSchema,
        },
        handler: updateFeedbackPriorityHandler,
      },
      {
        path: '/:id',
        method: 'delete',
        description: 'Delete feedback',
        requiresAuth: true,
        schema: {
          response: successResponseSchema,
        },
        handler: deleteFeedbackHandler,
      },
    ],
  },
];

// Create base router
const createBaseFeedbackRoutes = () => {
  const router = new OpenAPIHono<H>();

  // Register all routes with middleware
  for (const route of feedbackRoutes.flatMap((group) =>
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

export const createFeedbackRoutes = withOpenAPI(
  createBaseFeedbackRoutes,
  '/api/admin'
);
