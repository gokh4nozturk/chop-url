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

interface Variables {
  services: {
    chopUrl: ChopUrl;
    authService: AuthService;
  };
  user?: IUser;
}

export type AppType = {
  Bindings: Env;
  Variables: Variables;
};

const app = new Hono<AppType>();

// Middleware
app.use('*', cors());

// Create services
const createServices = (db: D1Database) => {
  const chopUrl = new ChopUrl({
    db,
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://chop.url',
  });
  const authService = new AuthService(db);
  return { chopUrl, authService };
};

// Initialize services middleware
app.use('*', async (c, next) => {
  try {
    const services = createServices(c.env.DB);
    c.set('services', services);
    await next();
  } catch (error) {
    console.error('Error initializing services:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
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

// Public URL routes
app.post('/shorten', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.url) {
      return c.json({ error: 'Invalid URL' }, 400);
    }

    const result = await c.var.services.chopUrl.createShortUrl(body.url);
    return c.json(result);
  } catch (error) {
    console.error('Error creating short URL:', error);
    if (error instanceof Error && error.message === 'Invalid URL') {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: 'Failed to create short URL' }, 500);
  }
});

app.get('/api/stats/:shortId', async (c) => {
  try {
    const shortId = c.req.param('shortId');
    const urlInfo = await c.var.services.chopUrl.getUrlInfo(shortId);

    if (!urlInfo) {
      return c.json({ error: 'URL not found' }, 404);
    }

    return c.json({
      visitCount: urlInfo.visitCount,
      lastAccessedAt: urlInfo.lastAccessedAt,
      createdAt: urlInfo.createdAt,
      originalUrl: urlInfo.originalUrl,
    });
  } catch (error) {
    console.warn('Error fetching URL stats:', error);
    if (error instanceof Error && error.message === 'URL not found') {
      return c.json({ error: 'URL not found' }, 404);
    }
    return c.json({ error: 'Internal server error', errorMessage: error }, 500);
  }
});

app.get('/:shortId', async (c) => {
  try {
    const shortId = c.req.param('shortId');
    const originalUrl = await c.var.services.chopUrl.getOriginalUrl(shortId);

    if (!originalUrl) {
      return c.json({ error: 'URL not found' }, 404);
    }

    // Ziyaret sayısını artır
    await c.env.DB.prepare(
      'UPDATE urls SET visit_count = visit_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE short_id = ?'
    )
      .bind(shortId)
      .run();

    c.header('Location', originalUrl);
    return c.text('', 302);
  } catch (error) {
    if (error instanceof Error && error.message === 'URL not found') {
      return c.json({ error: 'URL not found' }, 404);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

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

// Protected URL routes
app.get('/api/urls', async (c) => {
  // TODO: Implement get user's URLs
  return c.json({ message: 'Not implemented' });
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

export default app;
