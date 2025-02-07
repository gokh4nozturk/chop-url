import { ChopUrl } from '@chop-url/lib';
import { swaggerUI } from '@hono/swagger-ui';
import { Context, Hono } from 'hono';
import { cors } from 'hono/cors';

import auth, { User, AuthRequest } from './auth.js';
import { createAuthRoutes } from './auth/routes.js';
import { AuthService } from './auth/service.js';
import { ILoginCredentials, IRegisterCredentials } from './auth/types.js';
import { openApiSchema } from './openapi.js';

export interface Env {
  DB: D1Database;
  BASE_URL: string;
}

type Variables = {
  user: User;
  authService: AuthService;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS middleware configuration
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000'], // Sadece frontend'in originini kabul edelim
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposeHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth middleware
async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: () => Promise<void>
) {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - Token:', token);

    if (!token) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const user = await auth.verifySession(c.env, token);
    console.log('Auth middleware - User:', user);

    if (!user) {
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }

    c.set('user', user);
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
}

// AuthService middleware
app.use('/api/auth/*', async (c, next) => {
  const authService = new AuthService(c.env.DB);
  c.set('authService', authService);
  await next();
});

// Auth routes
const authRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Public routes
authRouter.post('/login', async (c) => {
  try {
    const authService = c.get('authService');
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

authRouter.post('/register', async (c) => {
  try {
    const authService = c.get('authService');
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

authRouter.post('/refresh', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    console.log('Refresh endpoint - Token:', token);

    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    const result = await auth.refreshSession(c.env, token);
    console.log('Refresh endpoint - Result:', result);

    if (!result) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    return c.json(result);
  } catch (error) {
    console.error('Refresh token error:', error);
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

// Protected routes
authRouter.use('/*', authMiddleware);

authRouter.get('/me', async (c) => {
  try {
    console.log(
      'Me endpoint called with token:',
      c.req.header('Authorization')
    );
    const user = c.get('user');
    console.log('User from context:', user);
    return c.json({ user });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

authRouter.put('/profile', async (c) => {
  try {
    const user = c.get('user');
    const authService = c.get('authService');
    const data = await c.req.json();
    const updatedUser = await authService.updateProfile(user.id, data);
    return c.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: 'Internal server error' }, 500);
  }
});

authRouter.post('/logout', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    await auth.deleteSession(c.env, token);
  }
  return c.json({ success: true });
});

// Mount auth routes
app.route('/api/auth', authRouter);

// URL shortening routes
app.post(
  '/api/shorten',
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const { url, customSlug } = await c.req.json();
    const token = c.req.header('Authorization')?.replace('Bearer ', '');

    if (!url) {
      return c.json({ error: 'Invalid URL' }, 400);
    }

    const user = token ? await auth.verifySession(c.env, token) : null;

    try {
      const chopUrl = new ChopUrl({
        baseUrl: c.env.BASE_URL,
        db: c.env.DB,
      });

      const result = await chopUrl.createShortUrl(url, { customSlug });

      return c.json(
        {
          shortUrl: result.shortUrl,
          shortId: result.shortId,
          originalUrl: result.originalUrl,
          createdAt: result.createdAt.toISOString(),
        },
        200
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Custom slug is already taken') {
          return c.json({ error: 'Custom slug already exists' }, 409);
        }
        if (error.message === 'Invalid URL') {
          return c.json({ error: 'Invalid URL' }, 400);
        }
      }
      console.error('Error creating short URL:', error);
      return c.json({ error: 'Failed to create short URL' }, 500);
    }
  }
);

app.get(
  '/api/urls',
  authMiddleware,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const user = c.get('user');
    const urls = await c.env.DB.prepare(
      'SELECT * FROM urls WHERE user_id = ? ORDER BY created_at DESC'
    )
      .bind(user.id)
      .all();

    return c.json(urls);
  }
);

app.get(
  '/api/:shortId',
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    try {
      const shortId = c.req.param('shortId');
      const chopUrl = new ChopUrl({
        baseUrl: c.env.BASE_URL,
        db: c.env.DB,
      });

      const originalUrl = await chopUrl.getOriginalUrl(shortId);
      return c.redirect(originalUrl, 302);
    } catch (error) {
      if (error instanceof Error && error.message === 'URL not found') {
        return c.json({ error: 'URL not found' }, 404);
      }
      console.error('Error expanding URL:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

app.get(
  '/api/stats/:shortId',
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    try {
      const shortId = c.req.param('shortId');
      const chopUrl = new ChopUrl({
        baseUrl: c.env.BASE_URL,
        db: c.env.DB,
      });

      const stats = await chopUrl.getUrlInfo(shortId);
      return c.json(stats);
    } catch (error) {
      if (error instanceof Error && error.message === 'URL not found') {
        return c.json({ error: 'URL not found' }, 404);
      }
      console.error('Error getting URL stats:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// Add Swagger UI route before other routes
app.get(
  '/docs',
  swaggerUI({
    url: '/api/openapi.json',
  })
);

app.get(
  '/api/openapi.json',
  (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    return c.json(openApiSchema);
  }
);

export default app;
