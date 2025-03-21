import { H } from '@/types';
import { errorResponseSchemas } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { authHandlers } from '../handlers';
import { auth } from '../middleware';
import { authSchemas } from '../schemas';

const authRouter = new OpenAPIHono<H>();

authRouter.use('/me', auth());

authRouter.openapi(
  createRoute({
    method: 'get',
    path: '/me',
    description: 'Get current user profile',
    tags: ['Auth'],
    responses: {
      200: {
        description: 'Current user profile retrieved successfully',
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
    return authHandlers.getCurrentUser(c);
  }
);

authRouter.openapi(
  createRoute({
    method: 'post',
    path: '/login',
    description: 'Login with email and password',
    tags: ['Auth'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authSchemas.login,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Login successful',
        content: {
          'application/json': {
            schema: authSchemas.loginResponse,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.login(c);
  }
);

authRouter.openapi(
  createRoute({
    method: 'post',
    path: '/register',
    description: 'Register a new user',
    tags: ['Auth'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authSchemas.register,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User registered successfully',
        content: {
          'application/json': {
            schema: authSchemas.loginResponse,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.register(c);
  }
);

export default authRouter;
