import { Context, Next } from 'hono';
import { AuthService } from './service.js';
import { AuthError, AuthErrorCode } from './types.js';

export const auth = () => {
  return async (c: Context, next: Next) => {
    try {
      const token = c.req.header('Authorization')?.replace('Bearer ', '');
      console.log('Auth middleware - token:', token ? 'present' : 'missing');

      if (!token) {
        throw new AuthError(AuthErrorCode.INVALID_TOKEN, 'No token provided');
      }

      const authService = new AuthService(c.env.DB, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
      });

      console.log('Auth middleware - verifying token');
      const user = await authService.verifyToken(token);
      console.log('Auth middleware - user found:', user);

      c.set('user', user);
      await next();
    } catch (error) {
      console.error('Auth middleware error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof AuthError) {
        return c.json({ error: error.message }, 401);
      }
      return c.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  };
};
