import { z } from '@hono/zod-openapi';
import { Context } from 'hono';

// HTTP status codes as a type
type HTTPStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 429 | 500;

export enum ErrorCode {
  // Auth related errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_2FA_CODE = 'INVALID_2FA_CODE',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  USER_EXISTS = 'USER_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_PROVIDER = 'INVALID_PROVIDER',
  OAUTH_ERROR = 'OAUTH_ERROR',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  NO_TOKEN = 'NO_TOKEN',

  // Resource related errors
  URL_NOT_FOUND = 'URL_NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Permission related errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Generic errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: unknown;
  status: HTTPStatusCode;
}

const ERROR_DEFINITIONS: Record<ErrorCode, Omit<ErrorResponse, 'code'>> = {
  // Auth errors
  [ErrorCode.USER_NOT_FOUND]: {
    message: 'User not found.',
    status: 404,
  },
  [ErrorCode.INVALID_2FA_CODE]: {
    message: 'Invalid 2FA code.',
    status: 400,
  },
  [ErrorCode.TOO_MANY_ATTEMPTS]: {
    message: 'Too many attempts. Please try again later.',
    status: 429,
  },
  [ErrorCode.INVALID_TOKEN]: {
    message: 'Invalid token.',
    status: 401,
  },
  [ErrorCode.VALIDATION_ERROR]: {
    message: 'Validation error.',
    status: 400,
  },
  [ErrorCode.DATABASE_ERROR]: {
    message: 'Database error occurred.',
    status: 500,
  },
  [ErrorCode.USER_EXISTS]: {
    message: 'User already exists.',
    status: 409,
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    message: 'Invalid credentials.',
    status: 401,
  },
  [ErrorCode.INVALID_PROVIDER]: {
    message: 'Invalid authentication provider.',
    status: 400,
  },
  [ErrorCode.OAUTH_ERROR]: {
    message: 'Authentication error occurred. Please try again.',
    status: 400,
  },
  [ErrorCode.EXPIRED_TOKEN]: {
    message: 'Your session has expired. Please log in again.',
    status: 401,
  },
  [ErrorCode.NO_TOKEN]: {
    message: 'No token provided.',
    status: 401,
  },

  // Resource errors
  [ErrorCode.URL_NOT_FOUND]: {
    message: 'URL not found.',
    status: 404,
  },
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    message: 'Requested resource not found.',
    status: 404,
  },

  // Permission errors
  [ErrorCode.UNAUTHORIZED]: {
    message: 'Unauthorized access.',
    status: 401,
  },
  [ErrorCode.FORBIDDEN]: {
    message: 'Access forbidden.',
    status: 403,
  },

  // Generic errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    message: 'Internal server error occurred.',
    status: 500,
  },
  [ErrorCode.BAD_REQUEST]: {
    message: 'Invalid request.',
    status: 400,
  },
};

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public details?: unknown
  ) {
    super(ERROR_DEFINITIONS[code].message);
    this.name = 'AppError';
  }
}

export const handleError = (c: Context, error: unknown) => {
  console.error('Error:', error);

  if (error instanceof z.ZodError) {
    return c.json(
      {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid request body',
        details: error.errors,
      },
      400 as HTTPStatusCode
    );
  }

  if (error instanceof AppError) {
    const errorDef = ERROR_DEFINITIONS[error.code];
    return c.json(
      {
        code: error.code,
        message: errorDef.message,
        ...(error.details && { details: error.details }),
      },
      errorDef.status as HTTPStatusCode
    );
  }

  // Fallback for unknown errors
  return c.json(
    {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: ERROR_DEFINITIONS[ErrorCode.INTERNAL_SERVER_ERROR].message,
    },
    500 as HTTPStatusCode
  );
};
