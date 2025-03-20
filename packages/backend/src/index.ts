import analyticsRoutes from '@/analytics/routes';
import {
  analyticsRoutes as urlAnalyticsRoutes,
  managementRoutes,
  shorteningRoutes,
  urlGroupRouter,
} from '@/url/routes';
import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { createFeedbackRoutes } from './admin/feedback/routes';
import { createWaitListRoutes } from './admin/waitlist/routes';
import { createAuthRoutes } from './auth/routes';
import { createDb } from './db/client';
import { createDomainRoutes } from './domain/routes';
import { createQRRoutes } from './qr/routes';
import { createStorageRoutes } from './storage/routes';
import { Env, Variables } from './types';
import { WebSocketService } from './websocket/service';

const app = new OpenAPIHono<{ Bindings: Env; Variables: Variables }>();
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

// Auth routes
app.route('/api', createAuthRoutes());
// URL routes
app.route('/api/urls', shorteningRoutes);
app.route('/api/urls/groups', urlGroupRouter);
app.route('/api/urls/analytics', urlAnalyticsRoutes);
app.route('/api/urls/management', managementRoutes);
// Domain routes
app.route('/api', createDomainRoutes());
// Analytics routes
app.route('/api/analytics', analyticsRoutes);
// Storage routes
app.route('/api', createStorageRoutes());
// QR routes
app.route('/api', createQRRoutes());

// Admin routes
app.route('/api/admin', createWaitListRoutes());
app.route('/api/admin', createFeedbackRoutes());
// Root route - redirect to docs
app.get('/', (c) => {
  return c.redirect('/api-docs');
});

export default app;
