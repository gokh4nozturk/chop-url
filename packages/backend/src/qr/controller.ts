import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { Database } from '../db/client';
import { Env, Variables } from '../types';
import { QRCodeService } from './service';

const createQRCodeSchema = z.object({
  urlId: z.number(),
  imageUrl: z.string(),
  logoUrl: z.string().optional(),
  logoSize: z.number().default(40),
  logoPosition: z.string().default('center'),
});

const updateQRCodeSchema = z.object({
  logoUrl: z.string().optional(),
  logoSize: z.number().optional(),
  logoPosition: z.string().optional(),
});

export const createQRCodeRouter = (db: Database) => {
  const qrCodeService = new QRCodeService(db);
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

  // Create QR code
  router.post('/', zValidator('json', createQRCodeSchema), async (c) => {
    const data = c.req.valid('json');
    const qrCode = await qrCodeService.createQRCode(data);
    return c.json(qrCode, 201);
  });

  // Get QR code by URL ID
  router.get('/:urlId', async (c) => {
    const urlId = Number(c.req.param('urlId'));
    const qrCode = await qrCodeService.getQRCode(urlId);

    if (!qrCode) {
      return c.json({ error: 'QR code not found' }, 404);
    }

    return c.json(qrCode);
  });

  // Update QR code
  router.put('/:id', zValidator('json', updateQRCodeSchema), async (c) => {
    const id = Number(c.req.param('id'));
    const data = c.req.valid('json');
    const qrCode = await qrCodeService.updateQRCode(id, data);
    return c.json(qrCode);
  });

  // Increment download count
  router.post('/:id/download', async (c) => {
    const id = Number(c.req.param('id'));
    await qrCodeService.incrementDownloadCount(id);
    return c.json({ success: true });
  });

  return router;
};
