import { z } from '@hono/zod-openapi';

export const createUrlSchema = z
  .object({
    url: z.string().url(),
    customSlug: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
    groupId: z.number().optional(),
  })
  .openapi('CreateUrlRequest');

export const updateUrlSchema = z
  .object({
    originalUrl: z.string().url().optional(),
    customSlug: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
    groupId: z.number().optional(),
    isActive: z.boolean().optional(),
  })
  .openapi('UpdateUrlRequest');

export const urlResponseSchema = z
  .object({
    id: z.number(),
    shortUrl: z.string(),
    originalUrl: z.string(),
    shortId: z.string(),
    expiresAt: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
    groupId: z.number().optional(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
  })
  .openapi('UrlResponse');
