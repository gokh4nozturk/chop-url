import { Context } from 'hono';
import { Database } from '../db/client';
import { Env, Variables } from '../types';
import { QRCodeService } from './service';
import { CreateQRCodeData, UpdateQRCodeData } from './types.js';

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// Create QR service instance
const createQRService = (db: Database) => {
  return new QRCodeService(db);
};

// QR code handlers
export const qrHandlers = {
  // Create QR code
  createQRCode: async (c: AppContext) => {
    try {
      const data = (await c.req.json()) as CreateQRCodeData;
      const qrService = createQRService(c.get('db'));

      // Ensure required fields
      const qrCodeData: CreateQRCodeData = {
        urlId: data.urlId,
        imageUrl: data.imageUrl,
      };

      const qrCode = await qrService.createQRCode(qrCodeData);
      return c.json(qrCode, 201);
    } catch (error) {
      return handleQRError(c, error, 'Error creating QR code');
    }
  },

  // Get QR code by URL ID
  getQRCodeByUrlId: async (c: AppContext) => {
    try {
      const urlId = Number(c.req.param('urlId'));
      console.log('Getting QR code for URL ID:', urlId);

      const qrService = createQRService(c.get('db'));
      const qrCode = await qrService.getQRCode(urlId);

      if (!qrCode) {
        return c.body(null, 204);
      }

      return c.json(qrCode);
    } catch (error) {
      return handleQRError(c, error, 'Error getting QR code');
    }
  },

  // Get QR code by ID
  getQRCodeById: async (c: AppContext) => {
    try {
      const id = Number(c.req.param('id'));
      const qrService = createQRService(c.get('db'));
      const qrCode = await qrService.getQRCodeById(id);

      if (!qrCode) {
        return c.json({ error: 'QR code not found' }, 404);
      }

      return c.json(qrCode);
    } catch (error) {
      return handleQRError(c, error, 'Error getting QR code');
    }
  },

  // Update QR code
  updateQRCode: async (c: AppContext) => {
    try {
      const id = Number(c.req.param('id'));
      const data = (await c.req.json()) as UpdateQRCodeData;
      const qrService = createQRService(c.get('db'));
      const qrCode = await qrService.updateQRCode(id, data);
      return c.json(qrCode, 200);
    } catch (error) {
      return handleQRError(c, error, 'Error updating QR code');
    }
  },

  // Increment download count
  incrementDownloadCount: async (c: AppContext) => {
    try {
      const id = Number(c.req.param('id'));
      const qrService = createQRService(c.get('db'));
      await qrService.incrementDownloadCount(id);
      return c.json({ success: true });
    } catch (error) {
      return handleQRError(c, error, 'Error incrementing download count');
    }
  },
};

// Helper function for error handling
const handleQRError = (c: Context, error: unknown, defaultMessage: string) => {
  console.error(`${defaultMessage}:`, error);
  return c.json({ error: 'Internal server error' }, 500);
};
