import { authHandlers } from '@/auth/handlers';
import { auth } from '@/auth/middleware';
import { authSchemas } from '@/auth/schemas';
import { H } from '@/types';
import { errorResponseSchemas } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';

const profileRouter = new OpenAPIHono<H>();

profileRouter.use('*', auth());

profileRouter.openapi(
  createRoute({
    method: 'put',
    path: '/',
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
  // @ts-ignore
  (c) => {
    return authHandlers.updateProfile(c);
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
  // @ts-ignore
  (c) => {
    return authHandlers.updatePassword(c);
  }
);

export default profileRouter;
