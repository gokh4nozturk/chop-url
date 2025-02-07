import { ChopUrl } from '@chop-url/lib';
import { swaggerUI } from '@hono/swagger-ui';
import { Context, Hono } from 'hono';
import { cors } from 'hono/cors';

import auth, { User, AuthRequest } from './auth.js';
import { openApiSchema } from './openapi.js';

export interface Env {
  DB: D1Database;
  BASE_URL: string;
}

type Variables = {
  user: User;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS middleware configuration
app.use(
  '*',
  cors({
    origin:
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : ['https://app.chop-url.com', 'https://api.chop-url.com'],
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
    console.log(
      'Auth middleware called with token:',
      c.req.header('Authorization')
    );

    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    console.log('Extracted token:', token);

    if (!token) {
      return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const user = await auth.verifySession(c.env, token);
    console.log('User from verifySession:', user);

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

// Auth endpoints
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json<AuthRequest>();
  const { email, password } = body;

  // Validate input
  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  if (!auth.isValidEmail(email)) {
    return c.json({ error: 'Invalid email format' }, 400);
  }

  if (!auth.isValidPassword(password)) {
    return c.json(
      { error: 'Password must be at least 8 characters long' },
      400
    );
  }

  try {
    const user = await auth.createUser(c.env, email, password);
    const token = await auth.createSession(c.env, user.id);

    return c.json({ user, token });
  } catch (error) {
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Email already exists' }, 409);
    }
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json<AuthRequest>();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const user = await auth.verifyUser(c.env, email, password);
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await auth.createSession(c.env, user.id);
  return c.json({ user, token });
});

app.post('/api/auth/logout', authMiddleware, async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    await auth.deleteSession(c.env, token);
  }
  return c.json({ success: true });
});

app.post('/api/auth/refresh', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    console.log('Refresh endpoint called with header:', authHeader);

    const token = authHeader?.replace('Bearer ', '');
    console.log('Extracted token:', token);

    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    const result = await auth.refreshSession(c.env, token);
    console.log('Refresh result:', result);

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

app.get('/api/auth/me', authMiddleware, async (c) => {
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
