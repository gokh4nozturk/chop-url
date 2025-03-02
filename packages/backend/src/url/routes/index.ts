import { withOpenAPI } from '@/utils/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { auth } from '../../auth/middleware';
import { H } from '../../types/hono.types';
import { handleError } from '../../utils/error';
import { createRouteGroup } from '../../utils/route-factory';
import { analyticsRoutes } from './analytics';
import { urlGroupRoutes } from './groups';
import { managementRoutes } from './management';
import { shorteningRoutes } from './shortening';

const createBaseUrlRoutes = () => {
  // Combine all route groups
  const allRoutes = [
    ...shorteningRoutes,
    ...managementRoutes,
    ...analyticsRoutes,
    ...urlGroupRoutes,
  ];

  const router = new OpenAPIHono<H>();

  // Register all routes with middleware
  for (const route of allRoutes.flatMap((group) => createRouteGroup(group))) {
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

export const createUrlRoutes = withOpenAPI(createBaseUrlRoutes, '/api');
