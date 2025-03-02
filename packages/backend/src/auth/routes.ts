import { D1Database } from '@cloudflare/workers-types';
import { z } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { Context, Hono } from 'hono';
import type { RouteGroup } from '../types/route.types';
import { H } from '../url/types';
import {
  registerSchema as registerOpenAPISchema,
  withOpenAPI,
} from '../utils/openapi';
import { createRouteGroup } from '../utils/route-factory';
import { authHandlers } from './handlers';
import { auth } from './middleware';
import { authSchemas } from './schemas';
import { AuthError, AuthErrorCode, IUser } from './types';

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

// OAuth URL response schema
const oAuthUrlResponseSchema = z
  .object({
    url: z.string().url(),
  })
  .openapi('OAuthUrlResponse');

// OAuth callback response schema
const oAuthCallbackResponseSchema = z
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
      .openapi('OAuthUser'),
  })
  .openapi('OAuthCallbackResponse');

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

// Route groups configuration
const authGroups: RouteGroup[] = [
  {
    prefix: '/auth',
    tag: 'AUTH',
    description: 'Basic authentication endpoints',
    routes: [
      {
        path: '/me',
        method: 'get',
        schema: { response: authSchemas.userProfile },
        requiresAuth: true,
        description: 'Get current user profile',
        handler: authHandlers.getCurrentUser,
      },
      {
        path: '/login',
        method: 'post',
        schema: {
          request: authSchemas.login,
          response: authSchemas.loginResponse,
        },
        rateLimit: {
          requests: 5,
          window: '5m',
        },
        description: 'Login with email and password',
        handler: authHandlers.login,
      },
      {
        path: '/register',
        method: 'post',
        schema: {
          request: authSchemas.register,
          response: authSchemas.loginResponse,
        },
        rateLimit: {
          requests: 3,
          window: '10m',
        },
        description: 'Register new user',
        handler: authHandlers.register,
      },
    ],
  },
  {
    prefix: '/auth/2fa',
    tag: 'TWO_FACTOR',
    description: 'Two-factor authentication endpoints',
    routes: [
      {
        path: '/setup',
        method: 'post',
        schema: {
          response: authSchemas.twoFactorSetupInit,
        },
        requiresAuth: true,
        description: 'Initialize 2FA setup',
        handler: authHandlers.setupTwoFactor,
      },
      {
        path: '/verify-setup',
        method: 'post',
        schema: {
          request: authSchemas.twoFactorCode,
          response: authSchemas.twoFactorSetup,
        },
        requiresAuth: true,
        rateLimit: {
          requests: 3,
          window: '5m',
        },
        description: 'Verify 2FA setup',
        handler: authHandlers.verifyTwoFactorSetup,
      },
      {
        path: '/recovery-codes',
        method: 'get',
        schema: { response: recoveryCodesSchema },
        requiresAuth: true,
        description: 'Get 2FA recovery codes',
        handler: authHandlers.getRecoveryCodes,
      },
      {
        path: '/verify-2fa',
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
        handler: authHandlers.verifyTwoFactorLogin,
      },
      {
        path: '/enable-2fa',
        method: 'post',
        schema: {
          request: twoFactorCodeSchema,
          response: z
            .object({ success: z.boolean() })
            .openapi('TwoFactorEnableResponse'),
        },
        requiresAuth: true,
        description: 'Enable 2FA',
        handler: authHandlers.enableTwoFactor,
      },
      {
        path: '/disable-2fa',
        method: 'post',
        schema: {
          request: twoFactorCodeSchema,
          response: z
            .object({ success: z.boolean() })
            .openapi('TwoFactorDisableResponse'),
        },
        requiresAuth: true,
        description: 'Disable 2FA',
        handler: authHandlers.disableTwoFactor,
      },
    ],
  },
  {
    prefix: '/auth/profile',
    tag: 'PROFILE',
    description: 'User profile management endpoints',
    routes: [
      {
        path: '/',
        method: 'put',
        schema: {
          request: updateProfileSchema,
          response: userProfileSchema,
        },
        requiresAuth: true,
        description: 'Update user profile',
        handler: authHandlers.updateProfile,
      },
      {
        path: '/password',
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
        handler: authHandlers.updatePassword,
      },
    ],
  },
  {
    prefix: '/auth/email',
    tag: 'EMAIL',
    description: 'Email verification endpoints',
    routes: [
      {
        path: '/verify',
        method: 'post',
        schema: {
          request: verifyEmailSchema,
          response: z
            .object({ message: z.string() })
            .openapi('EmailVerificationResponse'),
        },
        requiresAuth: true,
        description: 'Verify email address',
        handler: authHandlers.verifyEmail,
      },
      {
        path: '/resend-verification',
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
        handler: authHandlers.resendVerificationEmail,
      },
    ],
  },
  {
    prefix: '/auth/oauth',
    tag: 'OAUTH',
    description: 'OAuth authentication endpoints',
    routes: [
      {
        path: '/:provider',
        method: 'get',
        schema: {
          response: oAuthUrlResponseSchema,
        },
        description: 'Initiate OAuth flow',
        handler: authHandlers.getOAuthUrl,
      },
      {
        path: '/:provider/callback',
        method: 'get',
        schema: {
          response: oAuthCallbackResponseSchema,
        },
        description: 'Handle OAuth callback',
        handler: authHandlers.handleOAuthCallback,
      },
    ],
  },
  {
    prefix: '/auth/password-reset',
    tag: 'PASSWORD',
    description: 'Password reset endpoints',
    routes: [
      {
        path: '/request',
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
        handler: authHandlers.requestPasswordReset,
      },
      {
        path: '/reset',
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
        handler: authHandlers.resetPassword,
      },
    ],
  },
  {
    prefix: '/auth/waitlist',
    tag: 'WAITLIST',
    description: 'Waitlist management endpoints',
    routes: [
      {
        path: '/',
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
        handler: authHandlers.addToWaitlist,
      },
      {
        path: '/:email',
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
        handler: authHandlers.getWaitlistEntry,
      },
    ],
  },
];

// Create base router with route factory
const createBaseAuthRoutes = () => {
  const router = new OpenAPIHono<H>();

  // Register all routes from groups
  const authRoutes = createRouteGroup(authGroups[0]); // Basic auth routes
  const twoFactorRoutes = createRouteGroup(authGroups[1]); // 2FA routes
  const profileRoutes = createRouteGroup(authGroups[2]); // Profile routes
  const emailRoutes = createRouteGroup(authGroups[3]); // Email routes
  const oauthRoutes = createRouteGroup(authGroups[4]); // OAuth routes
  const passwordResetRoutes = createRouteGroup(authGroups[5]); // Password reset routes
  const waitlistRoutes = createRouteGroup(authGroups[6]); // Waitlist routes

  // Add routes to router with middleware
  for (const route of [
    ...authRoutes,
    ...twoFactorRoutes,
    ...profileRoutes,
    ...emailRoutes,
    ...oauthRoutes,
    ...passwordResetRoutes,
    ...waitlistRoutes,
  ]) {
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

// Error handler
const handleError = (c: Context, error: unknown) => {
  console.error('Auth Error:', error);

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

// Export the router with OpenAPI documentation
export const createAuthRoutes = withOpenAPI(createBaseAuthRoutes, '/api');
