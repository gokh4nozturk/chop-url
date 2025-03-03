import { Context } from 'hono';
import { presignedUrlSchema, publicUrlSchema } from './schemas';
import { R2StorageService } from './service';
import { PresignedUrlRequest, PublicUrlRequest, StorageContext } from './types';

export const generatePresignedUrlHandler = async (
  c: Context<StorageContext>
) => {
  try {
    const body = await c.req.json();
    const result = presignedUrlSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          error: 'Invalid request',
          details: result.error.format(),
        },
        400
      );
    }

    const { path, operation } = result.data;

    console.log('Generating presigned URL for path:', path);
    const storageService = new R2StorageService(c.env);
    const { url } = await storageService.getPresignedUrl(path, operation);

    console.log('Generated presigned URL successfully');
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
};

export const getPublicUrlHandler = async (c: Context<StorageContext>) => {
  try {
    const query = c.req.query();
    const result = publicUrlSchema.safeParse(query);

    if (!result.success) {
      return c.json(
        {
          error: 'Invalid request',
          details: result.error.format(),
        },
        400
      );
    }

    const { path } = result.data;

    const storageService = new R2StorageService(c.env);
    const publicUrl = storageService.getPublicUrl(path);

    return c.json({ url: publicUrl });
  } catch (error) {
    console.error('Error getting public URL:', error);
    return c.json(
      {
        error: 'Failed to get public URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
};
