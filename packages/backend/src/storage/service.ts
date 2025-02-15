import { Env } from '../types';

export class R2StorageService {
  constructor(private readonly env: Env) {}

  async getPresignedUrl(
    path: string
  ): Promise<{ url: string; headers: Record<string, string> }> {
    try {
      const url = `${this.env.R2_PUBLIC_URL}/${path}`;
      // R2 requires specific headers for direct upload
      const headers = {
        'Content-Type': 'application/octet-stream',
        'x-amz-acl': 'public-read',
      };

      return { url, headers };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  async uploadFile(file: File | Blob, path: string): Promise<string> {
    try {
      await this.env.BUCKET.put(path, file);
      return `${this.env.R2_PUBLIC_URL}/${path}`;
    } catch (error) {
      console.error('Error uploading file to R2:', error);
      throw new Error('Failed to upload file to R2');
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await this.env.BUCKET.delete(path);
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      throw new Error('Failed to delete file from R2');
    }
  }
}
