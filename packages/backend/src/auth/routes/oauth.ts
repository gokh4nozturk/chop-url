import { authHandlers } from '@/auth/handlers';
import { auth } from '@/auth/middleware';
import { authSchemas } from '@/auth/schemas';
import { Env, Variables } from '@/types';
import { errorResponseSchemas, handleError } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';

const oauthRouter = new OpenAPIHono<{
  Bindings: Env;
  Variables: Variables;
}>();

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
  async (c) => {
    try {
      const result = await authHandlers.getOAuthUrl(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
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
  async (c) => {
    try {
      const result = await authHandlers.handleOAuthCallback(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);
export default oauthRouter;
