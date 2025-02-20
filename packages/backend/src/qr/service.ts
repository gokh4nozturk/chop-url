import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { qrCodes } from '../db/schema/qr-codes';
import { R2StorageService } from '../storage/service';
import { Env } from '../types';

export interface IQRCode {
  id: number;
  urlId: number;
  imageUrl: string;
  logoUrl: string | null;
  logoSize: number;
  logoPosition: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateQRCodeData {
  urlId: number;
  imageUrl: string;
  logoUrl?: string | null;
  logoSize?: number;
  logoPosition?: string;
}

export class QRCodeService {
  private readonly storageService: R2StorageService;

  constructor(
    private readonly db: Database,
    private readonly env: Env
  ) {
    this.storageService = new R2StorageService(env);
  }

  private async uploadQRImage(imageBlob: Blob, urlId: number): Promise<string> {
    const path = `qr-codes/${urlId}/${Date.now()}.png`;
    return this.storageService.uploadFile(imageBlob, path);
  }

  private async uploadLogoImage(
    imageBlob: Blob,
    urlId: number
  ): Promise<string> {
    const path = `qr-codes/${urlId}/logo-${Date.now()}.png`;
    return this.storageService.uploadFile(imageBlob, path);
  }

  async createQRCode(data: CreateQRCodeData): Promise<IQRCode> {
    // Convert base64 image to blob and upload to R2
    const imageBlob = await fetch(data.imageUrl).then((res) => res.blob());
    const r2ImageUrl = await this.uploadQRImage(imageBlob, data.urlId);

    let r2LogoUrl = null;
    if (data.logoUrl) {
      const logoBlob = await fetch(data.logoUrl).then((res) => res.blob());
      r2LogoUrl = await this.uploadLogoImage(logoBlob, data.urlId);
    }

    const [result] = await this.db
      .insert(qrCodes)
      .values({
        urlId: data.urlId,
        imageUrl: r2ImageUrl,
        logoUrl: r2LogoUrl,
        logoSize: data.logoSize || 40,
        logoPosition: data.logoPosition || 'center',
      })
      .returning();

    return {
      id: result.id,
      urlId: result.urlId,
      imageUrl: result.imageUrl,
      logoUrl: result.logoUrl,
      logoSize: result.logoSize || 40,
      logoPosition: result.logoPosition || 'center',
      downloadCount: result.downloadCount || 0,
      createdAt: result.createdAt || '',
      updatedAt: result.updatedAt || '',
    };
  }

  async getQRCodeById(id: number): Promise<IQRCode | null> {
    const [qrCode] = await this.db
      .select()
      .from(qrCodes)
      .where(eq(qrCodes.id, id))
      .limit(1);

    if (!qrCode) {
      return null;
    }

    return {
      id: qrCode.id,
      urlId: qrCode.urlId,
      imageUrl: qrCode.imageUrl,
      logoUrl: qrCode.logoUrl,
      logoSize: qrCode.logoSize || 40,
      logoPosition: qrCode.logoPosition || 'center',
      downloadCount: qrCode.downloadCount || 0,
      createdAt: qrCode.createdAt || '',
      updatedAt: qrCode.updatedAt || '',
    };
  }

  async getQRCode(urlId: number): Promise<IQRCode | null> {
    const [qrCode] = await this.db
      .select()
      .from(qrCodes)
      .where(eq(qrCodes.urlId, urlId))
      .limit(1);

    if (!qrCode) {
      return null;
    }

    return {
      id: qrCode.id,
      urlId: qrCode.urlId,
      imageUrl: qrCode.imageUrl,
      logoUrl: qrCode.logoUrl,
      logoSize: qrCode.logoSize || 40,
      logoPosition: qrCode.logoPosition || 'center',
      downloadCount: qrCode.downloadCount || 0,
      createdAt: qrCode.createdAt || '',
      updatedAt: qrCode.updatedAt || '',
    };
  }

  async updateQRCode(
    id: number,
    data: Partial<CreateQRCodeData>
  ): Promise<IQRCode> {
    // Get existing QR code
    const existingQR = await this.getQRCodeById(id);
    if (!existingQR) {
      throw new Error('QR code not found');
    }

    // Upload new images to R2 if provided
    const updateData: Partial<CreateQRCodeData> = {};

    if (data.imageUrl) {
      const imageBlob = await fetch(data.imageUrl).then((res) => res.blob());
      updateData.imageUrl = await this.uploadQRImage(
        imageBlob,
        existingQR.urlId
      );

      // Delete old image from R2
      if (existingQR.imageUrl) {
        const oldPath = new URL(existingQR.imageUrl).pathname.slice(1);
        await this.storageService.deleteFile(oldPath);
      }
    }

    if (data.logoUrl) {
      const logoBlob = await fetch(data.logoUrl).then((res) => res.blob());
      updateData.logoUrl = await this.uploadLogoImage(
        logoBlob,
        existingQR.urlId
      );

      // Delete old logo from R2
      if (existingQR.logoUrl) {
        const oldPath = new URL(existingQR.logoUrl).pathname.slice(1);
        await this.storageService.deleteFile(oldPath);
      }
    }

    const [result] = await this.db
      .update(qrCodes)
      .set({
        ...updateData,
        logoSize: data.logoSize,
        logoPosition: data.logoPosition,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(qrCodes.id, id))
      .returning();

    return {
      id: result.id,
      urlId: result.urlId,
      imageUrl: result.imageUrl,
      logoUrl: result.logoUrl,
      logoSize: result.logoSize || 40,
      logoPosition: result.logoPosition || 'center',
      downloadCount: result.downloadCount || 0,
      createdAt: result.createdAt || '',
      updatedAt: result.updatedAt || '',
    };
  }

  async incrementDownloadCount(id: number): Promise<void> {
    await this.db
      .update(qrCodes)
      .set({
        downloadCount: sql`${qrCodes.downloadCount} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(qrCodes.id, id));
  }
}
