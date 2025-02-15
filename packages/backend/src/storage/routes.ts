import { Hono } from 'hono';
import { Env, Variables } from '../types';
import { R2StorageService } from './service';

export const createStorageRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

  router.post('/presigned-url', async (c) => {
    try {
      const { path } = await c.req.json();

      if (!path || typeof path !== 'string') {
        return c.json({ error: 'Path is required' }, 400);
      }

      const storageService = new R2StorageService(c.env);
      const { url, headers } = await storageService.getPresignedUrl(path);
      return c.json({ url, headers });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      return c.json({ error: 'Failed to generate presigned URL' }, 500);
    }
  });

  return router;
};
