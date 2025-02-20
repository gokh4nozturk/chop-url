import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Env } from '../types';

export class R2StorageService {
  private readonly client: S3Client;

  constructor(private readonly env: Env) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.ACCESS_KEY_ID,
        secretAccessKey: env.SECRET_ACCESS_KEY,
      },
    });
  }

  async getPresignedUrl(
    path: string,
    operation: 'read' | 'write' = 'read',
    expiresIn = 3600 // 1 hour
  ): Promise<{ url: string }> {
    try {
      if (!this.env.BUCKET_NAME) {
        console.error('R2 bucket name is not configured');
        throw new Error('Storage is not configured');
      }

      const command =
        operation === 'read'
          ? new GetObjectCommand({
              Bucket: this.env.BUCKET_NAME,
              Key: path,
            })
          : new PutObjectCommand({
              Bucket: this.env.BUCKET_NAME,
              Key: path,
            });

      const url = await getSignedUrl(this.client, command, {
        expiresIn,
      });

      return { url };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }
}
