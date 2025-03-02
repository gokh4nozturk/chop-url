import { z } from '@hono/zod-openapi';

export const createUrlGroupSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
  })
  .openapi('CreateUrlGroupRequest');

export const updateUrlGroupSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  })
  .openapi('UpdateUrlGroupRequest');

export const urlGroupResponseSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    userId: z.number(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
  })
  .openapi('UrlGroupResponse');
