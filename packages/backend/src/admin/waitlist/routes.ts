import { auth } from '@/auth/middleware';
import { H } from '@/types';
import { errorResponseSchemas, handleError } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import {
  approveWaitListUserHandler,
  getWaitListUsersHandler,
} from './handlers';
import { approveResponseSchema, waitlistUsersResponseSchema } from './schemas';

const waitlistRouter = new OpenAPIHono<H>();

waitlistRouter.use('*', auth());

waitlistRouter.openapi(
  createRoute({
    method: 'get',
    path: '/',
    description: 'Get waitlist users',
    tags: ['Admin Waitlist'],
    responses: {
      200: {
        description: 'Waitlist users retrieved successfully',
        content: {
          'application/json': {
            schema: waitlistUsersResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  // @ts-ignore
  (c) => {
    return getWaitListUsersHandler(c);
  }
);

waitlistRouter.openapi(
  createRoute({
    method: 'post',
    path: '/approve',
    description: 'Approve waitlist user',
    tags: ['Admin Waitlist'],
    responses: {
      200: {
        description: 'Waitlist user approved successfully',
        content: {
          'application/json': {
            schema: approveResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.notFoundError,
    },
  }),
  // @ts-ignore
  (c) => {
    return approveWaitListUserHandler(c);
  }
);

export default waitlistRouter;
