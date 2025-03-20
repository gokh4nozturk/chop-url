import { handleError } from '@/utils/error';
import { z } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { H } from '../types/hono.types';
import type { RouteGroup } from '../types/route.types';
import { withOpenAPI } from '../utils/openapi';
import { createRouteGroup } from '../utils/route-factory';
import { authHandlers } from './handlers';
import { auth } from './middleware';
import { authSchemas } from './schemas';

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
        schema: { response: authSchemas.recoveryCodes },
        requiresAuth: true,
        description: 'Get 2FA recovery codes',
        handler: authHandlers.getRecoveryCodes,
      },
      {
        path: '/verify-2fa',
        method: 'post',
        schema: {
          request: authSchemas.twoFactorLogin,
          response: authSchemas.loginResponse,
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
          request: authSchemas.twoFactorCode,
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
          request: authSchemas.twoFactorCode,
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
        path: '/update',
        method: 'put',
        schema: {
          request: authSchemas.updateProfile,
          response: authSchemas.userProfile,
        },
        requiresAuth: true,
        description: 'Update user profile',
        handler: authHandlers.updateProfile,
      },
      {
        path: '/password',
        method: 'put',
        schema: {
          request: authSchemas.updatePassword,
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
          request: authSchemas.verifyEmail,
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
          response: authSchemas.oAuthUrlResponse,
        },
        description: 'Initiate OAuth flow',
        handler: authHandlers.getOAuthUrl,
      },
      {
        path: '/:provider/callback',
        method: 'get',
        schema: {
          response: authSchemas.oAuthCallbackResponse,
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
        path: '/join',
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
        description: 'Add to waitlist',
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

// Export the router with OpenAPI documentation
export const createAuthRoutes = withOpenAPI(createBaseAuthRoutes, '/api');
