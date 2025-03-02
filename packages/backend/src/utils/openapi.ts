import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';
import { Hono } from 'hono';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
type RouteCreator<T = unknown> = () => Hono<T>;

interface RouteSchema {
  request?: z.ZodType;
  response?: z.ZodType;
}

// Schema registry to store all API schemas
export const schemaRegistry = new Map<string, RouteSchema>();

// Helper to register a route's schemas
export const registerSchema = (
  path: string,
  method: Method,
  schema: RouteSchema
) => {
  const key = `${method.toUpperCase()}:${path}`;
  schemaRegistry.set(key, schema);
};

// Default error schema
const defaultErrorSchema = z
  .object({
    error: z.string().openapi({
      example: 'Something went wrong',
      description: 'Error message describing what went wrong',
    }),
  })
  .openapi('DefaultErrorResponse');

// Default success schema
const defaultSuccessSchema = z
  .object({
    success: z.boolean().openapi({
      description: 'Operation success status',
      example: true,
    }),
    data: z.any().optional().openapi({
      description: 'Response data',
      example: null,
    }),
    message: z.string().optional().openapi({
      description: 'Success message',
      example: 'Operation completed successfully',
    }),
  })
  .openapi('SuccessResponse');

// Helper to convert path parameters to OpenAPI format
// e.g., /users/:id -> /users/{id}
const convertPathToOpenAPI = (path: string) => {
  return path.replace(/:(\w+)/g, '{$1}');
};

// Helper to register route schemas
export const registerRoute = (
  path: string,
  method: Method,
  description: string,
  schema?: RouteSchema,
  requiresAuth = false
): RouteConfig => {
  const config: RouteConfig = {
    method,
    path: convertPathToOpenAPI(path),
    request:
      schema?.request && method !== 'get'
        ? {
            body: {
              content: {
                'application/json': {
                  schema: schema.request,
                },
              },
              description: 'Request body',
              required: true,
            },
          }
        : method === 'get' && schema?.request
          ? {
              query: z
                .object({})
                .merge(
                  schema.request instanceof z.ZodObject
                    ? schema.request
                    : z.object({})
                ),
            }
          : undefined,
    responses: {
      200: {
        description: description || 'Successful operation',
        content: {
          'application/json': {
            schema: schema?.response || defaultSuccessSchema,
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
    description,
    tags: [path.split('/')[1].toUpperCase()],
    summary: `${method.toUpperCase()} ${path}`,
  };

  if (requiresAuth) {
    config.security = [{ bearerAuth: [] }];
  }

  return config;
};

// HOC to wrap route creators with OpenAPI documentation
export const withOpenAPI = <T = unknown>(
  routeCreator: RouteCreator<T>,
  basePath: string
) => {
  return () => {
    const originalRouter = routeCreator();
    const openAPIRouter = new OpenAPIHono<T>();

    // Add security scheme configuration
    openAPIRouter.openAPIRegistry.registerComponent(
      'securitySchemes',
      'bearerAuth',
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication',
      }
    );

    // Copy all routes and add OpenAPI documentation
    for (const route of originalRouter.routes) {
      const { method, handler, path } = route;
      const fullPath = `${basePath}${path}`;
      const description = `${method.toUpperCase()} ${fullPath}`;

      // Check if route requires authentication
      const requiresAuth = handler.toString().includes('auth()');

      // Get schemas from registry
      const key = `${method.toUpperCase()}:${path}`;
      const schema = schemaRegistry.get(key);

      // Create OpenAPI route with schemas
      const openAPIRoute = registerRoute(
        path,
        method.toLowerCase() as Method,
        description,
        schema,
        requiresAuth
      );

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
