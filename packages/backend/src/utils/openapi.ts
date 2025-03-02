import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';
import { Hono } from 'hono';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
type RouteCreator<T = unknown> = () => Hono<T>;

// Default error schema
const defaultErrorSchema = z
  .object({
    error: z.string().openapi({
      example: 'Something went wrong',
      description: 'Error message describing what went wrong',
    }),
  })
  .openapi('DefaultErrorResponse');

// Helper to convert path parameters to OpenAPI format
// e.g., /users/:id -> /users/{id}
const convertPathToOpenAPI = (path: string) => {
  return path.replace(/:(\w+)/g, '{$1}');
};

// Helper to create OpenAPI route from existing route
export const createOpenAPIRoute = (
  path: string,
  method: string,
  description: string
): RouteConfig => {
  return {
    method: method.toLowerCase() as Method,
    path: convertPathToOpenAPI(path),
    responses: {
      200: {
        description: description || 'Successful operation',
        content: {
          'application/json': {
            schema: z.any(),
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: defaultErrorSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: defaultErrorSchema,
          },
        },
      },
      403: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: defaultErrorSchema,
          },
        },
      },
      404: {
        description: 'Not found',
        content: {
          'application/json': {
            schema: defaultErrorSchema,
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: defaultErrorSchema,
          },
        },
      },
    },
    description: description,
    tags: [path.split('/')[1].toUpperCase()], // Use first path segment as tag
  };
};

// HOC to wrap route creators with OpenAPI documentation
export const withOpenAPI = <T = unknown>(
  routeCreator: RouteCreator<T>,
  basePath: string
) => {
  return () => {
    const originalRouter = routeCreator();
    const openAPIRouter = new OpenAPIHono<T>();

    // Copy all routes and add OpenAPI documentation
    for (const route of originalRouter.routes) {
      const { method, handler, path } = route;
      const fullPath = `${basePath}${path}`;
      const description = `${method} ${fullPath}`;

      // Create OpenAPI route
      const openAPIRoute = createOpenAPIRoute(path, method, description);

      // Add route with OpenAPI documentation
      openAPIRouter.openapi(
        openAPIRoute,
        handler as RouteHandler<typeof openAPIRoute>
      );

      // Also add original route to maintain compatibility
      openAPIRouter.on(method, path, handler);
    }

    return openAPIRouter;
  };
};
