import { auth } from '@/auth/middleware';
import { Env, Variables } from '@/types';
import { errorResponseSchemas, handleError } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import {
  updateUrlSchema,
  urlListResponseSchema,
  urlResponseSchema,
} from '../schemas';
import { UrlService } from '../service';

const urlManagementRouter = new OpenAPIHono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Apply auth middleware to all routes
urlManagementRouter.use('*', auth());

urlManagementRouter.openapi(
  createRoute({
    method: 'get',
    path: '/',
    description: 'Get all URLs for the authenticated user',
    parameters: [
      {
        name: 'shortId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
        description: 'Short ID of the URL',
      },
    ],
    tags: ['URL - Management'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: urlListResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  async (c) => {
    try {
      const user = c.get('user');
      const db = c.get('db');
      const urlService = new UrlService(c.env.BASE_URL, db);
      const urls = await urlService.getUserUrls(user.id.toString());
      return c.json(urls, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

urlManagementRouter.openapi(
  createRoute({
    method: 'get',
    path: '/:shortId',
    description: 'Get a specific URL by short ID',
    parameters: [
      {
        name: 'shortId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
        description: 'Short ID of the URL',
      },
    ],
    tags: ['URL - Management'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: urlResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  async (c) => {
    try {
      const shortId = c.req.param('shortId');
      const user = c.get('user');
      const db = c.get('db');
      const urlService = new UrlService(c.env.BASE_URL, db);
      const url = await urlService.getUrl(shortId);
      return c.json(url, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

urlManagementRouter.openapi(
  createRoute({
    method: 'patch',
    path: '/:shortId',
    description: 'Update a URL',
    parameters: [
      {
        name: 'shortId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
        description: 'Short ID of the URL',
      },
    ],
    tags: ['URL - Management'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: urlResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  async (c) => {
    try {
      const shortId = c.req.param('shortId');
      const user = c.get('user');
      const db = c.get('db');
      const body = await c.req.json();
      const data = updateUrlSchema.parse(body);
      const urlService = new UrlService(c.env.BASE_URL, db);
      const url = await urlService.updateUrl(shortId, user.id, data);
      return c.json(url, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

urlManagementRouter.openapi(
  createRoute({
    method: 'delete',
    path: '/:shortId',
    description: 'Delete a URL',
    parameters: [
      {
        name: 'shortId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
        description: 'Short ID of the URL',
      },
    ],
    tags: ['URL - Management'],
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: urlResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  async (c) => {
    try {
      const shortId = c.req.param('shortId');
      const user = c.get('user');
      const db = c.get('db');
      const urlService = new UrlService(c.env.BASE_URL, db);
      await urlService.deleteUrl(shortId, user.id);
      return c.json({ message: 'URL deleted successfully' }, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

export default urlManagementRouter;
