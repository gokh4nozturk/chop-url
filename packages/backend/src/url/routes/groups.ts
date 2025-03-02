import { Context } from 'hono';
import { RouteGroup } from '../../types/route.types';
import {
  createUrlGroupSchema,
  updateUrlGroupSchema,
  urlGroupResponseSchema,
} from '../schemas';
import { UrlService } from '../service';

export const urlGroupRoutes: RouteGroup[] = [
  {
    prefix: '/urls',
    tag: 'URL_GROUPS',
    description: 'URL group management endpoints',
    defaultMetadata: {
      requiresAuth: true,
    },
    routes: [
      {
        path: '/groups',
        method: 'get',
        description: 'List all URL groups for the authenticated user',
        handler: async (c: Context) => {
          try {
            const user = c.get('user');
            const db = c.get('db');

            const urlService = new UrlService(c.env.BASE_URL, db);
            const groups = await urlService.getUserUrlGroups(user.id);

            return c.json(groups, 200);
          } catch (error) {
            console.error('Error fetching URL groups:', error);
            return c.json({ error: 'Failed to fetch URL groups' }, 500);
          }
        },
        schema: {
          response: urlGroupResponseSchema,
        },
      },
      {
        path: '/groups',
        method: 'post',
        description: 'Create a new URL group',
        handler: async (c: Context) => {
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
            console.error('Error creating URL group:', error);

            if (error instanceof Error) {
              return c.json({ error: error.message }, 400);
            }

            return c.json({ error: 'Failed to create URL group' }, 500);
          }
        },
        schema: {
          request: createUrlGroupSchema,
          response: urlGroupResponseSchema,
        },
      },
      {
        path: '/groups/:id',
        method: 'get',
        description: 'Get a specific URL group',
        handler: async (c: Context) => {
          try {
            const groupId = parseInt(c.req.param('id'));
            const user = c.get('user');
            const db = c.get('db');

            const urlService = new UrlService(c.env.BASE_URL, db);
            const group = await urlService.getUrlGroup(groupId, user.id);

            if (!group) {
              return c.json({ error: 'URL group not found' }, 404);
            }

            return c.json(group, 200);
          } catch (error) {
            console.error('Error fetching URL group:', error);
            return c.json({ error: 'Failed to fetch URL group' }, 500);
          }
        },
        schema: {
          response: urlGroupResponseSchema,
        },
      },
      {
        path: '/groups/:id',
        method: 'put',
        description: 'Update a specific URL group',
        handler: async (c: Context) => {
          try {
            const groupId = parseInt(c.req.param('id'));
            const body = await c.req.json();
            const data = updateUrlGroupSchema.parse(body);
            const user = c.get('user');
            const db = c.get('db');

            const urlService = new UrlService(c.env.BASE_URL, db);
            const group = await urlService.updateUrlGroup(
              groupId,
              user.id,
              data
            );

            return c.json(group, 200);
          } catch (error) {
            console.error('Error updating URL group:', error);

            if (
              error instanceof Error &&
              error.message === 'URL group not found'
            ) {
              return c.json({ error: 'URL group not found' }, 404);
            }

            return c.json({ error: 'Failed to update URL group' }, 500);
          }
        },
        schema: {
          request: updateUrlGroupSchema,
          response: urlGroupResponseSchema,
        },
      },
      {
        path: '/groups/:id',
        method: 'delete',
        description: 'Delete a specific URL group',
        handler: async (c: Context) => {
          try {
            const groupId = parseInt(c.req.param('id'));
            const user = c.get('user');
            const db = c.get('db');

            const urlService = new UrlService(c.env.BASE_URL, db);
            await urlService.deleteUrlGroup(groupId, user.id);

            return c.json({ message: 'URL group deleted successfully' }, 200);
          } catch (error) {
            console.error('Error deleting URL group:', error);

            if (
              error instanceof Error &&
              error.message === 'URL group not found'
            ) {
              return c.json({ error: 'URL group not found' }, 404);
            }

            return c.json({ error: 'Failed to delete URL group' }, 500);
          }
        },
        schema: {
          response: urlGroupResponseSchema,
        },
      },
    ],
  },
];
