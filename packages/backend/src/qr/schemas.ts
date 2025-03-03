import { z } from '@hono/zod-openapi';

// QR Code schemas
export const createQRCodeSchema = z
  .object({
    urlId: z.number(),
    imageUrl: z.string(),
  })
  .openapi('CreateQRCodeSchema');

export const updateQRCodeSchema = z
  .object({
    imageUrl: z.string().optional(),
    logoUrl: z.string().optional(),
    logoSize: z.number().optional(),
    logoPosition: z.string().optional(),
  })
  .openapi('UpdateQRCodeSchema');

// Response schemas
export const qrCodeResponseSchema = z
  .object({
    id: z.number(),
    urlId: z.number(),
    imageUrl: z.string(),
    downloadCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('QRCodeResponse');

export const successResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi('SuccessResponse');

export const errorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi('ErrorResponse');

// Schema collections
export const qrSchemas = {
  createQRCode: createQRCodeSchema,
  updateQRCode: updateQRCodeSchema,
  qrCode: qrCodeResponseSchema,
  success: successResponseSchema,
  error: errorResponseSchema,
};
