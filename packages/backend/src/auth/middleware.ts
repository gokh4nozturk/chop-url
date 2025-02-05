import { Context, Next } from 'hono';
import { AuthService } from './service.js';
import { AuthError, AuthErrorCode } from './types.js';

export const authMiddleware = (authService: AuthService) => {
  return async (c: Context, next: Next) => {
    try {
      const token = c.req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        throw new AuthError(AuthErrorCode.INVALID_TOKEN, 'No token provided');
      }

      const user = await authService.verifyToken(token);
      c.set('user', user);

      await next();
    } catch (error) {
      if (error instanceof AuthError) {
        return c.json({ error: error.message }, 401);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  };
};
