import { withOpenAPI } from '@/utils/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { H } from '../../types/hono.types';
import { RouteGroup } from '../../types/route.types';
import { handleError } from '../../utils/error';
import { createRouteGroup } from '../../utils/route-factory';
import {
  approveWaitListUserHandler,
  getWaitListUsersHandler,
} from './handlers';
import {
  approveResponseSchema,
  approveWaitListSchema,
  waitlistUsersResponseSchema,
} from './schemas';

// Waitlist route groups
const waitlistRoutes: RouteGroup[] = [
  {
    prefix: '/waitlist',
    tag: 'WAITLIST',
    description: 'Waitlist management endpoints',
    routes: [
      {
        path: '/',
        method: 'get',
        description: 'Get waitlist users',
        schema: {
          response: waitlistUsersResponseSchema,
        },
        handler: getWaitListUsersHandler,
      },
      {
        path: '/approve',
        method: 'post',
        description: 'Approve waitlist user',
        schema: {
          request: approveWaitListSchema,
          response: approveResponseSchema,
        },
        handler: approveWaitListUserHandler,
      },
    ],
  },
];

// Create base router
const createBaseWaitListRoutes = () => {
  const router = new OpenAPIHono<H>();

  // Register all routes with middleware
  for (const route of waitlistRoutes.flatMap((group) =>
    createRouteGroup(group)
  )) {
    const middlewares = [];

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

export const createWaitListRoutes = withOpenAPI(
  createBaseWaitListRoutes,
  '/api/admin'
);
