import { auth } from '@/auth/middleware';
import { Env, Variables } from '@/types';
import { errorResponseSchemas } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { authHandlers } from '../handlers';
import { authSchemas } from '../schemas';

const twoFactorRouter = new OpenAPIHono<{
  Bindings: Env;
  Variables: Variables;
}>();

twoFactorRouter.use('*', auth());

twoFactorRouter.openapi(
  createRoute({
    method: 'post',
    path: '/setup',
    description: 'Setup 2FA for the user',
    tags: ['2FA'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authSchemas.twoFactorSetupInit,
          },
        },
      },
    },
    responses: {
      200: {
        description: '2FA setup successful',
        content: {
          'application/json': {
            schema: authSchemas.twoFactorSetup,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.setupTwoFactor(c);
  }
);

twoFactorRouter.openapi(
  createRoute({
    method: 'post',
    path: '/verify-setup',
    description: 'Verify 2FA setup',
    tags: ['2FA'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authSchemas.twoFactorSetupInit,
          },
        },
      },
    },
    responses: {
      200: {
        description: '2FA setup verified successfully',
        content: {
          'application/json': {
            schema: authSchemas.twoFactorSetup,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.verifyTwoFactorSetup(c);
  }
);

twoFactorRouter.openapi(
  createRoute({
    method: 'get',
    path: '/recovery-codes',
    description: 'Get 2FA recovery codes',
    tags: ['2FA'],
    responses: {
      200: {
        description: '2FA recovery codes retrieved successfully',
        content: {
          'application/json': {
            schema: authSchemas.recoveryCodes,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.getRecoveryCodes(c);
  }
);

twoFactorRouter.openapi(
  createRoute({
    method: 'post',
    path: '/verify-2fa',
    description: 'Verify 2FA code during login',
    tags: ['2FA'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authSchemas.twoFactorLogin,
          },
        },
      },
    },
    responses: {
      200: {
        description: '2FA verification successful',
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
    return authHandlers.verifyTwoFactorLogin(c);
  }
);

twoFactorRouter.openapi(
  createRoute({
    method: 'post',
    path: '/enable-2fa',
    description: 'Enable 2FA for the user',
    tags: ['2FA'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authSchemas.twoFactorCode,
          },
        },
      },
    },
    responses: {
      200: {
        description: '2FA enabled successfully',
        content: {
          'application/json': {
            schema: authSchemas.twoFactorSetup,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.enableTwoFactor(c);
  }
);

twoFactorRouter.openapi(
  createRoute({
    method: 'post',
    path: '/disable-2fa',
    description: 'Disable 2FA for the user',
    tags: ['2FA'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: authSchemas.twoFactorCode,
          },
        },
      },
    },
    responses: {
      200: {
        description: '2FA disabled successfully',
        content: {
          'application/json': {
            schema: authSchemas.twoFactorSetup,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  // @ts-ignore
  (c) => {
    return authHandlers.disableTwoFactor(c);
  }
);

export default twoFactorRouter;
