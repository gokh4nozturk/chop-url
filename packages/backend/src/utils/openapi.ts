import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';
import { Hono } from 'hono';
import { ErrorCode } from './error';

type Method = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';
type RouteCreator<T = unknown> = () => Hono<T>;

interface RouteSchema {
  request?: z.ZodType;
  response?: z.ZodType;
  errors?: {
    400?: z.ZodType;
    401?: z.ZodType;
    403?: z.ZodType;
    404?: z.ZodType;
    500?: z.ZodType;
    [key: number]: z.ZodType | undefined;
  };
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
    code: z.string().openapi({
      example: 'INTERNAL_SERVER_ERROR',
      description: 'Error code identifying the type of error',
    }),
    message: z.string().openapi({
      example: 'Internal server error occurred.',
      description: 'Human readable error message',
    }),
    details: z.any().optional().openapi({
      description: 'Additional error details, such as validation errors',
      example: null,
    }),
  })
  .openapi('DefaultErrorResponse');

// Common error schemas for reuse
export const validationErrorSchema = z
  .object({
    code: z.literal(ErrorCode.VALIDATION_ERROR).openapi({
      example: ErrorCode.VALIDATION_ERROR,
      description: 'Validation error code',
    }),
    message: z.string().openapi({
      example: 'Invalid request body',
      description: 'Error message',
    }),
    details: z
      .array(
        z.object({
          code: z.string(),
          message: z.string(),
          path: z.array(z.string()),
        })
      )
      .openapi({
        description: 'Validation error details',
        example: [
          {
            code: 'invalid_string',
            message: 'Required',
            path: ['email'],
          },
        ],
      }),
  })
  .openapi('ValidationErrorSchema');

export const unauthorizedErrorSchema = z
  .object({
    code: z
      .enum([
        ErrorCode.UNAUTHORIZED,
        ErrorCode.INVALID_TOKEN,
        ErrorCode.EXPIRED_TOKEN,
      ])
      .openapi({
        example: ErrorCode.UNAUTHORIZED,
        description: 'Authorization error code',
      }),
    message: z.string().openapi({
      example: 'Unauthorized access.',
      description: 'Error message',
    }),
  })
  .openapi('UnauthorizedErrorSchema');

export const forbiddenErrorSchema = z
  .object({
    code: z.literal(ErrorCode.FORBIDDEN).openapi({
      example: ErrorCode.FORBIDDEN,
      description: 'Forbidden error code',
    }),
    message: z.string().openapi({
      example: 'Access forbidden.',
      description: 'Error message',
    }),
  })
  .openapi('ForbiddenErrorSchema');

export const notFoundErrorSchema = z
  .object({
    code: z
      .enum([ErrorCode.RESOURCE_NOT_FOUND, ErrorCode.URL_NOT_FOUND])
      .openapi({
        example: ErrorCode.RESOURCE_NOT_FOUND,
        description: 'Not found error code',
      }),
    message: z.string().openapi({
      example: 'Requested resource not found.',
      description: 'Error message',
    }),
  })
  .openapi('NotFoundErrorSchema');

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
        description:
          'Invalid request - The request was malformed or contained invalid parameters',
        content: {
          'application/json': {
            schema: schema?.errors?.[400] || validationErrorSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized - Authentication is required or has failed',
        content: {
          'application/json': {
            schema: schema?.errors?.[401] || unauthorizedErrorSchema,
          },
        },
      },
      403: {
        description:
          'Forbidden - The authenticated user does not have permission to access the resource',
        content: {
          'application/json': {
            schema: schema?.errors?.[403] || forbiddenErrorSchema,
          },
        },
      },
      404: {
        description: 'Not found - The requested resource could not be found',
        content: {
          'application/json': {
            schema: schema?.errors?.[404] || notFoundErrorSchema,
          },
        },
      },
      500: {
        description:
          'Internal server error - An unexpected error occurred on the server',
        content: {
          'application/json': {
            schema: schema?.errors?.[500] || defaultErrorSchema,
          },
        },
      },
    },
    description: description || `${method.toUpperCase()} ${path}`,
    tags: metadata?.tags || [],
    summary: description || `${method.toUpperCase()} ${path}`,
  };

  // Add custom error status codes if provided
  if (schema?.errors) {
    for (const [statusCode, errorSchema] of Object.entries(schema.errors)) {
      const code = parseInt(statusCode, 10);
      // Skip standard error codes that are already handled
      if (
        code !== 400 &&
        code !== 401 &&
        code !== 403 &&
        code !== 404 &&
        code !== 500 &&
        errorSchema
      ) {
        config.responses[code] = {
          description: `Error ${code}`,
          content: {
            'application/json': {
              schema: errorSchema,
            },
          },
        };
      }
    }
  }

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

    // Register standard error schemas - these are the base schemas
    // Others will be registered from the schema registry below
    openAPIRouter.openAPIRegistry.registerComponent(
      'schemas',
      'ValidationErrorSchema',
      validationErrorSchema.shape
    );

    openAPIRouter.openAPIRegistry.registerComponent(
      'schemas',
      'UnauthorizedErrorSchema',
      unauthorizedErrorSchema.shape
    );

    openAPIRouter.openAPIRegistry.registerComponent(
      'schemas',
      'ForbiddenErrorSchema',
      forbiddenErrorSchema.shape
    );

    openAPIRouter.openAPIRegistry.registerComponent(
      'schemas',
      'NotFoundErrorSchema',
      notFoundErrorSchema.shape
    );

    openAPIRouter.openAPIRegistry.registerComponent(
      'schemas',
      'DefaultErrorResponse',
      defaultErrorSchema.shape
    );

    // Get all schemas from schemaRegistry
    // Search for any custom error schemas and add them
    // Register all custom error schemas defined in each route's schema.errors
    for (const [key, schema] of schemaRegistry.entries()) {
      if (schema.errors) {
        for (const [statusCode, errorSchema] of Object.entries(schema.errors)) {
          if (errorSchema && '_def' in errorSchema) {
            try {
              // @ts-ignore accessing internal properties
              const refId = errorSchema._def.openapi?.refId;
              if (refId) {
                // For all schema types, use ts-ignore to bypass complex type checking
                // @ts-ignore OpenAPI schema compatibility issues
                openAPIRouter.openAPIRegistry.registerComponent(
                  'schemas',
                  refId,
                  // @ts-ignore OpenAPI schema compatibility issues
                  'shape' in errorSchema ? errorSchema.shape : errorSchema
                );
              }
            } catch (error) {
              console.warn(
                `Failed to register error schema for ${key}:${statusCode}`,
                error
              );
            }
          }
        }
      }
    }

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

/**
 * Example usage of custom error schemas:
 *
 * ```typescript
 * // Define a custom error schema for a specific endpoint
 * const customNotFoundSchema = z
 *   .object({
 *     code: z.literal(ErrorCode.URL_NOT_FOUND).openapi({
 *       example: ErrorCode.URL_NOT_FOUND,
 *       description: 'URL not found error',
 *     }),
 *     message: z.string().openapi({
 *       example: 'The requested short URL was not found.',
 *       description: 'Detailed error message',
 *     }),
 *   })
 *   .openapi('CustomUrlNotFoundError');
 *
 * // Use in route definition
 * const routes = {
 *   prefix: '/urls',
 *   routes: [
 *     {
 *       path: '/:id',
 *       method: 'get',
 *       schema: {
 *         response: urlResponseSchema,
 *         errors: {
 *           404: customNotFoundSchema,
 *           400: validationErrorSchema
 *         }
 *       },
 *       handler: getUrlHandler
 *     }
 *   ]
 * };
 * ```
 */
