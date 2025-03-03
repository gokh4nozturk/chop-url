import { Context } from 'hono';
import { AuthService } from './service';
import { AuthError, AuthErrorCode } from './types';

export const auth = () => {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      const token = c.req.header('Authorization')?.split(' ')[1];

      if (!token) {
        console.error('Auth middleware: No token provided');
        throw new AuthError(AuthErrorCode.NO_TOKEN, 'No token provided');
      }

      const db = c.get('db');
      const authService = new AuthService(db, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
        googleClientId: c.env.GOOGLE_CLIENT_ID,
        googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
        githubClientId: c.env.GITHUB_CLIENT_ID,
        githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
      });

      try {
        const user = await authService.verifySession(token);
        if (!user) {
          console.error('Auth middleware: User not found for token');
          throw new AuthError(AuthErrorCode.INVALID_TOKEN, 'Invalid token');
        }
        c.set('user', user);
        await next();
      } catch (verifyError) {
        console.error(
          'Auth middleware: Token verification failed:',
          verifyError
        );
        throw new AuthError(AuthErrorCode.INVALID_TOKEN, 'Invalid token');
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      if (error instanceof AuthError) {
        return c.json({ error: error.message }, 401);
      }
      return c.json({ error: 'Unauthorized' }, 401);
    }
  };
};
