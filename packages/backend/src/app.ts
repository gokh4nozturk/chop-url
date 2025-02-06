import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ChopUrl } from '@chop-url/lib';
import { AuthService } from './auth/service.js';
import { createAuthRoutes } from './auth/routes.js';
import { authMiddleware } from './auth/middleware.js';
import type { Context, Handler } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { IUser } from './auth/types.js';

interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
}

type Variables = {
  services: {
    chopUrl: ChopUrl;
    authService: AuthService;
  };
  user?: IUser;
};

type AppType = { Bindings: Env; Variables: Variables };

const app = new Hono<AppType>();

// Middleware
app.use('*', cors());

// Create services
const createServices = (db: D1Database) => {
  const chopUrl = new ChopUrl({ db, baseUrl: 'https://chop.url' });
  const authService = new AuthService(db);
  return { chopUrl, authService };
};

// Initialize services middleware
app.use('*', async (c, next) => {
  const services = createServices(c.env.DB);
  c.set('services', services);
  await next();
});

// Auth routes
const auth = new Hono<AppType>();

// Public auth routes
auth.post('/login', async (c) => {
  const credentials = await c.req.json();
  const response = await c.var.services.authService.login(credentials);
  return c.json(response);
});

auth.post('/register', async (c) => {
  const credentials = await c.req.json();
  const response = await c.var.services.authService.register(credentials);
  return c.json(response);
});

auth.post('/verify-2fa', async (c) => {
  const { email, code } = await c.req.json();
  const ipAddress =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for') ||
    '0.0.0.0';
  const response = await c.var.services.authService.verifyTwoFactorLogin(
    email,
    code,
    ipAddress
  );
  return c.json(response);
});

// Protected auth routes (require authentication)
const protectedAuth = new Hono<AppType>();
protectedAuth.use('*', async (c, next) => {
  const token = c.req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const user = await c.var.services.authService.verifyToken(token);
    c.set('user', user);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

protectedAuth.post('/setup-2fa', async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const response = await c.var.services.authService.setupTwoFactor(user.id);
  return c.json(response);
});

protectedAuth.post('/verify-2fa-setup', async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const { code } = await c.req.json();
  const ipAddress =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for') ||
    '0.0.0.0';
  const recoveryCodes = await c.var.services.authService.verifyTwoFactorSetup(
    user.id,
    code,
    ipAddress
  );
  const updatedUser = await c.var.services.authService.getUser(user.id);
  return c.json({ user: updatedUser, recoveryCodes });
});

protectedAuth.get('/recovery-codes', async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const codes = await c.var.services.authService.getRecoveryCodes(user.id);
  return c.json({ recoveryCodes: codes });
});

protectedAuth.post('/disable-2fa', async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const { code } = await c.req.json();
  const ipAddress =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for') ||
    '0.0.0.0';
  await c.var.services.authService.disableTwoFactor(user.id, code, ipAddress);
  const updatedUser = await c.var.services.authService.getUser(user.id);
  return c.json({ user: updatedUser });
});

// Mount auth routes
app.route('/auth', auth);
app.route('/auth', protectedAuth);

// Protected API routes
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const user = await c.var.services.authService.verifyToken(token);
    c.set('user', user);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

app.get('/api/urls', async (c) => {
  // TODO: Implement get user's URLs
  return c.json({ message: 'Not implemented' });
});

app.post('/api/urls', async (c) => {
  const body = await c.req.json();
  const result = await c.var.services.chopUrl.createShortUrl(body.url);
  return c.json(result);
});

app.get('/:shortId', async (c) => {
  const shortId = c.req.param('shortId');
  const url = await c.var.services.chopUrl.getOriginalUrl(shortId);
  return c.redirect(url);
});

export default app;
