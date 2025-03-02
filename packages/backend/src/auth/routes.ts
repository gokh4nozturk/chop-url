import { D1Database } from '@cloudflare/workers-types';
import { z } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { Context, Hono } from 'hono';
import { H } from '../url/types';
import {
  registerSchema as registerOpenAPISchema,
  withOpenAPI,
} from '../utils/openapi';
import { auth } from './middleware.js';
import { AuthService } from './service.js';
import {
  AuthError,
  AuthErrorCode,
  IAuthResponse,
  ILoginCredentials,
  IRegisterCredentials,
  IUser,
  OAuthProvider,
} from './types.js';

// Login schema
const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    code: z.string().optional(),
  })
  .openapi('LoginRequest');

const loginResponseSchema = z
  .object({
    token: z.string(),
    user: z
      .object({
        id: z.number(),
        email: z.string().email(),
        name: z.string().optional(),
        emailVerified: z.boolean().optional(),
        twoFactorEnabled: z.boolean().optional(),
      })
      .openapi('User'),
  })
  .openapi('LoginResponse');

// Register schema
const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    name: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .openapi('RegisterRequest');

// Two factor code schema
const twoFactorCodeSchema = z
  .object({
    code: z.string().length(6),
  })
  .openapi('TwoFactorCode');

// Two factor login schema
const twoFactorLoginSchema = z
  .object({
    token: z.string(),
    code: z.string().length(6),
  })
  .openapi('TwoFactorLogin');

// Update profile schema
const updateProfileSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email().optional(),
  })
  .openapi('UpdateProfile');

// Update password schema
const updatePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
    confirmPassword: z.string(),
  })
  .openapi('UpdatePassword');

// Verify email schema
const verifyEmailSchema = z
  .object({
    token: z.string(),
  })
  .openapi('VerifyEmail');

// User profile response schema
const userProfileSchema = z
  .object({
    user: z
      .object({
        id: z.number(),
        email: z.string().email(),
        name: z.string().optional(),
        emailVerified: z.boolean().optional(),
        twoFactorEnabled: z.boolean().optional(),
      })
      .openapi('UserProfile'),
  })
  .openapi('UserProfileResponse');

// Recovery codes response schema
const recoveryCodesSchema = z
  .object({
    recoveryCodes: z.array(z.string()),
  })
  .openapi('RecoveryCodesResponse');

// Two factor setup response schema
const twoFactorSetupSchema = z
  .object({
    success: z.boolean(),
    recoveryCodes: z.array(z.string()),
  })
  .openapi('TwoFactorSetupResponse');

interface Env {
  DB: D1Database;
  FRONTEND_URL: string;
  RESEND_API_KEY: string;
}

interface Variables {
  user: IUser;
}

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AuthErrorCode.USER_NOT_FOUND]: 'User not found.',
  [AuthErrorCode.INVALID_2FA_CODE]: 'Invalid 2FA code.',
  [AuthErrorCode.TOO_MANY_ATTEMPTS]:
    'Too many attempts. Please try again later.',
  [AuthErrorCode.INVALID_TOKEN]: 'Invalid token.',
  [AuthErrorCode.VALIDATION_ERROR]: 'Validation error.',
  [AuthErrorCode.DATABASE_ERROR]: 'Database error occurred.',
  [AuthErrorCode.USER_EXISTS]: 'User already exists.',
  [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials.',
  [AuthErrorCode.INVALID_PROVIDER]: 'Invalid authentication provider.',
  [AuthErrorCode.OAUTH_ERROR]:
    'Authentication error occurred. Please try again.',
  [AuthErrorCode.EXPIRED_TOKEN]:
    'Your session has expired. Please log in again.',
  [AuthErrorCode.NO_TOKEN]: 'No token provided.',
};

// Utility functions
const getClientIp = (c: Context) =>
  c.req.header('cf-connecting-ip') ||
  c.req.header('x-forwarded-for') ||
  '0.0.0.0';

// Route group types
interface RouteGroup {
  prefix: string;
  description: string;
  routes: AuthRouteConfig[];
}

// Route configuration type
interface AuthRouteConfig {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete';
  schema?: {
    request?: z.ZodType;
    response: z.ZodType;
  };
  requiresAuth?: boolean;
  rateLimit?: {
    requests: number;
    window: string;
  };
  description?: string;
}

// Route groups
const authGroups: RouteGroup[] = [
  {
    prefix: '/auth',
    description: 'Basic authentication endpoints',
    routes: [
      {
        path: '/auth/me',
        method: 'get',
        schema: { response: userProfileSchema },
        requiresAuth: true,
        description: 'Get current user profile',
      },
      {
        path: '/auth/login',
        method: 'post',
        schema: {
          request: loginSchema,
          response: loginResponseSchema,
        },
        rateLimit: {
          requests: 5,
          window: '5m',
        },
        description: 'Login with email and password',
      },
      {
        path: '/auth/register',
        method: 'post',
        schema: {
          request: registerSchema,
          response: loginResponseSchema,
        },
        rateLimit: {
          requests: 3,
          window: '10m',
        },
        description: 'Register new user',
      },
    ],
  },
  {
    prefix: '/auth/2fa',
    description: 'Two-factor authentication endpoints',
    routes: [
      {
        path: '/auth/setup-2fa',
        method: 'post',
        schema: {
          response: z
            .object({
              qrCode: z.string(),
              secret: z.string(),
            })
            .openapi('TwoFactorSetupInitResponse'),
        },
        requiresAuth: true,
        description: 'Initialize 2FA setup',
      },
      {
        path: '/auth/verify-2fa-setup',
        method: 'post',
        schema: {
          request: twoFactorCodeSchema,
          response: twoFactorSetupSchema,
        },
        requiresAuth: true,
        rateLimit: {
          requests: 3,
          window: '5m',
        },
        description: 'Verify 2FA setup',
      },
      {
        path: '/auth/recovery-codes',
        method: 'get',
        schema: { response: recoveryCodesSchema },
        requiresAuth: true,
        description: 'Get 2FA recovery codes',
      },
      {
        path: '/auth/verify-2fa',
        method: 'post',
        schema: {
          request: twoFactorLoginSchema,
          response: loginResponseSchema,
        },
        rateLimit: {
          requests: 3,
          window: '5m',
        },
        description: 'Verify 2FA code during login',
      },
      {
        path: '/auth/enable-2fa',
        method: 'post',
        schema: {
          request: twoFactorCodeSchema,
          response: z
            .object({ success: z.boolean() })
            .openapi('TwoFactorEnableResponse'),
        },
        requiresAuth: true,
        description: 'Enable 2FA',
      },
      {
        path: '/auth/disable-2fa',
        method: 'post',
        schema: {
          request: twoFactorCodeSchema,
          response: z
            .object({ success: z.boolean() })
            .openapi('TwoFactorDisableResponse'),
        },
        requiresAuth: true,
        description: 'Disable 2FA',
      },
    ],
  },
  {
    prefix: '/auth/profile',
    description: 'User profile management endpoints',
    routes: [
      {
        path: '/auth/profile',
        method: 'put',
        schema: {
          request: updateProfileSchema,
          response: userProfileSchema,
        },
        requiresAuth: true,
        description: 'Update user profile',
      },
      {
        path: '/auth/password',
        method: 'put',
        schema: {
          request: updatePasswordSchema,
          response: z
            .object({ success: z.boolean() })
            .openapi('PasswordUpdateResponse'),
        },
        requiresAuth: true,
        rateLimit: {
          requests: 3,
          window: '10m',
        },
        description: 'Update password',
      },
    ],
  },
  {
    prefix: '/auth/email',
    description: 'Email verification endpoints',
    routes: [
      {
        path: '/auth/verify-email',
        method: 'post',
        schema: {
          request: verifyEmailSchema,
          response: z
            .object({ message: z.string() })
            .openapi('EmailVerificationResponse'),
        },
        requiresAuth: true,
        description: 'Verify email address',
      },
      {
        path: '/auth/resend-verification-email',
        method: 'post',
        schema: {
          response: z
            .object({ message: z.string() })
            .openapi('ResendVerificationResponse'),
        },
        requiresAuth: true,
        rateLimit: {
          requests: 2,
          window: '10m',
        },
        description: 'Resend verification email',
      },
    ],
  },
  {
    prefix: '/auth/oauth',
    description: 'OAuth authentication endpoints',
    routes: [
      {
        path: '/auth/oauth/:provider',
        method: 'get',
        description: 'Initiate OAuth flow',
      },
      {
        path: '/auth/oauth/:provider/callback',
        method: 'get',
        description: 'Handle OAuth callback',
      },
    ],
  },
  {
    prefix: '/auth/password-reset',
    description: 'Password reset endpoints',
    routes: [
      {
        path: '/auth/request-password-reset',
        method: 'post',
        schema: {
          request: z
            .object({ email: z.string().email() })
            .openapi('PasswordResetRequestSchema'),
          response: z
            .object({ message: z.string() })
            .openapi('PasswordResetRequestResponse'),
        },
        rateLimit: {
          requests: 3,
          window: '15m',
        },
        description: 'Request password reset',
      },
      {
        path: '/auth/reset-password',
        method: 'put',
        schema: {
          request: z
            .object({
              token: z.string(),
              newPassword: z.string().min(8),
              confirmPassword: z.string(),
            })
            .openapi('PasswordResetSchema'),
          response: z
            .object({ message: z.string() })
            .openapi('PasswordResetResponse'),
        },
        rateLimit: {
          requests: 3,
          window: '15m',
        },
        description: 'Reset password with token',
      },
    ],
  },
  {
    prefix: '/auth/waitlist',
    description: 'Waitlist management endpoints',
    routes: [
      {
        path: '/auth/waitlist',
        method: 'post',
        schema: {
          request: z
            .object({
              email: z.string().email(),
              name: z.string(),
              company: z.string().optional(),
              useCase: z.string().optional(),
            })
            .openapi('WaitlistRequestSchema'),
          response: z
            .object({
              id: z.number(),
              email: z.string(),
              name: z.string(),
              company: z.string().optional(),
              useCase: z.string().optional(),
              createdAt: z.string(),
            })
            .openapi('WaitlistResponse'),
        },
        description: 'Join waitlist',
      },
      {
        path: '/auth/waitlist/:email',
        method: 'get',
        schema: {
          response: z
            .object({
              id: z.number(),
              email: z.string(),
              name: z.string(),
              company: z.string().optional(),
              useCase: z.string().optional(),
              createdAt: z.string(),
            })
            .openapi('WaitlistEntryResponse'),
        },
        description: 'Get waitlist entry',
      },
    ],
  },
];

// Update references to RouteConfig and RouteHandler
const authRoutes: AuthRouteConfig[] = authGroups.flatMap(
  (group) => group.routes
);

// Register schemas for all routes
const registerAuthSchemas = () => {
  for (const group of authGroups) {
    for (const route of group.routes) {
      if (route.schema) {
        registerOpenAPISchema(route.path, route.method, {
          request: route.schema.request,
          response: route.schema.response,
        });
      }
    }
  }
};

// Handler type for route implementations
type AuthRouteHandler = (c: Context, service: AuthService) => Promise<Response>;

// Centralized error handler
const handleError = (c: Context, error: unknown) => {
  console.error('Error:', error);

  if (error instanceof AuthError) {
    return c.json(
      {
        error: ERROR_MESSAGES[error.code] || error.message,
      },
      error.code === AuthErrorCode.INVALID_CREDENTIALS ? 401 : 400
    );
  }

  return c.json(
    {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    },
    500
  );
};

// Service factory to avoid repetition
const createAuthService = (c: Context) => {
  return new AuthService(c.get('db'), {
    resendApiKey: c.env.RESEND_API_KEY,
    frontendUrl: c.env.FRONTEND_URL,
    googleClientId: c.env.GOOGLE_CLIENT_ID,
    googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
    githubClientId: c.env.GITHUB_CLIENT_ID,
    githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
  });
};

// Route handler implementations
const handlers: Record<string, AuthRouteHandler> = {
  '/auth/me': async (c) => {
    const user = c.get('user');
    return c.json({ user });
  },

  '/auth/login': async (c, service) => {
    const { email, password } = await c.req.json<ILoginCredentials>();
    const response = await service.login({ email, password });
    return c.json(response);
  },

  '/auth/register': async (c, service) => {
    const data = await c.req.json<z.infer<typeof registerSchema>>();
    const credentials: IRegisterCredentials = {
      email: data.email,
      password: data.password,
      name: data.name,
      confirmPassword: data.confirmPassword,
    };
    const response = await service.register(credentials);
    return c.json(response);
  },

  '/auth/setup-2fa': async (c, service) => {
    const user = c.get('user');
    const response = await service.setupTwoFactor(user.id);
    return c.json(response);
  },

  '/auth/verify-2fa-setup': async (c, service) => {
    const { code } = await c.req.json();
    const user = c.get('user');
    const ipAddress = getClientIp(c);

    const recoveryCodes = await service.verifyTwoFactorSetup(
      user.id,
      code,
      ipAddress
    );
    return c.json({ success: true, recoveryCodes });
  },

  '/auth/recovery-codes': async (c, service) => {
    const user = c.get('user');
    const codes = await service.getRecoveryCodes(user.id);
    return c.json({ recoveryCodes: codes });
  },

  '/auth/verify-2fa': async (c, service) => {
    const { email, code } = await c.req.json();
    const ipAddress = getClientIp(c);

    const result = await service.verifyTwoFactorLogin(email, code, ipAddress);
    return c.json(result);
  },

  '/auth/enable-2fa': async (c, service) => {
    const { code } = await c.req.json();
    const user = c.get('user');
    const ipAddress = getClientIp(c);

    await service.enableTwoFactor(user.id, code, ipAddress);
    return c.json({ success: true });
  },

  '/auth/disable-2fa': async (c, service) => {
    const { code } = await c.req.json();
    const user = c.get('user');
    const ipAddress = getClientIp(c);

    await service.disableTwoFactor(user.id, code, ipAddress);
    return c.json({ success: true });
  },

  '/auth/profile': async (c, service) => {
    const user = c.get('user');
    const data = await c.req.json();
    const updatedUser = await service.updateProfile(user.id, data);
    return c.json({ user: updatedUser });
  },

  '/auth/password': async (c, service) => {
    const user = c.get('user');
    const data = await c.req.json();
    const ipAddress = getClientIp(c);
    await service.updatePassword(user.id, data, ipAddress);
    return c.json({ success: true });
  },

  '/auth/verify-email': async (c, service) => {
    const { token } = await c.req.json();
    const userId = c.get('user').id;
    await service.verifyEmail(token, userId);
    return c.json({ message: 'Email verified successfully' });
  },

  '/auth/resend-verification-email': async (c, service) => {
    if (!c.env.RESEND_API_KEY) {
      throw new Error('Email service configuration error');
    }
    const user = c.get('user');
    await service.resendVerificationEmail(user.id);
    return c.json({ message: 'Verification email sent successfully' });
  },

  '/auth/oauth/:provider': async (c, service) => {
    const provider = c.req.param('provider');
    const authUrl = await service.getOAuthUrl(provider as OAuthProvider);
    return c.redirect(authUrl);
  },

  '/auth/oauth/:provider/callback': async (c, service) => {
    const provider = c.req.param('provider');
    const code = c.req.query('code');

    if (!code) {
      throw new Error('Authorization code is missing');
    }

    const response = await service.handleOAuthCallback(
      provider as OAuthProvider,
      code
    );
    return c.redirect(
      `${c.env.FRONTEND_URL}/auth/callback?token=${response.token}`
    );
  },

  '/auth/request-password-reset': async (c, service) => {
    const { email } = await c.req.json();
    await service.requestPasswordReset(email);
    return c.json({ message: 'Password reset request sent' });
  },

  '/auth/reset-password': async (c, service) => {
    const { token, newPassword, confirmPassword } = await c.req.json();
    await service.resetPassword(token, newPassword, confirmPassword);
    return c.json({ message: 'Password reset successful' });
  },

  '/auth/waitlist': async (c, service) => {
    const { email, name, company, useCase } = await c.req.json();
    const waitlistEntry = await service.addToWaitlist({
      email,
      name,
      company,
      useCase,
    });
    return c.json(waitlistEntry);
  },

  '/auth/waitlist/:email': async (c, service) => {
    const email = c.req.param('email');
    const waitlistEntry = await service.getWaitlistEntry(email);

    if (!waitlistEntry) {
      throw new AuthError(
        AuthErrorCode.USER_NOT_FOUND,
        'Waitlist entry not found'
      );
    }

    return c.json(waitlistEntry);
  },
};

// Higher-order function to wrap handlers with error handling and service creation
const withErrorHandling = (handler: AuthRouteHandler) => {
  return async (c: Context) => {
    try {
      const service = createAuthService(c);
      return await handler(c, service);
    } catch (error) {
      return handleError(c, error);
    }
  };
};

// Rate limiting middleware
const createRateLimiter = (config: AuthRouteConfig['rateLimit']) => {
  if (!config) return null;

  const limits = new Map<string, { count: number; resetAt: number }>();
  const windowMs = parseTimeWindow(config.window);

  return async (c: Context, next: () => Promise<void>) => {
    const ip = getClientIp(c);
    const now = Date.now();
    const key = `${ip}:${c.req.path}`;

    const limit = limits.get(key);

    if (limit) {
      // Reset counter if window has passed
      if (now > limit.resetAt) {
        limit.count = 0;
        limit.resetAt = now + windowMs;
      }

      // Check if limit exceeded
      if (limit.count >= config.requests) {
        return c.json(
          {
            error: 'Too many requests',
            resetAt: new Date(limit.resetAt).toISOString(),
          },
          429
        );
      }

      limit.count++;
    } else {
      limits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
    }

    // Clean up old entries periodically
    if (Math.random() < 0.1) {
      // 10% chance to clean up
      for (const [key, value] of limits.entries()) {
        if (now > value.resetAt) {
          limits.delete(key);
        }
      }
    }

    return next();
  };
};

// Helper to parse time window string (e.g., '5m', '1h') to milliseconds
const parseTimeWindow = (window: string): number => {
  const value = parseInt(window);
  const unit = window.slice(-1);

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid time window unit: ${unit}`);
  }
};

// Logging types and utilities
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  method: string;
  path: string;
  ip: string;
  duration: number;
  status: number;
  error?: string;
  userId?: number;
  message?: string;
}

const createLogger = () => {
  return {
    log: (entry: LogEntry) => {
      // In production, you might want to send this to a logging service
      console.log(JSON.stringify(entry));
    },
  };
};

const logger = createLogger();

// Logging middleware
const withLogging = (handler: AuthRouteHandler) => {
  return async (c: Context, service: AuthService) => {
    const startTime = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    const ip = getClientIp(c);

    try {
      const response = await handler(c, service);

      // Log successful request
      logger.log({
        timestamp: new Date().toISOString(),
        level: 'info',
        method,
        path,
        ip,
        duration: Date.now() - startTime,
        status: response.status,
        userId: c.get('user')?.id,
        message: 'Request completed successfully',
      });

      return response;
    } catch (error) {
      // Log error
      logger.log({
        timestamp: new Date().toISOString(),
        level: 'error',
        method,
        path,
        ip,
        duration: Date.now() - startTime,
        status: error instanceof AuthError ? 400 : 500,
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: c.get('user')?.id,
        message: 'Request failed',
      });

      throw error;
    }
  };
};

// Higher-order function to wrap handlers with all middleware
const withMiddleware = (handler: AuthRouteHandler) => {
  return withErrorHandling(withLogging(handler));
};

const createBaseAuthRoutes = () => {
  registerAuthSchemas();
  const router = new Hono<H>();

  // Register routes based on configuration
  for (const route of authRoutes) {
    const handler = handlers[route.path];
    if (!handler) continue;

    const middlewares = [];

    // Add authentication middleware if required
    if (route.requiresAuth) {
      middlewares.push(auth());
    }

    // Add rate limiting middleware if configured
    const rateLimiter = createRateLimiter(route.rateLimit);
    if (rateLimiter) {
      middlewares.push(rateLimiter);
    }

    // Add validation middleware if schema exists
    if (route.schema?.request) {
      middlewares.push(zValidator('json', route.schema.request));
    }

    // Register route with all middlewares
    router[route.method](route.path, ...middlewares, withMiddleware(handler));

    // Log route registration
    logger.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      method: route.method,
      path: route.path,
      ip: 'system',
      duration: 0,
      status: 0,
      message: `Registered route: ${route.method.toUpperCase()} ${route.path}`,
    });
  }

  return router;
};

export const createAuthRoutes = withOpenAPI(createBaseAuthRoutes, '/api');
