import { z } from 'zod';

export const createFeedbackSchema = z.object({
  category: z.enum(['bug', 'feature', 'improvement', 'other']),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const updateFeedbackStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed']),
});

export const updateFeedbackPrioritySchema = z.object({
  priority: z.enum(['low', 'medium', 'high']),
});

export const successResponseSchema = z.object({
  message: z.string(),
  id: z.string().optional(),
});

export const feedbackResponseSchema = z.array(
  z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string(),
    category: z.enum(['bug', 'feature', 'improvement', 'other']),
    status: z.enum(['open', 'in_progress', 'closed']),
    priority: z.enum(['low', 'medium', 'high']),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
);
