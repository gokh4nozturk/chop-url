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

interface RouteMetadata {
  tags?: string[];
  deprecated?: boolean;
  [key: string]: unknown;
}

// Schema registry to store all API schemas
export const schemaRegistry = new Map<string, RouteSchema>();

// Enhanced schema validation type
export interface OpenAPISchemaValidation {
  description?: string;
  example?: unknown;
  deprecated?: boolean;
  required?: boolean;
  nullable?: boolean;
}

// Helper to register a route's schemas with enhanced validation
export const registerSchema = (
  path: string,
  method: Method,
  schema: RouteSchema,
  validation?: OpenAPISchemaValidation
) => {
  const key = `${method.toUpperCase()}:${path}`;

  // Validate schema before registration
  if (schema.request && !('_def' in schema.request)) {
    throw new Error(`Invalid request schema for ${key}`);
  }

  if (schema.response && !('_def' in schema.response)) {
    throw new Error(`Invalid response schema for ${key}`);
  }

  // Add validation metadata if provided
  const enrichedSchema = {
    ...schema,
    validation: {
      description: validation?.description || `${method.toUpperCase()} ${path}`,
      example: validation?.example,
      deprecated: validation?.deprecated || false,
      required: validation?.required || false,
      nullable: validation?.nullable || false,
    },
  };

  schemaRegistry.set(key, enrichedSchema);
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

// Helper to register route schemas with enhanced error handling
export const registerRoute = (
  path: string,
  method: Method,
  description: string,
  schema?: RouteSchema,
  requiresAuth = false,
  validation?: OpenAPISchemaValidation,
  metadata?: RouteMetadata,
  basePath?: string
): RouteConfig => {
  // Validate and register schema if provided
  if (schema) {
    try {
      registerSchema(path, method, schema, validation);
    } catch (error) {
      console.error(`Failed to register schema for ${method} ${path}:`, error);
      throw error;
    }
  }

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
    description: description || `${method.toUpperCase()} ${path}`,
    tags: metadata?.tags || [],
    summary: description || `${method.toUpperCase()} ${path}`,
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

      // Check if route requires authentication
      const requiresAuth = handler.toString().includes('auth()');

      // Get schemas from registry
      const key = `${method.toUpperCase()}:${path}`;
      const schema = schemaRegistry.get(key);

      // Get metadata from route
      const routeWithMetadata = route as { metadata?: RouteMetadata };
      const metadata = routeWithMetadata.metadata || {};

      // Create OpenAPI route with schemas
      const openAPIRoute = registerRoute(
        path,
        method.toLowerCase() as Method,
        (metadata.description as string) ||
          `${method.toUpperCase()} ${fullPath}`,
        schema,
        requiresAuth || !!metadata.requiresAuth,
        {
          description: metadata.description as string,
          deprecated: !!metadata.deprecated,
        },
        {
          ...metadata,
          tags: metadata.tags || [],
        },
        basePath
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
