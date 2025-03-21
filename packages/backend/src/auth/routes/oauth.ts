import { authHandlers } from '@/auth/handlers';
import { auth } from '@/auth/middleware';
import { authSchemas } from '@/auth/schemas';
import { H } from '@/types';
import { errorResponseSchemas } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';

const oauthRouter = new OpenAPIHono<H>();

oauthRouter.use('*', auth());

oauthRouter.openapi(
  createRoute({
    method: 'get',
    path: '/:provider',
    description: 'Initiate OAuth flow',
    tags: ['OAuth'],
    responses: {
      200: {
        description: 'OAuth URL',
        content: {
          'application/json': {
            schema: authSchemas.oAuthUrlResponse,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.getOAuthUrl(c);
  }
);

oauthRouter.openapi(
  createRoute({
    method: 'get',
    path: '/:provider/callback',
    description: 'Handle OAuth callback',
    tags: ['OAuth'],
    responses: {
      200: {
        description: 'OAuth callback',
        content: {
          'application/json': {
            schema: authSchemas.oAuthCallbackResponse,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.handleOAuthCallback(c);
  }
);

export default oauthRouter;
