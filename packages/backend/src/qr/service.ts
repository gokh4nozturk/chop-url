import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { qrCodes } from '../db/schema/qr-codes';

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
  constructor(private readonly db: Database) {}

  async createQRCode(data: CreateQRCodeData): Promise<IQRCode> {
    const [result] = await this.db
      .insert(qrCodes)
      .values({
        urlId: data.urlId,
        imageUrl: data.imageUrl,
        logoUrl: data.logoUrl || null,
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
    const [result] = await this.db
      .update(qrCodes)
      .set({
        ...data,
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
