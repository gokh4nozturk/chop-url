import { withOpenAPI } from '@/utils/openapi';
import { Hono } from 'hono';
import { generatePresignedUrlHandler, getPublicUrlHandler } from './handlers';
import { StorageContext } from './types';

const createBaseStorageRoutes = () => {
  const router = new Hono<StorageContext>();

  // Group routes by functionality
  const storageRouter = router.basePath('/storage');

  // Presigned URL generation
  storageRouter.post('/generate-presigned-url', generatePresignedUrlHandler);

  // Public URL generation
  storageRouter.get('/public-url', getPublicUrlHandler);

  return router;
};

export const createStorageRoutes = withOpenAPI(createBaseStorageRoutes, '/api');
