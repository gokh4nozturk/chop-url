import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { ChopUrl } from '@chop-url/lib';
import { openApiSchema } from './openapi';
import { Auth } from '@auth/core';
import { D1Adapter } from '@auth/d1-adapter';
import { createDb } from './db';

interface Env {
  DB: D1Database;
  BASE_URL: string;
  AUTH_SECRET: string;
  GITHUB_ID: string;
  GITHUB_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: '*',  // Allow all origins
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowHeaders: ['*'],  // Allow all headers
  exposeHeaders: ['*'],  // Expose all headers
  credentials: true,  // Require credentials
  maxAge: 86400,
}));

// Auth configuration
app.all('/auth/*', async (c) => {
  const db = createDb(c.env.DB);
  const request = c.req.raw;
  const url = new URL(request.url);

  try {
    const response = await Auth(request, {
      adapter: D1Adapter(c.env.DB),
      secret: c.env.AUTH_SECRET,
      trustHost: true,
      pages: {
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
      },
      callbacks: {
        async signIn({ user, account, profile }) {
          return true;
        },
        async session({ session, user }) {
          return session;
        },
        async jwt({ token, user, account }) {
          return token;
        },
        async redirect({ url, baseUrl }) {
          // Başarılı girişten sonra docs sayfasına yönlendir
          return `${baseUrl}/docs`;
        },
      },
      providers: [
        {
          id: 'github',
          name: 'GitHub',
          type: 'oauth',
          authorization: 'https://github.com/login/oauth/authorize',
          token: 'https://github.com/login/oauth/access_token',
          userinfo: 'https://api.github.com/user',
          clientId: c.env.GITHUB_ID,
          clientSecret: c.env.GITHUB_SECRET,
          profile(profile) {
            return {
              id: profile.id.toString(),
              name: profile.name || profile.login,
              email: `${profile.id}@github.com`,
              image: profile.avatar_url,
            };
          },
        },
      ],
    });

    if (!response) {
      throw new Error('No response from auth');
    }

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', url.origin);
    headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ error: 'Authentication failed', details: error.message }, 500);
  }
});

// Handle OPTIONS requests explicitly
app.options('*', (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
});

// API Documentation
app.get('/docs/openapi.json', (c) => c.json(openApiSchema));
app.get('/docs', async (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Chop URL API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '/docs/openapi.json',
                dom_id: '#swagger-ui',
            });
        };
    </script>
</body>
</html>`;
  return c.html(html);
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// API Routes
app.post('/urls', async (c) => {
  try {
    const body = await c.req.json<{ url: string }>();
    console.log('Received request body:', body);

    if (!body.url) {
      return c.json({ error: 'URL is required' }, 400);
    }

    const url = body.url.trim();
    console.log('Processing URL:', url);

    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      console.error('Invalid URL format:', error);
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    const chopUrl = new ChopUrl({
      baseUrl: `https://${c.env.BASE_URL}`,
      db: c.env.DB
    });

    console.log('Creating short URL with base URL:', c.env.BASE_URL);
    const shortUrl = await chopUrl.createShortUrl(url);
    console.log('Created short URL:', shortUrl);
    
    return c.json(shortUrl);
  } catch (error) {
    console.error('Error creating short URL:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to create short URL',
      details: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

app.get('/urls/:shortId', async (c) => {
  const { shortId } = c.req.param();
  const chopUrl = new ChopUrl({
    baseUrl: `https://${c.env.BASE_URL}`,
    db: c.env.DB
  });

  try {
    const urlInfo = await chopUrl.getUrlInfo(shortId);
    return c.json(urlInfo);
  } catch (error) {
    return c.json({ error: 'URL not found' }, 404);
  }
});

app.get('/:shortId', async (c) => {
  const { shortId } = c.req.param();
  const chopUrl = new ChopUrl({
    baseUrl: `https://${c.env.BASE_URL}`,
    db: c.env.DB
  });

  try {
    const originalUrl = await chopUrl.getOriginalUrl(shortId);
    return c.redirect(originalUrl);
  } catch (error) {
    return c.json({ error: 'URL not found' }, 404);
  }
});

export default app; 