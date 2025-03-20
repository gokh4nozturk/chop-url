import { authHandlers } from '@/auth/handlers';
import { auth } from '@/auth/middleware';
import { authSchemas } from '@/auth/schemas';
import { Env, Variables } from '@/types';
import { handleError } from '@/utils/error';
import { errorResponseSchemas } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';

const profileRouter = new OpenAPIHono<{
  Bindings: Env;
  Variables: Variables;
}>();

profileRouter.use('*', auth());

profileRouter.openapi(
  createRoute({
    method: 'put',
    path: '/profile',
    description: 'Update user profile',
    tags: ['Profile'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authSchemas.updateProfile,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Profile updated successfully',
        content: {
          'application/json': {
            schema: authSchemas.userProfile,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  async (c) => {
    try {
      const result = await authHandlers.updateProfile(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

profileRouter.openapi(
  createRoute({
    method: 'put',
    path: '/password',
    description: 'Update user password',
    tags: ['Profile'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authSchemas.updatePassword,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password updated successfully',
        content: {
          'application/json': {
            schema: authSchemas.userProfile,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  async (c) => {
    try {
      const result = await authHandlers.updatePassword(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);
export default profileRouter;
