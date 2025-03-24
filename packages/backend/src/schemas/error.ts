import { z } from 'zod';

// Base error response schema
const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

// Common error response schemas grouped by category
export const errorResponseSchemas = {
  // 400 range errors
  validationError: {
    400: {
      description: 'Invalid request parameters',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },

  authError: {
    401: {
      description: 'Unauthorized - Authentication required',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - Insufficient permissions',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },

  notFoundError: {
    404: {
      description: 'Resource not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },

  // 500 range errors
  serverError: {
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    503: {
      description: 'Service unavailable',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
};

// Error response generator functions
export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
) {
  return {
    code,
    message,
    ...(details && { details }),
  };
}

export function createValidationError(
  message = 'Invalid request parameters',
  details?: unknown
) {
  return createErrorResponse('VALIDATION_ERROR', message, details);
}

export function createAuthenticationError(message = 'Authentication required') {
  return createErrorResponse('AUTHENTICATION_ERROR', message);
}

export function createNotFoundError(
  resource = 'Resource',
  id?: string | number
) {
  const message = id
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;
  return createErrorResponse('NOT_FOUND', message);
}

export function createServerError(message = 'An unexpected error occurred') {
  return createErrorResponse('SERVER_ERROR', message);
}

export function createForbiddenError(message = 'Insufficient permissions') {
  return createErrorResponse('FORBIDDEN', message);
}

export function createRateLimitError(message = 'Rate limit exceeded') {
  return createErrorResponse('RATE_LIMIT', message);
}

// Export the base schema for extension
export const baseErrorSchema = errorResponseSchema;
