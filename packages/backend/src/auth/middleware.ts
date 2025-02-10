import { Context } from 'hono';
import { AuthService } from './service';
import { AuthError, AuthErrorCode } from './types';

export const auth = () => {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      const token = c.req.header('Authorization')?.split(' ')[1];

      if (!token) {
        throw new AuthError(AuthErrorCode.NO_TOKEN, 'No token provided');
      }

      const authService = new AuthService(c.env.DB, {
        resendApiKey: c.env.RESEND_API_KEY,
        frontendUrl: c.env.FRONTEND_URL,
        googleClientId: c.env.GOOGLE_CLIENT_ID,
        googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
        githubClientId: c.env.GITHUB_CLIENT_ID,
        githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
      });
      const user = await authService.verifyToken(token);

      c.set('user', user);
      await next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Unauthorized' },
        401
      );
    }
  };
};
