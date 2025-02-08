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

const app = new Hono<{ Bindings: Env }>();

// Initialize database
app.use('*', async (c, next) => {
  createDb(c.env.DB);
  await next();
});

// CORS middleware configuration
app.use(
  '*',
  cors({
    origin: [
      'https://app.chop-url.com',
      'http://localhost:3000',
      'http://localhost:8787',
    ],
  })
);

// OpenAPI schema endpoint - Bu endpoint'i üste taşıyoruz
app.get('/openapi.json', (c) => {
  return c.json(openApiSchema);
});

// Add Swagger UI route
app.get(
  '/docs',
  swaggerUI({
    url: '/openapi.json', // URL'i güncelliyoruz
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
