import { auth } from '@/auth/middleware';
import { Env, Variables } from '@/types';
import { errorResponseSchemas, handleError } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { generatePresignedUrlHandler, getPublicUrlHandler } from './handlers';
import { presignedUrlSchema, publicUrlSchema } from './schemas';

const storageRouter = new OpenAPIHono<{
  Bindings: Env;
  Variables: Variables;
}>();

storageRouter.use('*', auth());

storageRouter.openapi(
  createRoute({
    method: 'post',
    path: '/generate-presigned-url',
    description: 'Generate a presigned URL for file upload/download',
    tags: ['Storage'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: presignedUrlSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Presigned URL generated successfully',
        content: {
          'application/json': {
            schema: presignedUrlSchema,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  async (c) => {
    try {
      const result = await generatePresignedUrlHandler(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

storageRouter.openapi(
  createRoute({
    method: 'get',
    path: '/public-url',
    description: 'Get a public URL for a file',
    tags: ['Storage'],
    responses: {
      200: {
        description: 'Public URL retrieved successfully',
        content: {
          'application/json': {
            schema: publicUrlSchema,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  async (c) => {
    try {
      const result = await getPublicUrlHandler(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

export default storageRouter;
