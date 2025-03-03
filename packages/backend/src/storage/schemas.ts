import { z } from 'zod';

export const presignedUrlSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  operation: z.enum(['read', 'write']).optional().default('write'),
});

export const publicUrlSchema = z.object({
  path: z.string().min(1, 'Path is required'),
});
