import feedbackRoutes from '@/admin/feedback/routes';
import waitlistRoutes from '@/admin/waitlist/routes';
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
import {
  authRouter,
  emailRouter,
  oauthRouter,
  profileRouter,
  twoFactorRouter,
  waitlistRouter,
} from './auth/routes';
import { createDb } from './db/client';
import { createDomainRoutes } from './domain/routes';
import qrRouter from './qr/routes';
import storageRouter from './storage/routes';
import { H } from './types';
import { WebSocketService } from './websocket/service';

const app = new OpenAPIHono<H>();
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

// Register security scheme
app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT Authorization header using the Bearer scheme',
});

// OpenAPI schema endpoint
app.getOpenAPIDocument({
  openapi: '3.1.0',
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

// OpenAPI schema endpoint
app.doc('/api-docs/openapi.json', {
  openapi: '3.1.0',
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
app.route('/api/auth', authRouter);
app.route('/api/auth/email', emailRouter);
app.route('/api/auth/oauth', oauthRouter);
app.route('/api/auth/profile', profileRouter);
app.route('/api/auth/waitlist', waitlistRouter);
app.route('/api/auth/2fa', twoFactorRouter);
// URL routes
app.route('/api/urls', shorteningRoutes);
app.route('/api/urls/groups', urlGroupRouter);
app.route('/api/urls/analytics', urlAnalyticsRoutes);
app.route('/api/urls/management', managementRoutes);
// Analytics routes
app.route('/api/analytics', analyticsRoutes);
// Storage routes
app.route('/api/storage', storageRouter);
// QR routes
app.route('/api/qr', qrRouter);

// Admin routes
app.route('/api/admin/waitlist', waitlistRoutes);
app.route('/api/admin/feedback', feedbackRoutes);
// Root route - redirect to docs
app.get('/', (c) => {
  return c.redirect('/api-docs');
});

export default app;
