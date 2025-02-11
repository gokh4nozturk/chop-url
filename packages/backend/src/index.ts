import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAuthRoutes } from './auth/routes.js';
import { createDb } from './db/client';
import { openApiSchema } from './openapi.js';
import { createUrlRoutes } from './url/routes.js';

export interface Env {
  DB: D1Database;
  BASE_URL: string;
  FRONTEND_URL: string;
  RESEND_API_KEY: string;
}

interface Variables {
  db: ReturnType<typeof createDb>;
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Initialize database
app.use('*', async (c, next) => {
  if (!c.get('db')) {
    const db = createDb(c.env.DB);
    c.set('db', db);
  }
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

// Mount auth routes
app.route('/api/auth', createAuthRoutes());

// Mount URL routes
app.route('/api', createUrlRoutes());

// Root route - redirect to docs
app.get('/', (c) => {
  return c.redirect('/docs');
});

export default app;
