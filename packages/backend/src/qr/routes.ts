import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
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

export const createQRRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

  // Create QR code
  router.post('/', zValidator('json', createQRCodeSchema), async (c) => {
    const data = c.req.valid('json');
    const qrService = new QRCodeService(c.get('db'));
    const qrCode = await qrService.createQRCode(data);
    return c.json(qrCode, 201);
  });

  // Get QR code by URL ID
  router.get('/:urlId', async (c) => {
    const urlId = Number(c.req.param('urlId'));
    const qrService = new QRCodeService(c.get('db'));
    const qrCode = await qrService.getQRCode(urlId);

    if (!qrCode) {
      return c.json({ error: 'QR code not found' }, 404);
    }

    return c.json(qrCode);
  });

  // Update QR code
  router.put('/:id', zValidator('json', updateQRCodeSchema), async (c) => {
    const id = Number(c.req.param('id'));
    const data = c.req.valid('json');
    const qrService = new QRCodeService(c.get('db'));
    const qrCode = await qrService.updateQRCode(id, data);
    return c.json(qrCode);
  });

  // Increment download count
  router.post('/:id/download', async (c) => {
    const id = Number(c.req.param('id'));
    const qrService = new QRCodeService(c.get('db'));
    await qrService.incrementDownloadCount(id);
    return c.json({ success: true });
  });

  return router;
};
