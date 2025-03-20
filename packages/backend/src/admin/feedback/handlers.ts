import { drizzle } from 'drizzle-orm/d1';
import { Context } from 'hono';
import { FeedbackService } from './service';
import {
  CreateFeedbackDto,
  FeedbackContext,
  UpdateFeedbackPriorityDto,
  UpdateFeedbackStatusDto,
} from './types';

export const createFeedbackHandler = async (c: Context<FeedbackContext>) => {
  const db = drizzle(c.env.DB);
  // @ts-ignore - Hono zValidator tip sorunu
  const body = c.req.valid('json') as CreateFeedbackDto;
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const feedbackService = new FeedbackService(db);
  const result = await feedbackService.createFeedback(String(user.id), body);

  return c.json(
    { message: 'Feedback submitted successfully', id: result.id },
    201
  );
};

export const getUserFeedbackHandler = async (c: Context<FeedbackContext>) => {
  const db = drizzle(c.env.DB);
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const feedbackService = new FeedbackService(db);
  const userFeedback = await feedbackService.getFeedbackByUserId(
    String(user.id)
  );

  return c.json(userFeedback);
};

export const getAllFeedbackHandler = async (c: Context<FeedbackContext>) => {
  const db = drizzle(c.env.DB);
  const feedbackService = new FeedbackService(db);
  const allFeedback = await feedbackService.getAllFeedback();
  return c.json(allFeedback);
};

export const updateFeedbackStatusHandler = async (
  c: Context<FeedbackContext>
) => {
  const id = c.req.param('id');
  // @ts-ignore - Hono zValidator tip sorunu
  const { status } = c.req.valid('json') as UpdateFeedbackStatusDto;
  const db = drizzle(c.env.DB);

  const feedbackService = new FeedbackService(db);
  await feedbackService.updateFeedbackStatus(id, status);

  return c.json({ message: 'Feedback status updated successfully' });
};

export const updateFeedbackPriorityHandler = async (
  c: Context<FeedbackContext>
) => {
  const id = c.req.param('id');
  // @ts-ignore - Hono zValidator tip sorunu
  const { priority } = c.req.valid('json') as UpdateFeedbackPriorityDto;
  const db = drizzle(c.env.DB);

  const feedbackService = new FeedbackService(db);
  await feedbackService.updateFeedbackPriority(id, priority);

  return c.json({ message: 'Feedback priority updated successfully' });
};

export const deleteFeedbackHandler = async (c: Context<FeedbackContext>) => {
  const id = c.req.param('id');
  const db = drizzle(c.env.DB);

  const feedbackService = new FeedbackService(db);
  await feedbackService.deleteFeedback(id);

  return c.json({ message: 'Feedback deleted successfully' });
};

export const getFeedbackByIdHandler = async (c: Context<FeedbackContext>) => {
  const id = c.req.param('id');
  const db = drizzle(c.env.DB);

  const feedbackService = new FeedbackService(db);
  const feedback = await feedbackService.getFeedbackById(id);

  return c.json(feedback);
};
