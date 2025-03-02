import { zValidator } from '@hono/zod-validator';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import { Context } from '../../types';
import { FeedbackService } from './service';
import {
  createFeedbackSchema,
  updateFeedbackPrioritySchema,
  updateFeedbackStatusSchema,
} from './types';

export const createFeedbackRoutes = () => {
  const router = new Hono<Context>();

  router.post(
    '/feedback',
    zValidator('json', createFeedbackSchema),
    async (c) => {
      const db = drizzle(c.env.DB);
      const body = c.req.valid('json');
      const userId = c.get('userId');

      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const feedbackService = new FeedbackService(db);
      const result = await feedbackService.createFeedback(userId, body);

      return c.json(
        { message: 'Feedback submitted successfully', id: result.id },
        201
      );
    }
  );

  router.get('/feedback', async (c) => {
    const db = drizzle(c.env.DB);
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const feedbackService = new FeedbackService(db);
    const userFeedback = await feedbackService.getFeedbackByUserId(userId);

    return c.json(userFeedback);
  });

  // Admin routes
  router.get('/feedback/all', async (c) => {
    // TODO: Add admin check middleware
    const db = drizzle(c.env.DB);
    const feedbackService = new FeedbackService(db);
    const allFeedback = await feedbackService.getAllFeedback();
    return c.json(allFeedback);
  });

  router.patch(
    '/feedback/:id/status',
    zValidator('json', updateFeedbackStatusSchema),
    async (c) => {
      // TODO: Add admin check middleware
      const id = c.req.param('id');
      const { status } = c.req.valid('json');
      const db = drizzle(c.env.DB);

      const feedbackService = new FeedbackService(db);
      await feedbackService.updateFeedbackStatus(id, status);

      return c.json({ message: 'Feedback status updated successfully' });
    }
  );

  router.patch(
    '/feedback/:id/priority',
    zValidator('json', updateFeedbackPrioritySchema),
    async (c) => {
      // TODO: Add admin check middleware
      const id = c.req.param('id');
      const { priority } = c.req.valid('json');
      const db = drizzle(c.env.DB);

      const feedbackService = new FeedbackService(db);
      await feedbackService.updateFeedbackPriority(id, priority);

      return c.json({ message: 'Feedback priority updated successfully' });
    }
  );

  router.delete('/feedback/:id', async (c) => {
    // TODO: Add admin check middleware
    const id = c.req.param('id');
    const db = drizzle(c.env.DB);

    const feedbackService = new FeedbackService(db);
    await feedbackService.deleteFeedback(id);

    return c.json({ message: 'Feedback deleted successfully' });
  });

  return router;
};
