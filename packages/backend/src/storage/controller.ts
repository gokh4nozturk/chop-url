import { Hono } from 'hono';
import { Env } from '../types';
import { R2StorageService } from './r2';

export const createStorageRouter = () => {
  const router = new Hono<{ Bindings: Env }>();

  router.post('/upload', async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file');
      const path = formData.get('path');

      if (
        !file ||
        typeof file !== 'object' ||
        !path ||
        typeof path !== 'string'
      ) {
        return c.json({ error: 'File and path are required' }, 400);
      }

      const storageService = new R2StorageService(c.env);
      const url = await storageService.uploadFile(file, path);

      return c.json({ url });
    } catch (error) {
      console.error('Error handling file upload:', error);
      return c.json({ error: 'Failed to upload file' }, 500);
    }
  });

  return router;
};
