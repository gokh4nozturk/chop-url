import { Hono } from 'hono';
import { AuthService } from './service.js';
import { ILoginCredentials, IRegisterCredentials } from './types.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = loginSchema.extend({
  confirmPassword: z.string().min(6),
});

export const createAuthRoutes = (authService: AuthService) => {
  const router = new Hono();

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

  return router;
};
