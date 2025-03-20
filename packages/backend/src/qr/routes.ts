import { auth } from '@/auth/middleware';
import { Env, Variables } from '@/types';
import { errorResponseSchemas, handleError } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { qrHandlers } from './handlers';
import { qrSchemas } from './schemas';

const qrRouter = new OpenAPIHono<{ Bindings: Env; Variables: Variables }>();

qrRouter.use('*', auth());

qrRouter.openapi(
  createRoute({
    method: 'post',
    path: '/',
    description: 'Create a QR code',
    tags: ['QR Codes'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: qrSchemas.createQRCode,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'QR code created successfully',
        content: {
          'application/json': {
            schema: qrSchemas.qrCode,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  async (c) => {
    try {
      const result = await qrHandlers.createQRCode(c);

      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

qrRouter.openapi(
  createRoute({
    method: 'get',
    path: '/:id',
    description: 'Get a QR code by ID',
    tags: ['QR Codes'],
    responses: {
      200: {
        description: 'QR code retrieved successfully',
        content: {
          'application/json': {
            schema: qrSchemas.qrCode,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  async (c) => {
    try {
      const result = await qrHandlers.getQRCodeById(c);

      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

qrRouter.openapi(
  createRoute({
    method: 'put',
    path: '/:id',
    description: 'Update a QR code by ID',
    tags: ['QR Codes'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: qrSchemas.updateQRCode,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'QR code updated successfully',
        content: {
          'application/json': {
            schema: qrSchemas.qrCode,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  async (c) => {
    try {
      const result = await qrHandlers.updateQRCode(c);

      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

qrRouter.openapi(
  createRoute({
    method: 'post',
    path: '/:id/download',
    description: 'Increment download count',
    tags: ['QR Codes'],
    responses: {
      200: {
        description: 'Download count incremented successfully',
        content: {
          'application/json': {
            schema: qrSchemas.success,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  async (c) => {
    try {
      const result = await qrHandlers.incrementDownloadCount(c);

      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

qrRouter.openapi(
  createRoute({
    method: 'get',
    path: '/url/:urlId',
    description: 'Get QR code by URL ID',
    tags: ['QR Codes'],
    responses: {
      200: {
        description: 'QR code retrieved successfully',
        content: {
          'application/json': {
            schema: qrSchemas.qrCode,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  async (c) => {
    try {
      const result = await qrHandlers.getQRCodeByUrlId(c);

      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

export default qrRouter;
