import { z } from '@hono/zod-openapi';
import { ErrorCode } from '../../utils/error';

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

// Custom error schemas for URL endpoints
export const urlValidationErrorSchema = z
  .object({
    code: z.literal(ErrorCode.VALIDATION_ERROR).openapi({
      example: ErrorCode.VALIDATION_ERROR,
      description: 'Validation error code',
    }),
    message: z.string().openapi({
      example: 'Invalid request body',
      description: 'Error message',
    }),
    details: z
      .array(
        z.object({
          code: z.string().openapi({
            example: 'invalid_string',
            description: 'Validation error type',
          }),
          message: z.string().openapi({
            example: 'Required',
            description: 'Error description',
          }),
          path: z.array(z.string()).openapi({
            example: ['url'],
            description: 'Path to the invalid field',
          }),
        })
      )
      .openapi({
        description: 'URL validation error details',
        example: [
          {
            code: 'invalid_string',
            message: 'Invalid url',
            path: ['url'],
          },
        ],
      }),
  })
  .openapi('UrlValidationErrorSchema');

export const urlNotFoundErrorSchema = z
  .object({
    code: z.literal(ErrorCode.URL_NOT_FOUND).openapi({
      example: ErrorCode.URL_NOT_FOUND,
      description: 'URL not found error code',
    }),
    message: z.string().openapi({
      example: 'URL not found.',
      description: 'Error message',
    }),
  })
  .openapi('UrlNotFoundErrorSchema');

export const urlEmailValidationErrorSchema = z
  .object({
    code: z.literal(ErrorCode.VALIDATION_ERROR).openapi({
      example: ErrorCode.VALIDATION_ERROR,
      description: 'Validation error code',
    }),
    message: z.string().openapi({
      example: 'Invalid request body',
      description: 'Error message',
    }),
    details: z
      .array(
        z.object({
          code: z.string().openapi({
            example: 'invalid_string',
            description: 'Validation error type',
          }),
          message: z.string().openapi({
            example: 'Required',
            description: 'Error description',
          }),
          path: z.array(z.string()).openapi({
            example: ['email'],
            description: 'Path to the invalid field',
          }),
        })
      )
      .openapi({
        description: 'Validation error details for email-related fields',
        example: [
          {
            code: 'invalid_string',
            message: 'Required',
            path: ['email'],
          },
        ],
      }),
  })
  .openapi('UrlEmailValidationErrorSchema');
