import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { createAnalyticsRoutes } from './analytics/routes';
import { createAuthRoutes } from './auth/routes';
import { createDb } from './db/client';
import { createDomainRoutes } from './domain/routes';
import { openApiSchema } from './openapi.js';
import { createUrlRoutes } from './url/routes';
import { WebSocketService } from './websocket/service';

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
  db: ReturnType<typeof createDb>;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
const wsService = new WebSocketService();

// Initialize DB middleware
app.use('*', async (c, next) => {
  const db = createDb(c.env.DB);
  c.set('db', db);
  await next();
});

// CORS middleware
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://chop-url.com'],
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

// Mount routes
app.route('/api/auth', createAuthRoutes());
app.route('/api', createUrlRoutes());
app.route('/api', createDomainRoutes());
app.route('/api', createAnalyticsRoutes());

// Root route - redirect to docs
app.get('/', (c) => {
  return c.redirect('/docs');
});

export default app;
