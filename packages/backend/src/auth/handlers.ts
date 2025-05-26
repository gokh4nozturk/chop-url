import { z } from '@hono/zod-openapi';
import { Context } from 'hono';
import { authSchemas } from './schemas';
import { AuthService } from './service';
import {
  AuthError,
  AuthErrorCode,
  ILoginCredentials,
  IRegisterCredentials,
  OAuthProvider,
} from './types';

// Utility function to get client IP
const getClientIp = (c: Context) =>
  c.req.header('cf-connecting-ip') ||
  c.req.header('x-forwarded-for') ||
  '0.0.0.0';

// Service factory
const createAuthService = (c: Context) => {
  return new AuthService(c.get('db'), {
    resendApiKey: c.env.RESEND_API_KEY,
    frontendUrl: c.env.FRONTEND_URL,
    googleClientId: c.env.GOOGLE_CLIENT_ID,
    googleClientSecret: c.env.GOOGLE_CLIENT_SECRET,
    githubClientId: c.env.GITHUB_CLIENT_ID,
    githubClientSecret: c.env.GITHUB_CLIENT_SECRET,
  });
};

// Auth handlers
export const authHandlers = {
  getCurrentUser: async (c: Context) => {
    const user = c.get('user');
    return c.json({ user });
  },

  login: async (c: Context) => {
    const service = createAuthService(c);
    const { email, password } = await c.req.json<ILoginCredentials>();
    const response = await service.login({ email, password });
    return c.json(response);
  },

  logout: async (c: Context) => {
    const service = createAuthService(c);
    const { token } = await c.req.json<z.infer<typeof authSchemas.logout>>();
    await service.logout(token);
    return c.json({ message: 'Logout successful' });
  },

  register: async (c: Context) => {
    const service = createAuthService(c);
    const data = await c.req.json<z.infer<typeof authSchemas.register>>();
    const credentials: IRegisterCredentials = {
      email: data.email,
      password: data.password,
      name: data.name,
      confirmPassword: data.confirmPassword,
    };
    const response = await service.register(credentials);
    return c.json(response);
  },

  setupTwoFactor: async (c: Context) => {
    const service = createAuthService(c);
    const user = c.get('user');
    const response = await service.setupTwoFactor(user.id);
    return c.json(response);
  },

  verifyTwoFactorSetup: async (c: Context) => {
    const service = createAuthService(c);
    const { code } = await c.req.json();
    const user = c.get('user');
    const ipAddress = getClientIp(c);

    const recoveryCodes = await service.verifyTwoFactorSetup(
      user.id,
      code,
      ipAddress
    );
    return c.json({ success: true, recoveryCodes });
  },

  getRecoveryCodes: async (c: Context) => {
    const service = createAuthService(c);
    const user = c.get('user');
    const codes = await service.getRecoveryCodes(user.id);
    return c.json({ recoveryCodes: codes });
  },

  verifyTwoFactorLogin: async (c: Context) => {
    const service = createAuthService(c);
    const { email, code } = await c.req.json();
    const ipAddress = getClientIp(c);

    const result = await service.verifyTwoFactorLogin(email, code, ipAddress);
    return c.json(result);
  },

  enableTwoFactor: async (c: Context) => {
    const service = createAuthService(c);
    const { code } = await c.req.json();
    const user = c.get('user');
    const ipAddress = getClientIp(c);

    await service.enableTwoFactor(user.id, code, ipAddress);
    return c.json({ success: true });
  },

  disableTwoFactor: async (c: Context) => {
    const service = createAuthService(c);
    const { code } = await c.req.json();
    const user = c.get('user');
    const ipAddress = getClientIp(c);

    await service.disableTwoFactor(user.id, code, ipAddress);
    return c.json({ success: true });
  },

  updateProfile: async (c: Context) => {
    const service = createAuthService(c);
    const user = c.get('user');
    const data = await c.req.json();
    const updatedUser = await service.updateProfile(user.id, data);
    return c.json({ user: updatedUser });
  },

  updatePassword: async (c: Context) => {
    const service = createAuthService(c);
    const user = c.get('user');
    const data = await c.req.json();
    const ipAddress = getClientIp(c);
    await service.updatePassword(user.id, data, ipAddress);
    return c.json({ success: true });
  },

  verifyEmail: async (c: Context) => {
    const service = createAuthService(c);
    const { token } = await c.req.json();
    const userId = c.get('user').id;
    await service.verifyEmail(token, userId);
    return c.json({ message: 'Email verified successfully' });
  },

  resendVerificationEmail: async (c: Context) => {
    const service = createAuthService(c);
    if (!c.env.RESEND_API_KEY) {
      throw new Error('Email service configuration error');
    }
    const user = c.get('user');
    await service.resendVerificationEmail(user);
    return c.json({ message: 'Verification email sent successfully' });
  },

  getOAuthUrl: async (c: Context) => {
    const service = createAuthService(c);
    const provider = c.req.param('provider');
    const authUrl = await service.getOAuthUrl(provider as OAuthProvider);
    return c.redirect(authUrl);
  },

  handleOAuthCallback: async (c: Context) => {
    const service = createAuthService(c);
    const provider = c.req.param('provider');
    const code = c.req.query('code');

    if (!code) {
      throw new Error('Authorization code is missing');
    }

    const response = await service.handleOAuthCallback(
      provider as OAuthProvider,
      code
    );
    return c.redirect(
      `${c.env.FRONTEND_URL}/auth/callback?token=${response.token}`
    );
  },

  requestPasswordReset: async (c: Context) => {
    const service = createAuthService(c);
    const { email } = await c.req.json();
    await service.requestPasswordReset(email);
    return c.json({ message: 'Password reset request sent' });
  },

  resetPassword: async (c: Context) => {
    const service = createAuthService(c);
    const { token, newPassword, confirmPassword } = await c.req.json();
    await service.resetPassword(token, newPassword, confirmPassword);
    return c.json({ message: 'Password reset successful' });
  },

  addToWaitlist: async (c: Context) => {
    const service = createAuthService(c);
    const { email, name, company, useCase } = await c.req.json();
    const waitlistEntry = await service.addToWaitlist({
      email,
      name,
      company,
      useCase,
    });
    return c.json(waitlistEntry);
  },

  getWaitlistEntry: async (c: Context) => {
    const service = createAuthService(c);
    const email = c.req.param('email');
    const waitlistEntry = await service.getWaitlistEntry(email);

    if (!waitlistEntry) {
      throw new AuthError(
        AuthErrorCode.USER_NOT_FOUND,
        'Waitlist entry not found'
      );
    }

    return c.json(waitlistEntry);
  },
};
