import { Hono } from 'hono';
import { AuthService } from './service.js';
import { ILoginCredentials, IRegisterCredentials, IUser } from './types.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = loginSchema.extend({
  confirmPassword: z.string().min(6),
});

const twoFactorCodeSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
});

const twoFactorLoginSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d+$/),
});

type Variables = {
  user: IUser;
};

export const createAuthRoutes = (authService: AuthService) => {
  const router = new Hono<{ Variables: Variables }>();

  router.post('/login', zValidator('json', loginSchema), async (c) => {
    try {
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

  router.post('/register', zValidator('json', registerSchema), async (c) => {
    try {
      const credentials = await c.req.json<IRegisterCredentials>();
      const response = await authService.register(credentials);
      return c.json(response);
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  router.post('/setup-2fa', async (c) => {
    try {
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
    zValidator('json', twoFactorCodeSchema),
    async (c) => {
      try {
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

  router.get('/recovery-codes', async (c) => {
    try {
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
    async (c) => {
      try {
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
    '/disable-2fa',
    zValidator('json', twoFactorCodeSchema),
    async (c) => {
      try {
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

  return router;
};
