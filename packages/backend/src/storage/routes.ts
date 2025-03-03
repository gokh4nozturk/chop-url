import { withOpenAPI } from '@/utils/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { H } from '../types/hono.types';
import { RouteGroup } from '../types/route.types';
import { handleError } from '../utils/error';
import { createRouteGroup } from '../utils/route-factory';
import { generatePresignedUrlHandler, getPublicUrlHandler } from './handlers';
import {
  presignedUrlSchema,
  publicUrlSchema,
  urlResponseSchema,
} from './schemas';

// Storage route groups
const storageRoutes: RouteGroup[] = [
  {
    prefix: '/storage',
    tag: 'STORAGE',
    description: 'Storage management endpoints',
    routes: [
      {
        path: '/generate-presigned-url',
        method: 'post',
        description: 'Generate a presigned URL for file upload/download',
        schema: {
          request: presignedUrlSchema,
          response: urlResponseSchema,
        },
        handler: generatePresignedUrlHandler,
      },
      {
        path: '/public-url',
        method: 'get',
        description: 'Get a public URL for a file',
        schema: {
          request: publicUrlSchema,
          response: urlResponseSchema,
        },
        handler: getPublicUrlHandler,
      },
    ],
  },
];

// Create base router
const createBaseStorageRoutes = () => {
  const router = new OpenAPIHono<H>();

  // Register all routes with middleware
  for (const route of storageRoutes.flatMap((group) =>
    createRouteGroup(group)
  )) {
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

export const createStorageRoutes = withOpenAPI(createBaseStorageRoutes, '/api');
