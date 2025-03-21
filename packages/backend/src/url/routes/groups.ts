import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { auth } from '../../auth/middleware';
import { Env, Variables } from '../../types';
import {
  ErrorCode,
  errorResponseSchemas,
  handleError,
} from '../../utils/error';
import {
  createUrlGroupSchema,
  updateUrlGroupSchema,
  urlGroupResponseSchema,
} from '../schemas';
import { UrlService } from '../service';

// Create a router for URL group endpoints
const urlGroupRouter = new OpenAPIHono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Apply auth middleware to all routes
urlGroupRouter.use('*', auth());

// Create URL group
urlGroupRouter.openapi(
  createRoute({
    method: 'post',
    path: '/create',
    summary: 'Create a new URL group',
    description: 'Create a new URL group',
    tags: ['URL Groups'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: createUrlGroupSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'URL group created successfully',
        content: {
          'application/json': {
            schema: urlGroupResponseSchema,
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
      const body = await c.req.json();
      const { name, description } = createUrlGroupSchema.parse(body);
      const user = c.get('user');
      const db = c.get('db');

      const urlService = new UrlService(c.env.BASE_URL, db);
      const group = await urlService.createUrlGroup(
        name,
        description || null,
        user.id
      );

      return c.json(group, 201);
    } catch (error) {
      handleError(c, error);
    }
  }
);

// List URL groups
urlGroupRouter.openapi(
  createRoute({
    method: 'get',
    path: '/',
    summary: 'List all URL groups',
    description: 'List all URL groups for the authenticated user',
    tags: ['URL Groups'],
    responses: {
      200: {
        description: 'URL groups retrieved successfully',
        content: {
          'application/json': {
            schema: z.array(urlGroupResponseSchema),
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.serverError,
    },
  }),
  async (c) => {
    try {
      const user = c.get('user');
      const db = c.get('db');
      const urlService = new UrlService(c.env.BASE_URL, db);
      const groups = await urlService.getUserUrlGroups(user.id);
      return c.json(groups, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

// Get specific URL group
urlGroupRouter.openapi(
  createRoute({
    method: 'get',
    path: '/:id',
    summary: 'Get a specific URL group',
    description: 'Get a specific URL group by ID',
    tags: ['URL Groups'],
    responses: {
      200: {
        description: 'URL group retrieved successfully',
        content: {
          'application/json': {
            schema: urlGroupResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.serverError,
    },
  }),
  async (c) => {
    try {
      const groupId = parseInt(c.req.param('id'));
      const user = c.get('user');
      const db = c.get('db');
      const urlService = new UrlService(c.env.BASE_URL, db);
      const group = await urlService.getUrlGroup(groupId, user.id);

      if (!group) {
        return c.json(
          {
            code: ErrorCode.RESOURCE_NOT_FOUND,
            message: 'URL group not found',
          },
          404
        );
      }

      return c.json(group, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

// Update URL group
urlGroupRouter.openapi(
  createRoute({
    method: 'put',
    path: '/:id',
    summary: 'Update a specific URL group',
    description: 'Update a specific URL group by ID',
    tags: ['URL Groups'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: updateUrlGroupSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'URL group updated successfully',
        content: {
          'application/json': {
            schema: urlGroupResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.serverError,
    },
  }),
  async (c) => {
    try {
      const groupId = parseInt(c.req.param('id'));
      const body = await c.req.json();
      const data = updateUrlGroupSchema.parse(body);
      const user = c.get('user');
      const db = c.get('db');
      const urlService = new UrlService(c.env.BASE_URL, db);
      const group = await urlService.updateUrlGroup(groupId, user.id, data);
      return c.json(group, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

// Delete URL group
urlGroupRouter.openapi(
  createRoute({
    method: 'delete',
    path: '/:id',
    summary: 'Delete a specific URL group',
    description: 'Delete a specific URL group by ID',
    tags: ['URL Groups'],
    responses: {
      200: {
        description: 'URL group deleted successfully',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.serverError,
    },
  }),
  async (c) => {
    try {
      const groupId = parseInt(c.req.param('id'));
      const user = c.get('user');
      const db = c.get('db');
      const urlService = new UrlService(c.env.BASE_URL, db);
      await urlService.deleteUrlGroup(groupId, user.id);
      return c.json({ message: 'URL group deleted successfully' }, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

export default urlGroupRouter;
