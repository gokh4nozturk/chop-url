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
  // @ts-ignore
  (c) => {
    return createFeedbackHandler(c);
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
  // @ts-ignore
  (c) => {
    return getAllFeedbackHandler(c);
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
  // @ts-ignore
  (c) => {
    return updateFeedbackStatusHandler(c);
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
  // @ts-ignore
  (c) => {
    return updateFeedbackPriorityHandler(c);
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
  // @ts-ignore
  (c) => {
    return deleteFeedbackHandler(c);
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
  // @ts-ignore
  (c) => {
    return getFeedbackByIdHandler(c);
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
  // @ts-ignore
  (c) => {
    return getUserFeedbackHandler(c);
  }
);

export default feedbackRouter;
