import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { Env, Variables } from '../types';
import { QRCodeService } from './service';

const createQRCodeSchema = z.object({
  urlId: z.number(),
  imageUrl: z.string(),
});

const updateQRCodeSchema = z.object({
  imageUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  logoSize: z.number().optional(),
  logoPosition: z.string().optional(),
});

export const createQRRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

  // Create QR code
  router.post('/qr', zValidator('json', createQRCodeSchema), async (c) => {
    const data = c.req.valid('json');
    const qrService = new QRCodeService(c.get('db'));
    const qrCode = await qrService.createQRCode(data);
    return c.json(qrCode, 201);
  });

  // Get QR code by URL ID
  router.get('/qr/url/:urlId', async (c) => {
    try {
      const urlId = Number(c.req.param('urlId'));
      console.log('Getting QR code for URL ID:', urlId);

      const qrService = new QRCodeService(c.get('db'));
      const qrCode = await qrService.getQRCode(urlId);

      if (!qrCode) {
        return c.body(null, 204);
      }

      return c.json(qrCode);
    } catch (error) {
      console.error('Error getting QR code:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Get QR code by ID
  router.get('/qr/:id', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      const qrService = new QRCodeService(c.get('db'));
      const qrCode = await qrService.getQRCodeById(id);

      if (!qrCode) {
        return c.json({ error: 'QR code not found' }, 404);
      }

      return c.json(qrCode);
    } catch (error) {
      console.error('Error getting QR code:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Update QR code
  router.put('/qr/:id', zValidator('json', updateQRCodeSchema), async (c) => {
    try {
      const id = Number(c.req.param('id'));
      const data = c.req.valid('json');
      const qrService = new QRCodeService(c.get('db'));
      const qrCode = await qrService.updateQRCode(id, data);
      return c.json(qrCode, 200);
    } catch (error) {
      console.error('Error updating QR code:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // Increment download count
  router.post('/qr/:id/download', async (c) => {
    const id = Number(c.req.param('id'));
    const qrService = new QRCodeService(c.get('db'));
    await qrService.incrementDownloadCount(id);
    return c.json({ success: true });
  });

  return router;
};
