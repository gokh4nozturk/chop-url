import { z } from 'zod';

export const approveWaitListSchema = z.object({
  email: z.string().email(),
});

export const approveResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const waitlistUsersResponseSchema = z.object({
  waitListUsers: z.array(
    z.object({
      id: z.number(),
      email: z.string().email(),
      name: z.string(),
      company: z.string().nullable(),
      use_case: z.string(),
      status: z.enum([
        'pending',
        'approved',
        'rejected',
        'invited',
        'registered',
      ]),
      created_at: z.string(),
      updated_at: z.string(),
    })
  ),
});
