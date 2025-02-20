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
      // Fix for client version 3.729.0+ compatibility
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async getPresignedUrl(
    path: string,
    operation: 'read' | 'write' = 'read',
    expiresIn = 3600 // 1 hour
  ): Promise<{ url: string; headers: Record<string, string> }> {
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
              ContentType: 'image/svg+xml',
              ACL: 'public-read-write',
              Expires: new Date(Date.now() + expiresIn * 1000), // 1 hour
            });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      console.log(`Generated ${operation} presigned URL:`, url);

      const headers = {
        'Content-Type': 'application/octet-stream',
      };

      return { url, headers };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }
}
