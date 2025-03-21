import { authHandlers } from '@/auth/handlers';
import { auth } from '@/auth/middleware';
import { authSchemas } from '@/auth/schemas';
import { H } from '@/types';
import { errorResponseSchemas } from '@/utils/error';
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

const passwordRouter = new OpenAPIHono<H>();

passwordRouter.use('*', auth());

passwordRouter.openapi(
  createRoute({
    method: 'post',
    path: '/reset/request',
    description: 'Request password reset',
    tags: ['Password'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z
              .object({ email: z.string().email() })
              .openapi('PasswordResetRequestSchema'),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password reset request sent successfully',
        content: {
          'application/json': {
            schema: z
              .object({ message: z.string() })
              .openapi('PasswordResetRequestResponse'),
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.requestPasswordReset(c);
  }
);

passwordRouter.openapi(
  createRoute({
    method: 'put',
    path: '/reset',
    description: 'Reset password',
    tags: ['Password'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z
              .object({
                token: z.string(),
                newPassword: z.string().min(8),
                confirmPassword: z.string(),
              })
              .openapi('PasswordResetSchema'),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Password reset successfully',
        content: {
          'application/json': {
            schema: z
              .object({ message: z.string() })
              .openapi('PasswordResetResponse'),
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.resetPassword(c);
  }
);

export default passwordRouter;
