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

  console.log(
    '[DEBUG] URL Routes - All route groups:',
    JSON.stringify(
      allRoutes.map((g) => ({
        prefix: g.prefix,
        tag: g.tag,
        routes: g.routes.map((r) => ({ path: r.path, method: r.method })),
      })),
      null,
      2
    )
  );

  const router = new OpenAPIHono<H>();

  // Register all routes with middleware
  for (const route of allRoutes.flatMap((group) => {
    console.log('[DEBUG] Processing route group:', group.prefix, group.tag);
    const routes = createRouteGroup(group);
    console.log(
      '[DEBUG] Routes created:',
      JSON.stringify(
        routes.map((r) => ({ path: r.path, method: r.method })),
        null,
        2
      )
    );
    return routes;
  })) {
    const middlewares = [];

    // Add authentication middleware if required
    if (route.metadata.requiresAuth) {
      middlewares.push(auth());
    }

    // Add validation middleware if schema exists
    if (route.schema?.request) {
      middlewares.push(zValidator('json', route.schema.request));
    }

    console.log(
      `[DEBUG] Registering route: ${route.method.toUpperCase()} ${route.path}`
    );

    // Register route with error handling
    router[route.method](route.path, ...middlewares, async (c) => {
      try {
        console.log(
          `[DEBUG] Route handler called: ${route.method.toUpperCase()} ${
            route.path
          }`
        );
        return await route.handler(c);
      } catch (error) {
        console.error(
          `[DEBUG] Error in route handler: ${route.method.toUpperCase()} ${
            route.path
          }`,
          error
        );
        return handleError(c, error);
      }
    });
  }

  return router;
};

export const createUrlRoutes = withOpenAPI(createBaseUrlRoutes, '');
