import { swaggerUI } from '@hono/swagger-ui';
import { Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAuthRoutes } from './auth/routes.js';
import { AuthService } from './auth/service.js';
import { openApiSchema } from './openapi.js';
import { createUrlRoutes } from './url/routes.js';
export interface Env {
  DB: D1Database;
  BASE_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware configuration
app.use(
  '/api/*',
  cors({
    origin: ['https://app.chop-url.com', 'http://localhost:3000'],
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

// Add Swagger UI route
app.get(
  '/docs',
  swaggerUI({
    url: '/api/openapi.json',
  })
);

// OpenAPI schema endpoint
app.get('/api/openapi.json', (c) => {
  return c.json(openApiSchema);
});

export default app;
