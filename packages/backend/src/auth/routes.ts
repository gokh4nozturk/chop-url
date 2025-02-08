import { zValidator } from '@hono/zod-validator';
import { Context, Hono } from 'hono';
import { z } from 'zod';
import { auth } from './middleware.js';
import { AuthService } from './service.js';
import { ILoginCredentials, IRegisterCredentials, IUser } from './types.js';

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
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

interface Env {
  DB: D1Database;
  BASE_URL: string;
}
interface Variables {
  user: IUser;
}

export const createAuthRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

  router.post(
    '/register',
    zValidator('json', registerSchema),
    async (c: Context) => {
      try {
        const authService = new AuthService(c.env.DB);
        const credentials = await c.req.json<IRegisterCredentials>();
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

  router.post('/login', zValidator('json', loginSchema), async (c: Context) => {
    try {
      const authService = new AuthService(c.env.DB);
      const credentials = await c.req.json<ILoginCredentials>();
      const response = await authService.login(credentials);
      return c.json(response);
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  router.post('/setup-2fa', auth(), async (c: Context) => {
    try {
      const authService = new AuthService(c.env.DB);
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
        const authService = new AuthService(c.env.DB);
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
        if (error instanceof Error) {
          return c.json({ error: error.message }, 400);
        }
        return c.json({ error: 'Internal server error' }, 500);
      }
    }
  );

  router.get('/recovery-codes', auth(), async (c: Context) => {
    try {
      const authService = new AuthService(c.env.DB);
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
        const authService = new AuthService(c.env.DB);
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
        if (error instanceof Error) {
          return c.json({ error: error.message }, 400);
        }
        return c.json({ error: 'Internal server error' }, 500);
      }
    }
  );

  router.post(
    '/enable-2fa',
    auth(),
    zValidator('json', twoFactorCodeSchema),
    async (c: Context) => {
      try {
        const authService = new AuthService(c.env.DB);
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
        const authService = new AuthService(c.env.DB);
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
        const authService = new AuthService(c.env.DB);
        const user = c.get('user');

        const data = await c.req.json();
        const updatedUser = await authService.updateProfile(user.id, data);
        return c.json({ user: updatedUser });
      } catch (error) {
        if (error instanceof Error) {
          return c.json({ error: error.message }, 400);
        }
        return c.json({ error: 'Internal server error' }, 500);
      }
    }
  );

  router.put(
    '/password',
    auth(),
    zValidator('json', updatePasswordSchema),
    async (c: Context) => {
      try {
        const authService = new AuthService(c.env.DB);
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

  return router;
};
