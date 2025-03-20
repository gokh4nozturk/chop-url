import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { createFeedbackRoutes } from './admin/feedback/routes';
import { createWaitListRoutes } from './admin/waitlist/routes';
import { createAnalyticsRoutes } from './analytics/routes';
import { createAuthRoutes } from './auth/routes';
import { createDb } from './db/client';
import { createDomainRoutes } from './domain/routes';
import { createQRRoutes } from './qr/routes';
import { createStorageRoutes } from './storage/routes';
import { Env, Variables } from './types';
import { createUrlRoutes } from './url/routes';
import { WebSocketService } from './websocket/service';

const app = new OpenAPIHono<{ Bindings: Env; Variables: Variables }>();
const wsService = new WebSocketService();

// Initialize DB middleware
app.use('*', async (c, next) => {
  const db = createDb(c.env.DB);
  c.set('db', db);
  await next();
});

// Trailing slash middleware - redirects or removes trailing slashes
app.use('*', async (c, next) => {
  const url = new URL(c.req.url);

  // Only apply to paths that aren't root or legitimate index endpoints
  // Allow routes specifically ending with '/' like '/api/auth/profile/'
  if (
    url.pathname.length > 1 &&
    url.pathname.endsWith('/') &&
    !url.pathname.endsWith('/index/') &&
    !url.pathname.match(/\/api\/[^\/]+\/$/)
  ) {
    // Remove trailing slash
    const newPath = url.pathname.slice(0, -1) + url.search;
    return c.redirect(newPath, 301);
  }
  await next();
});

// CORS middleware
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'https://chop-url.com',
      'https://api.chop-url.com',
      'https://chop-url.vercel.app/',
      'https://app.chop-url.com',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowHeaders: [
      'Origin',
      'Content-Type',
      'Accept',
      'Authorization',
      'Upgrade',
      'Connection',
      'Sec-WebSocket-Key',
      'Sec-WebSocket-Version',
      'Sec-WebSocket-Extensions',
    ],
    exposeHeaders: ['Content-Length', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400,
  })
);

// OpenAPI schema endpoint
app.doc('/api-docs/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'Chop URL API',
    version: '1.0.0',
    description: 'URL Shortener Service API Documentation',
  },
  servers: [
    {
      url: 'http://localhost:8787',
      description: 'Development server',
    },
    {
      url: 'https://api.chop-url.com',
      description: 'Production server',
    },
  ],
});

// Add Swagger UI route
app.get(
  '/docs',
  swaggerUI({
    url: '/api-docs/openapi.json',
    defaultModelsExpandDepth: 3,
    docExpansion: 'list',
    persistAuthorization: true,
  })
);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket endpoint
app.get('/ws', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return c.json({ error: 'Expected Upgrade: websocket' }, 426);
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  wsService.handleConnection(server);

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
});

// API Documentation UI
app.get(
  '/api-docs',
  apiReference({
    spec: {
      url: '/api-docs/openapi.json',
    },
    theme: 'saturn',
    layout: 'modern',
  })
);

// Mount routes
app.route('/api', createAuthRoutes());
app.route('/api', createUrlRoutes());
app.route('/api', createDomainRoutes());
app.route('/api', createAnalyticsRoutes());
app.route('/api', createStorageRoutes());
app.route('/api', createQRRoutes());

// Admin routes
app.route('/api/admin', createWaitListRoutes());
app.route('/api/admin', createFeedbackRoutes());

app.routes.map((route) => {
  console.log('app.routes', route.path);
});

// Root route - redirect to docs
app.get('/', (c) => {
  return c.redirect('/api-docs');
});

export default app;
