import { withOpenAPI } from '@/utils/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { H } from '../types/hono.types';
import { RouteGroup } from '../types/route.types';
import { handleError } from '../utils/error';
import { createRouteGroup } from '../utils/route-factory';
import { qrHandlers } from './handlers';
import { qrSchemas } from './schemas';

// QR route groups
const qrRoutes: RouteGroup[] = [
  {
    prefix: '/qr',
    tag: 'QR_CODES',
    description: 'QR code operations',
    routes: [
      {
        path: '/create',
        method: 'post',
        description: 'Create a QR code',
        schema: {
          request: qrSchemas.createQRCode,
          response: qrSchemas.qrCode,
        },
        requiresAuth: true,
        handler: qrHandlers.createQRCode,
      },
      {
        path: '/url/:urlId',
        method: 'get',
        description: 'Get QR code by URL ID',
        schema: {
          response: qrSchemas.qrCode,
        },
        handler: qrHandlers.getQRCodeByUrlId,
      },
      {
        path: '/:id',
        method: 'get',
        description: 'Get QR code by ID',
        schema: {
          response: qrSchemas.qrCode,
        },
        handler: qrHandlers.getQRCodeById,
      },
      {
        path: '/:id',
        method: 'put',
        description: 'Update QR code',
        schema: {
          request: qrSchemas.updateQRCode,
          response: qrSchemas.qrCode,
        },
        handler: qrHandlers.updateQRCode,
      },
      {
        path: '/:id/download',
        method: 'post',
        description: 'Increment download count',
        schema: {
          response: qrSchemas.success,
        },
        handler: qrHandlers.incrementDownloadCount,
      },
    ],
  },
];

// Create base router
const createBaseQRRoutes = () => {
  const router = new OpenAPIHono<H>();

  // Register all routes with middleware
  for (const route of qrRoutes.flatMap((group) => createRouteGroup(group))) {
    const middlewares = [];

    // Add validation middleware if schema exists
    if (route.schema?.request) {
      middlewares.push(zValidator('json', route.schema.request));
    }

    // Register route with error handling
    router[route.method](route.path, ...middlewares, async (c) => {
      try {
        return await route.handler(c);
      } catch (error) {
        return handleError(c, error);
      }
    });
  }

  return router;
};

export const createQRRoutes = withOpenAPI(createBaseQRRoutes, '');
