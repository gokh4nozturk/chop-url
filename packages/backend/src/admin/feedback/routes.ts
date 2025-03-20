import { auth } from '@/auth/middleware';
import { Env, Variables } from '@/types';
import { errorResponseSchemas, handleError } from '@/utils/error';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import {
  createFeedbackHandler,
  deleteFeedbackHandler,
  getAllFeedbackHandler,
  getFeedbackByIdHandler,
  getUserFeedbackHandler,
  updateFeedbackPriorityHandler,
  updateFeedbackStatusHandler,
} from './handlers';
import {
  createFeedbackSchema,
  feedbackResponseSchema,
  successResponseSchema,
} from './schemas';

const feedbackRouter = new OpenAPIHono<{
  Bindings: Env;
  Variables: Variables;
}>();

feedbackRouter.use('*', auth());

feedbackRouter.openapi(
  createRoute({
    method: 'post',
    path: '/',
    description: 'Submit feedback',
    tags: ['Admin Feedback'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: createFeedbackSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Feedback submitted successfully',
        content: {
          'application/json': {
            schema: successResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  async (c) => {
    try {
      const result = await createFeedbackHandler(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

feedbackRouter.openapi(
  createRoute({
    method: 'get',
    path: '/',
    description: 'Get all feedback',
    tags: ['Admin Feedback'],
    responses: {
      200: {
        description: 'Feedback retrieved successfully',
        content: {
          'application/json': {
            schema: feedbackResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  async (c) => {
    try {
      const result = await getAllFeedbackHandler(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

feedbackRouter.openapi(
  createRoute({
    method: 'patch',
    path: '/:id/status',
    description: 'Update feedback status',
    tags: ['Admin Feedback'],
    responses: {
      200: {
        description: 'Feedback status updated successfully',
        content: {
          'application/json': {
            schema: successResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  async (c) => {
    try {
      const result = await updateFeedbackStatusHandler(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

feedbackRouter.openapi(
  createRoute({
    method: 'patch',
    path: '/:id/priority',
    description: 'Update feedback priority',
    tags: ['Admin Feedback'],
    responses: {
      200: {
        description: 'Feedback priority updated successfully',
        content: {
          'application/json': {
            schema: successResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  async (c) => {
    try {
      const result = await updateFeedbackPriorityHandler(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

feedbackRouter.openapi(
  createRoute({
    method: 'delete',
    path: '/:id',
    description: 'Delete feedback',
    tags: ['Admin Feedback'],
    responses: {
      200: {
        description: 'Feedback deleted successfully',
        content: {
          'application/json': {
            schema: successResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    try {
      const result = await deleteFeedbackHandler(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

feedbackRouter.openapi(
  createRoute({
    method: 'get',
    path: '/:id',
    description: 'Get feedback by ID  ',
    tags: ['Admin Feedback'],
    responses: {
      200: {
        description: 'Feedback retrieved successfully',
        content: {
          'application/json': {
            schema: feedbackResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  async (c) => {
    try {
      const result = await getFeedbackByIdHandler(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

feedbackRouter.openapi(
  createRoute({
    method: 'get',
    path: '/user/:id',
    description: 'Get feedback by user ID',
    tags: ['Admin Feedback'],
    responses: {
      200: {
        description: 'Feedback retrieved successfully',
        content: {
          'application/json': {
            schema: feedbackResponseSchema,
          },
        },
      },
      ...errorResponseSchemas.badRequestError,
      ...errorResponseSchemas.notFoundError,
      ...errorResponseSchemas.serverError,
      ...errorResponseSchemas.authError,
    },
  }),
  async (c) => {
    try {
      const result = await getUserFeedbackHandler(c);
      return c.json(result, 200);
    } catch (error) {
      handleError(c, error);
    }
  }
);

export default feedbackRouter;
