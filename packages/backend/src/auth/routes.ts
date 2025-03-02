import { D1Database } from '@cloudflare/workers-types';
import { z } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { Context, Hono } from 'hono';
import { H } from '../url/types';
import { registerSchema as register, withOpenAPI } from '../utils/openapi';
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

// Register schemas for all routes
const registerAuthSchemas = () => {
  // /auth/me
  register('/auth/me', 'get', {
    response: userProfileSchema,
  });

  // /auth/login
  register('/auth/login', 'post', {
    request: loginSchema,
    response: loginResponseSchema,
  });

  // /auth/register
  register('/auth/register', 'post', {
    request: registerSchema,
    response: loginResponseSchema,
  });

  // /auth/setup-2fa
  register('/auth/setup-2fa', 'post', {
    response: z
      .object({
        qrCode: z.string(),
        secret: z.string(),
      })
      .openapi('TwoFactorSetupInitResponse'),
  });

  // /auth/verify-2fa-setup
  register('/auth/verify-2fa-setup', 'post', {
    request: twoFactorCodeSchema,
    response: twoFactorSetupSchema,
  });

  // /auth/recovery-codes
  register('/auth/recovery-codes', 'get', {
    response: recoveryCodesSchema,
  });

  // /auth/verify-2fa
  register('/auth/verify-2fa', 'post', {
    request: twoFactorLoginSchema,
    response: loginResponseSchema,
  });

  // /auth/enable-2fa
  register('/auth/enable-2fa', 'post', {
    request: twoFactorCodeSchema,
    response: z
      .object({ success: z.boolean() })
      .openapi('TwoFactorEnableResponse'),
  });

  // /auth/disable-2fa
  register('/auth/disable-2fa', 'post', {
    request: twoFactorCodeSchema,
    response: z
      .object({ success: z.boolean() })
      .openapi('TwoFactorDisableResponse'),
  });

  // /auth/profile
  register('/auth/profile', 'put', {
    request: updateProfileSchema,
    response: userProfileSchema,
  });

  // /auth/password
  register('/auth/password', 'put', {
    request: updatePasswordSchema,
    response: z
      .object({ success: z.boolean() })
      .openapi('PasswordUpdateResponse'),
  });

  // /auth/verify-email
  register('/auth/verify-email', 'post', {
    request: verifyEmailSchema,
    response: z
      .object({ message: z.string() })
      .openapi('EmailVerificationResponse'),
  });

  // /auth/resend-verification-email
  register('/auth/resend-verification-email', 'post', {
    response: z
      .object({ message: z.string() })
      .openapi('ResendVerificationResponse'),
  });

  // /auth/request-password-reset
  register('/auth/request-password-reset', 'post', {
    request: z
      .object({ email: z.string().email() })
      .openapi('PasswordResetRequestSchema'),
    response: z
      .object({ message: z.string() })
      .openapi('PasswordResetRequestResponse'),
  });

  // /auth/reset-password
  register('/auth/reset-password', 'put', {
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
  });

  // /auth/waitlist
  register('/auth/waitlist', 'post', {
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
  });

  // /auth/waitlist/:email
  register('/auth/waitlist/:email', 'get', {
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
  });
};

const createBaseAuthRoutes = () => {
  // Register all schemas
  registerAuthSchemas();

  const router = new Hono<H>();

  router.get('/auth/me', auth(), async (c: Context) => {
    const user = c.get('user');
    return c.json({ user });
  });

  router.post(
    '/auth/login',
    zValidator('json', loginSchema),
    async (c: Context) => {
      try {
        const db = c.get('db');
        const authService = new AuthService(db, {
          resendApiKey: c.env.RESEND_API_KEY,
          frontendUrl: c.env.FRONTEND_URL,
          googleClientId: c.env.GOOGLE_CLIENT_ID,
          googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
          githubClientId: c.env.GITHUB_CLIENT_ID,
          githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
        });
        const { email, password } = await c.req.json<ILoginCredentials>();
        const response = await authService.login({ email, password });
        return c.json(response);
      } catch (error) {
        if (error instanceof AuthError) {
          return c.json({ error: error.message }, 401);
        }
        return c.json({ error: 'Internal server error' }, 500);
      }
    }
  );

  router.post(
    '/auth/register',
    zValidator('json', registerSchema),
    async (c: Context) => {
      try {
        const db = c.get('db');
        const authService = new AuthService(db, {
          resendApiKey: c.env.RESEND_API_KEY,
          frontendUrl: c.env.FRONTEND_URL,
          googleClientId: c.env.GOOGLE_CLIENT_ID,
          googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
          githubClientId: c.env.GITHUB_CLIENT_ID,
          githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
        });
        const data = await c.req.json<z.infer<typeof registerSchema>>();
        const credentials: IRegisterCredentials = {
          email: data.email,
          password: data.password,
          name: data.name,
          confirmPassword: data.confirmPassword,
        };
        const response = await authService.register(credentials);
        return c.json(response);
      } catch (error) {
        if (error instanceof Error) {
          return c.json({ error: error.message }, 400);
        }
        return c.json({ error: 'Internal server error' }, 500);
      }
    }
  );

  router.post('/auth/setup-2fa', auth(), async (c: Context) => {
    try {
      const authService = new AuthService(c.env.DB, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
        googleClientId: c.env.GOOGLE_CLIENT_ID,
        googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
        githubClientId: c.env.GITHUB_CLIENT_ID,
        githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
      });
      const user = c.get('user');
      const response = await authService.setupTwoFactor(user.id);
      return c.json(response);
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  router.post(
    '/auth/verify-2fa-setup',
    auth(),
    zValidator('json', twoFactorCodeSchema),
    async (c: Context) => {
      try {
        const authService = new AuthService(c.env.DB, {
          resendApiKey: c.env.RESEND_API_KEY,
          frontendUrl: c.env.FRONTEND_URL,
          googleClientId: c.env.GOOGLE_CLIENT_ID,
          googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
          githubClientId: c.env.GITHUB_CLIENT_ID,
          githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
        });
        const { code } = await c.req.json();
        const user = c.get('user');
        const ipAddress =
          c.req.header('cf-connecting-ip') ||
          c.req.header('x-forwarded-for') ||
          '0.0.0.0';

        const recoveryCodes = await authService.verifyTwoFactorSetup(
          user.id,
          code,
          ipAddress
        );
        return c.json({ success: true, recoveryCodes });
      } catch (error) {
        if (error instanceof AuthError) {
          return c.json(
            { error: ERROR_MESSAGES[error.code] || error.message },
            400
          );
        }
        return c.json(
          {
            error: 'An unexpected error occurred. Please try again later.',
          },
          500
        );
      }
    }
  );

  router.get('/auth/recovery-codes', auth(), async (c: Context) => {
    try {
      const authService = new AuthService(c.env.DB, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
        googleClientId: c.env.GOOGLE_CLIENT_ID,
        googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
        githubClientId: c.env.GITHUB_CLIENT_ID,
        githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
      });
      const user = c.get('user');
      const codes = await authService.getRecoveryCodes(user.id);
      return c.json({ recoveryCodes: codes });
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  router.post(
    '/auth/verify-2fa',
    zValidator('json', twoFactorLoginSchema),
    async (c: Context) => {
      try {
        const authService = new AuthService(c.env.DB, {
          resendApiKey: c.env.RESEND_API_KEY,
          frontendUrl: c.env.FRONTEND_URL,
          googleClientId: c.env.GOOGLE_CLIENT_ID,
          googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
          githubClientId: c.env.GITHUB_CLIENT_ID,
          githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
        });
        const { email, code } = await c.req.json();
        const ipAddress =
          c.req.header('cf-connecting-ip') ||
          c.req.header('x-forwarded-for') ||
          '0.0.0.0';

        const result = await authService.verifyTwoFactorLogin(
          email,
          code,
          ipAddress
        );
        return c.json(result);
      } catch (error) {
        if (error instanceof AuthError) {
          return c.json(
            { error: ERROR_MESSAGES[error.code] || error.message },
            400
          );
        }
        return c.json(
          {
            error: 'An unexpected error occurred. Please try again later.',
          },
          500
        );
      }
    }
  );

  router.post(
    '/auth/enable-2fa',
    auth(),
    zValidator('json', twoFactorCodeSchema),
    async (c: Context) => {
      try {
        const authService = new AuthService(c.env.DB, {
          resendApiKey: c.env.RESEND_API_KEY,
          frontendUrl: c.env.FRONTEND_URL,
          googleClientId: c.env.GOOGLE_CLIENT_ID,
          googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
          githubClientId: c.env.GITHUB_CLIENT_ID,
          githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
        });
        const { code } = await c.req.json();
        const user = c.get('user');
        const ipAddress =
          c.req.header('cf-connecting-ip') ||
          c.req.header('x-forwarded-for') ||
          '0.0.0.0';

        await authService.enableTwoFactor(user.id, code, ipAddress);
        return c.json({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          return c.json({ error: error.message }, 400);
        }
        return c.json({ error: 'Internal server error' }, 500);
      }
    }
  );

  router.post(
    '/auth/disable-2fa',
    auth(),
    zValidator('json', twoFactorCodeSchema),
    async (c: Context) => {
      try {
        const authService = new AuthService(c.env.DB, {
          resendApiKey: c.env.RESEND_API_KEY,
          frontendUrl: c.env.FRONTEND_URL,
          googleClientId: c.env.GOOGLE_CLIENT_ID,
          googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
          githubClientId: c.env.GITHUB_CLIENT_ID,
          githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
        });
        const { code } = await c.req.json();
        const user = c.get('user');
        const ipAddress =
          c.req.header('cf-connecting-ip') ||
          c.req.header('x-forwarded-for') ||
          '0.0.0.0';

        await authService.disableTwoFactor(user.id, code, ipAddress);
        return c.json({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          return c.json({ error: error.message }, 400);
        }
        return c.json({ error: 'Internal server error' }, 500);
      }
    }
  );

  router.put(
    '/auth/profile',
    auth(),
    zValidator('json', updateProfileSchema),
    async (c: Context) => {
      try {
        const authService = new AuthService(c.env.DB, {
          resendApiKey: c.env.RESEND_API_KEY,
          frontendUrl: c.env.FRONTEND_URL,
          googleClientId: c.env.GOOGLE_CLIENT_ID,
          googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
          githubClientId: c.env.GITHUB_CLIENT_ID,
          githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
        });
        const user = c.get('user');

        const data = await c.req.json();
        const updatedUser = await authService.updateProfile(user.id, data);
        return c.json({ user: updatedUser });
      } catch (error) {
        if (error instanceof AuthError) {
          return c.json(
            { error: ERROR_MESSAGES[error.code] || error.message },
            400
          );
        }
        return c.json(
          {
            error:
              'Unable to update profile due to a system error. Please try again later.',
          },
          500
        );
      }
    }
  );

  router.put(
    '/auth/password',
    auth(),
    zValidator('json', updatePasswordSchema),
    async (c: Context) => {
      try {
        const authService = new AuthService(c.env.DB, {
          resendApiKey: c.env.RESEND_API_KEY,
          frontendUrl: c.env.FRONTEND_URL,
          googleClientId: c.env.GOOGLE_CLIENT_ID,
          googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
          githubClientId: c.env.GITHUB_CLIENT_ID,
          githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
        });
        const user = c.get('user');
        const data = await c.req.json();
        const ipAddress =
          c.req.header('cf-connecting-ip') ||
          c.req.header('x-forwarded-for') ||
          '0.0.0.0';
        await authService.updatePassword(user.id, data, ipAddress);
        return c.json({ success: true });
      } catch (error) {
        if (error instanceof Error) {
          return c.json({ error: error.message }, 400);
        }
        return c.json({ error: 'Internal server error' }, 500);
      }
    }
  );

  router.post(
    '/auth/verify-email',
    auth(),
    zValidator('json', verifyEmailSchema),
    async (c: Context) => {
      try {
        const { token } = await c.req.json();
        const userId = c.get('user').id;

        const authService = new AuthService(c.env.DB, {
          resendApiKey: c.env.RESEND_API_KEY,
          frontendUrl: c.env.FRONTEND_URL,
          googleClientId: c.env.GOOGLE_CLIENT_ID,
          googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
          githubClientId: c.env.GITHUB_CLIENT_ID,
          githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
        });
        await authService.verifyEmail(token, userId);

        return c.json({ message: 'Email verified successfully' });
      } catch (error) {
        if (error instanceof Error) {
          return c.json({ error: error.message }, 400);
        }
        return c.json({ error: 'Internal server error' }, 500);
      }
    }
  );

  router.post('/auth/resend-verification-email', auth(), async (c: Context) => {
    try {
      console.log('Starting resend-verification-email handler', {
        apiKey: c.env.RESEND_API_KEY ? 'present' : 'missing',
        frontendUrl: c.env.FRONTEND_URL,
        userId: c.get('user').id,
      });

      if (!c.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing');
        return c.json({ error: 'Email service configuration error' }, 500);
      }

      const authService = new AuthService(c.env.DB, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
        googleClientId: c.env.GOOGLE_CLIENT_ID,
        googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
        githubClientId: c.env.GITHUB_CLIENT_ID,
        githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
      });

      const user = c.get('user');
      console.log('User from context:', user);

      await authService.resendVerificationEmail(user.id);
      return c.json({ message: 'Verification email sent successfully' });
    } catch (error) {
      console.error('Error in resend-verification-email handler:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof AuthError) {
        return c.json({ error: error.message }, 400);
      }

      return c.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  });

  // OAuth routes
  router.get('/auth/oauth/:provider', async (c: Context) => {
    try {
      const provider = c.req.param('provider');
      const authService = new AuthService(c.env.DB, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
        googleClientId: c.env.GOOGLE_CLIENT_ID,
        googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
        githubClientId: c.env.GITHUB_CLIENT_ID,
        githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
      });
      const authUrl = await authService.getOAuthUrl(provider as OAuthProvider);
      return c.redirect(authUrl);
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  router.get('/auth/oauth/:provider/callback', async (c: Context) => {
    try {
      const provider = c.req.param('provider');
      const code = c.req.query('code');

      if (!code) {
        throw new Error('Authorization code is missing');
      }

      const authService = new AuthService(c.env.DB, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
        googleClientId: c.env.GOOGLE_CLIENT_ID,
        googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
        githubClientId: c.env.GITHUB_CLIENT_ID,
        githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
      });

      const response = await authService.handleOAuthCallback(
        provider as OAuthProvider,
        code
      );

      // Redirect to frontend with token
      return c.redirect(
        `${c.env.FRONTEND_URL}/auth/callback?token=${response.token}`
      );
    } catch (error) {
      if (error instanceof Error) {
        return c.redirect(
          `${c.env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent(
            error.message
          )}`
        );
      }
      return c.redirect(
        `${c.env.FRONTEND_URL}/auth/callback?error=Internal server error`
      );
    }
  });

  router.post('/auth/request-password-reset', async (c: Context) => {
    try {
      const { email } = await c.req.json();
      const authService = new AuthService(c.env.DB, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
        googleClientId: c.env.GOOGLE_CLIENT_ID,
        googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
        githubClientId: c.env.GITHUB_CLIENT_ID,
        githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
      });
      await authService.requestPasswordReset(email);
      return c.json({ message: 'Password reset request sent' });
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  router.put('/auth/reset-password', async (c: Context) => {
    try {
      const { token, newPassword, confirmPassword } = await c.req.json();
      const authService = new AuthService(c.env.DB, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
        googleClientId: c.env.GOOGLE_CLIENT_ID,
        googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
        githubClientId: c.env.GITHUB_CLIENT_ID,
        githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
      });
      await authService.resetPassword(token, newPassword, confirmPassword);
      return c.json({ message: 'Password reset successful' });
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  /**
   * Join waitlist route
   */
  router.post('/auth/waitlist', async (c: Context) => {
    const { email, name, company, useCase } = await c.req.json();

    try {
      const authService = new AuthService(c.env.DB, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
        googleClientId: c.env.GOOGLE_CLIENT_ID,
        googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
        githubClientId: c.env.GITHUB_CLIENT_ID,
        githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
      });

      const waitlistEntry = await authService.addToWaitlist({
        email,
        name,
        company,
        useCase,
      });

      return c.json(waitlistEntry);
    } catch (error) {
      if (error instanceof AuthError) {
        return c.json(
          {
            error: {
              code: error.code,
              message: error.message,
            },
          },
          error.code === AuthErrorCode.USER_EXISTS ? 409 : 400
        );
      }

      return c.json(
        {
          error: {
            code: AuthErrorCode.DATABASE_ERROR,
            message: 'Failed to join waitlist',
          },
        },
        500
      );
    }
  });

  /**
   * Get waitlist entry route
   */
  router.get('/auth/waitlist/:email', async (c: Context) => {
    const email = c.req.param('email');

    try {
      const authService = new AuthService(c.env.DB, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
        googleClientId: c.env.GOOGLE_CLIENT_ID,
        googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
        githubClientId: c.env.GITHUB_CLIENT_ID,
        githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
      });

      const waitlistEntry = await authService.getWaitlistEntry(email);

      if (!waitlistEntry) {
        return c.json(
          {
            error: {
              code: AuthErrorCode.USER_NOT_FOUND,
              message: 'Waitlist entry not found',
            },
          },
          404
        );
      }

      return c.json(waitlistEntry);
    } catch (error) {
      return c.json(
        {
          error: {
            code: AuthErrorCode.DATABASE_ERROR,
            message: 'Failed to get waitlist entry',
          },
        },
        500
      );
    }
  });

  return router;
};

export const createAuthRoutes = withOpenAPI(createBaseAuthRoutes, '/api');
