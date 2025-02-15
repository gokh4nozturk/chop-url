import { Env } from '../types';

export class R2StorageService {
  constructor(private readonly env: Env) {}

  async getPresignedUrl(
    path: string
  ): Promise<{ url: string; headers: Record<string, string> }> {
    try {
      if (!this.env.BUCKET) {
        console.error('R2 bucket is not configured');
        throw new Error('Storage is not configured');
      }

      if (!this.env.R2_PUBLIC_URL) {
        console.error('R2_PUBLIC_URL is not configured');
        throw new Error('Storage is not configured');
      }

      const url = `${this.env.R2_PUBLIC_URL}/${path}`;
      console.log('Generated URL:', url);

      const headers = {
        'Content-Type': 'application/octet-stream',
      };

      return { url, headers };
    } catch (error) {
      console.error('Error generating URL:', error);
      throw new Error('Failed to generate URL');
    }
  }

  async uploadFile(file: Blob, path: string): Promise<string> {
    try {
      if (!this.env.BUCKET) {
        console.error('R2 bucket is not configured');
        throw new Error('Storage is not configured');
      }

      if (!this.env.R2_PUBLIC_URL) {
        console.error('R2_PUBLIC_URL is not configured');
        throw new Error('Storage is not configured');
      }

      console.log('Uploading file:', {
        path,
        type: file.type,
        size: file.size,
      });

      await this.env.BUCKET.put(path, file, {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000',
        },
      });

      const url = `${this.env.R2_PUBLIC_URL}/${path}`;
      console.log('File uploaded successfully:', url);
      return url;
    } catch (error) {
      console.error('Error uploading file to R2:', error);
      throw new Error('Failed to upload file to R2');
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      if (!this.env.BUCKET) {
        console.error('R2 bucket is not configured');
        throw new Error('Storage is not configured');
      }

      console.log('Deleting file:', path);
      await this.env.BUCKET.delete(path);
      console.log('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      throw new Error('Failed to delete file from R2');
    }
  }
}
