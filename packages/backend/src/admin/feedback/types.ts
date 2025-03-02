import { z } from 'zod';

export const createFeedbackSchema = z.object({
  category: z.enum(['bug', 'feature', 'improvement', 'other']),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export type CreateFeedbackDto = z.infer<typeof createFeedbackSchema>;

export const updateFeedbackStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed']),
});

export const updateFeedbackPrioritySchema = z.object({
  priority: z.enum(['low', 'medium', 'high']),
});

export type UpdateFeedbackStatusDto = z.infer<
  typeof updateFeedbackStatusSchema
>;
export type UpdateFeedbackPriorityDto = z.infer<
  typeof updateFeedbackPrioritySchema
>;
