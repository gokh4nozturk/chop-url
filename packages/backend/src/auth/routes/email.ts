import { authHandlers } from '@/auth/handlers';
import { auth } from '@/auth/middleware';
import { authSchemas } from '@/auth/schemas';
import { H } from '@/types';
import { errorResponseSchemas } from '@/utils/error';
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

const emailRouter = new OpenAPIHono<H>();

emailRouter.use('*', auth());

emailRouter.openapi(
  createRoute({
    method: 'post',
    path: '/verify',
    description: 'Verify email address',
    tags: ['Email'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authSchemas.verifyEmail,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Email verified successfully',
        content: {
          'application/json': {
            schema: z
              .object({ message: z.string() })
              .openapi('EmailVerificationResponse'),
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.verifyEmail(c);
  }
);

emailRouter.openapi(
  createRoute({
    method: 'post',
    path: '/resend-verification',
    description: 'Resend verification email',
    tags: ['Email'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z
              .object({ email: z.string().email() })
              .openapi('ResendVerificationRequest'),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Verification email resent successfully',
        content: {
          'application/json': {
            schema: z
              .object({ message: z.string() })
              .openapi('ResendVerificationResponse'),
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.resendVerificationEmail(c);
  }
);

export default emailRouter;
