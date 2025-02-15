import { Env } from '../types';

export class R2StorageService {
  constructor(private readonly env: Env) {}

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
