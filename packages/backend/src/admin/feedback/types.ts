import { z } from 'zod';
import { Env, Variables } from '../../types';
import {
  createFeedbackSchema,
  updateFeedbackPrioritySchema,
  updateFeedbackStatusSchema,
} from './schemas';

export type CreateFeedbackDto = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackStatusDto = z.infer<
  typeof updateFeedbackStatusSchema
>;
export type UpdateFeedbackPriorityDto = z.infer<
  typeof updateFeedbackPrioritySchema
>;

export type FeedbackStatus = 'open' | 'in_progress' | 'closed';
export type FeedbackPriority = 'low' | 'medium' | 'high';
export type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'other';

export interface FeedbackContext {
  Bindings: Env;
  Variables: Variables;
}

export interface FeedbackResponse {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  createdAt: string;
  updatedAt: string;
}
