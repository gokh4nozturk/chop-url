import { authHandlers } from '@/auth/handlers';
import { H } from '@/types';
import { errorResponseSchemas } from '@/utils/error';
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

const waitlistRouter = new OpenAPIHono<H>();

waitlistRouter.openapi(
  createRoute({
    method: 'post',
    path: '/',
    operationId: 'joinWaitlist',
    description: 'Join the waitlist',
    tags: ['Waitlist'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z
              .object({
                email: z.string().email().default('hello@example.com'),
                name: z.string().default('John Doe'),
                company: z.string().optional(),
                useCase: z.string().optional(),
              })
              .openapi('WaitlistRequestSchema'),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Waitlist joined successfully',
        content: {
          'application/json': {
            schema: z
              .object({
                id: z.number(),
                email: z.string(),
                name: z.string(),
                company: z.string().optional(),
                useCase: z.string().optional(),
                createdAt: z.string(),
              })
              .openapi('WaitlistResponse'),
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.addToWaitlist(c);
  }
);

waitlistRouter.openapi(
  createRoute({
    method: 'get',
    path: '/:email',
    operationId: 'getWaitlistEntry',
    description: 'Get waitlist entry',
    tags: ['Waitlist'],
    responses: {
      200: {
        description: 'Waitlist entry retrieved successfully',
        content: {
          'application/json': {
            schema: z
              .object({
                id: z.number(),
                email: z.string(),
                name: z.string(),
                company: z.string().optional(),
                useCase: z.string().optional(),
                createdAt: z.string(),
              })
              .openapi('WaitlistEntryResponse'),
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.getWaitlistEntry(c);
  }
);

export default waitlistRouter;
