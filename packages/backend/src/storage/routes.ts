import { Hono } from 'hono';
import { Env, Variables } from '../types';
import { R2StorageService } from './service';

export const createStorageRoutes = () => {
  const router = new Hono<{ Bindings: Env; Variables: Variables }>();

  router.post('/storage/presigned-url', async (c) => {
    try {
      console.log('Received presigned URL request');
      const { path } = await c.req.json();

      if (!path || typeof path !== 'string') {
        console.error('Invalid path:', path);
        return c.json({ error: 'Path is required' }, 400);
      }

      console.log('Generating presigned URL for path:', path);
      const storageService = new R2StorageService(c.env);
      const { url, headers } = await storageService.getPresignedUrl(path);

      console.log('Generated presigned URL:', url);
      return c.json({ url, headers });
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

  router.post('/storage/upload', async (c) => {
    try {
      console.log('Received file upload request');
      const formData = await c.req.formData();
      const file = formData.get('file');
      const path = formData.get('path');

      console.log('Upload request details:', {
        hasFile: !!file,
        fileType:
          file && typeof file === 'object' ? (file as Blob).type : typeof file,
        path,
      });

      if (
        !file ||
        typeof file !== 'object' ||
        !path ||
        typeof path !== 'string'
      ) {
        console.error('Invalid file or path:', { file, path });
        return c.json({ error: 'File and path are required' }, 400);
      }

      console.log('Uploading file to path:', path);
      const storageService = new R2StorageService(c.env);
      const url = await storageService.uploadFile(file as Blob, path);

      console.log('File uploaded successfully:', url);
      return c.json(url);
    } catch (error) {
      console.error('Error uploading file:', error);
      return c.json(
        {
          error: 'Failed to upload file',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  });

  return router;
};
