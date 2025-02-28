import { D1Database } from '@cloudflare/workers-types';
import { zValidator } from '@hono/zod-validator';
import { Context, Hono } from 'hono';
import { z } from 'zod';
import { auth } from './middleware.js';
import { AuthService } from './service.js';
import {
  AuthError,
  AuthErrorCode,
  IAuthResponse,
  IUser,
  OAuthProvider,
} from './types.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(1),
  confirmPassword: z.string().min(6),
});

const twoFactorCodeSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
});

const twoFactorLoginSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d+$/),
});

const updateProfileSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(50),
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100),
    confirmPassword: z.string(),
  })
  .refine(
    (data: { newPassword: string; confirmPassword: string }) =>
      data.newPassword === data.confirmPassword,
    {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }
  );

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

interface Env {
  DB: D1Database;
  FRONTEND_URL: string;
  RESEND_API_KEY: string;
}

interface Variables {
  user: IUser;
}

export const createAuthRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

  router.get('/auth/me', auth(), async (c: Context) => {
    const user = c.get('user');
    return c.json({ user });
  });

  router.post(
    '/register',
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
        const credentials = await c.req.json<z.infer<typeof registerSchema>>();
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
        const credentials = await c.req.json<z.infer<typeof loginSchema>>();
        const response = await authService.login(credentials);
        return c.json(response);
      } catch (error) {
        if (error instanceof AuthError) {
          return c.json({ error: error.message }, 401);
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
    '/verify-2fa-setup',
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
          const errorMessages: Record<AuthErrorCode, string> = {
            [AuthErrorCode.USER_NOT_FOUND]:
              'User not found. Please try logging in again.',
            [AuthErrorCode.INVALID_2FA_CODE]:
              'Invalid verification code. Please make sure you entered the correct code from your authenticator app.',
            [AuthErrorCode.TOO_MANY_ATTEMPTS]:
              'Too many failed attempts. Please wait for a while before trying again.',
            [AuthErrorCode.INVALID_TOKEN]:
              'Your session has expired. Please log in again to continue setup.',
            [AuthErrorCode.VALIDATION_ERROR]:
              'Invalid code format. Please enter a 6-digit code.',
            [AuthErrorCode.DATABASE_ERROR]:
              'A database error occurred. Please try again later.',
            [AuthErrorCode.USER_EXISTS]:
              'This email address is already in use.',
            [AuthErrorCode.INVALID_CREDENTIALS]:
              'Invalid credentials. Please log in again.',
            [AuthErrorCode.INVALID_PROVIDER]:
              'Invalid authentication provider.',
            [AuthErrorCode.OAUTH_ERROR]:
              'Authentication error occurred. Please try again.',
            [AuthErrorCode.EXPIRED_TOKEN]:
              'Your session has expired. Please log in again.',
            [AuthErrorCode.NO_TOKEN]: 'No token provided',
          };

          return c.json(
            { error: errorMessages[error.code] || error.message },
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
    '/verify-2fa',
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
          const errorMessages: Record<AuthErrorCode, string> = {
            [AuthErrorCode.USER_NOT_FOUND]:
              'User not found. Please check your email address.',
            [AuthErrorCode.INVALID_2FA_CODE]:
              'Invalid verification code. Please check your authenticator app code or recovery code and try again.',
            [AuthErrorCode.TOO_MANY_ATTEMPTS]:
              'Too many failed attempts. Please wait for a while before trying again. If the issue persists, you can use your recovery codes or contact support.',
            [AuthErrorCode.INVALID_TOKEN]:
              'Invalid or expired session. Please log in again.',
            [AuthErrorCode.VALIDATION_ERROR]:
              'Invalid input. Please make sure all fields are filled correctly.',
            [AuthErrorCode.DATABASE_ERROR]:
              'A database error occurred. Please try again later.',
            [AuthErrorCode.USER_EXISTS]:
              'This email address is already in use.',
            [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials.',
            [AuthErrorCode.INVALID_PROVIDER]:
              'Invalid authentication provider.',
            [AuthErrorCode.OAUTH_ERROR]:
              'Authentication error occurred. Please try again.',
            [AuthErrorCode.EXPIRED_TOKEN]:
              'Token has expired. Please log in again.',
            [AuthErrorCode.NO_TOKEN]: 'No token provided',
          };

          return c.json(
            { error: errorMessages[error.code] || error.message },
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
    '/enable-2fa',
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
    '/disable-2fa',
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
    '/profile',
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
          const errorMessages: Record<AuthErrorCode, string> = {
            [AuthErrorCode.USER_NOT_FOUND]:
              'Unable to find your account. Please log in again.',
            [AuthErrorCode.USER_EXISTS]:
              'This email is already registered. Please use a different email address.',
            [AuthErrorCode.VALIDATION_ERROR]:
              'Please check your input: Name should be between 1-50 characters and email should be valid.',
            [AuthErrorCode.DATABASE_ERROR]:
              'Unable to update your profile at the moment. Please try again later.',
            [AuthErrorCode.INVALID_TOKEN]:
              'Your session has expired. Please log in again to update your profile.',
            [AuthErrorCode.INVALID_CREDENTIALS]:
              'Authentication failed. Please log in again.',
            [AuthErrorCode.TOO_MANY_ATTEMPTS]:
              'Too many profile update attempts. Please try again in a few minutes.',
            [AuthErrorCode.INVALID_2FA_CODE]:
              'Two-factor authentication failed. Please verify your code.',
            [AuthErrorCode.INVALID_PROVIDER]: 'Invalid authentication method.',
            [AuthErrorCode.OAUTH_ERROR]:
              'Authentication error. Please try logging in again.',
            [AuthErrorCode.EXPIRED_TOKEN]:
              'Your session has expired. Please log in again to continue.',
            [AuthErrorCode.NO_TOKEN]: 'No token provided',
          };

          return c.json(
            { error: errorMessages[error.code] || error.message },
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
    '/password',
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
    '/verify-email',
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

  return router;
};
