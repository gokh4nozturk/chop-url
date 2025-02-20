import { Hono } from 'hono';
import { Env, Variables } from '../types';
import { R2StorageService } from './service';

export const createStorageRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

  router.post('/storage/generate-presigned-url', async (c) => {
    try {
      console.log('Received presigned URL request');
      const { path, operation = 'write' } = await c.req.json();

      if (!path || typeof path !== 'string') {
        console.error('Invalid path:', path);
        return c.json({ error: 'Path is required' }, 400);
      }

      console.log('Generating presigned URL for path:', path);
      const storageService = new R2StorageService(c.env);
      const { url } = await storageService.getPresignedUrl(path, operation);

      console.log('Generated presigned URL:', url);
      return c.json({ url });
    } catch (error) {
      console.error('Error generating URL:', error);
      return c.json(
        {
          error: 'Failed to generate URL',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  });

  return router;
};
