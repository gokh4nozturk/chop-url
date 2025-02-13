import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAuthRoutes } from './auth/routes';
import { db } from './db';
import { createDomainRoutes } from './domain/routes';
import { openApiSchema } from './openapi.js';
import { createUrlRoutes } from './url/routes';

export interface Env {
  DB: D1Database;
  BASE_URL: string;
  FRONTEND_URL: string;
  RESEND_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_ZONE_ID: string;
}

type Variables = {
  db: ReturnType<typeof db>;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Initialize DB middleware
app.use('*', async (c, next) => {
  c.set('db', db(c.env.DB));
  await next();
});

// CORS middleware configuration
app.use(
  '*',
  cors({
    origin: ['https://app.chop-url.com', 'http://localhost:3000'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'X-Custom-Header',
      'Upgrade-Insecure-Requests',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials',
    ],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision', 'Authorization'],
    maxAge: 600,
  })
);

// OpenAPI schema endpoint
app.get('/openapi.json', (c) => {
  return c.json(openApiSchema);
});

// Add Swagger UI route
app.get(
  '/docs',
  swaggerUI({
    url: '/openapi.json',
    defaultModelsExpandDepth: 3,
    docExpansion: 'list',
    persistAuthorization: true,
  })
);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.route('/api/auth', createAuthRoutes());
app.route('/api', createUrlRoutes());
app.route('/api', createDomainRoutes());

// Root route - redirect to docs
app.get('/', (c) => {
  return c.redirect('/docs');
});

export default app;
