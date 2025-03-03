import { withSchema } from '@/db/helpers';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../db/client';
import { qrCodes } from '../db/schema/qr-codes';
import { CreateQRCodeData, IQRCode, UpdateQRCodeData } from './types.js';

export class QRCodeService {
  constructor(private readonly db: Database) {}

  async createQRCode(data: CreateQRCodeData): Promise<IQRCode> {
    const [result] = await this.db
      .insert(qrCodes)
      .values({
        urlId: data.urlId,
        imageUrl: data.imageUrl,
      })
      .returning();

    return {
      id: result.id,
      urlId: result.urlId,
      imageUrl: result.imageUrl,
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
      downloadCount: qrCode.downloadCount || 0,
      createdAt: qrCode.createdAt || '',
      updatedAt: qrCode.updatedAt || '',
    };
  }

  async updateQRCode(id: number, data: UpdateQRCodeData): Promise<IQRCode> {
    const [result] = await this.db
      .update(qrCodes)
      .set(data)
      .where(eq(qrCodes.id, id))
      .returning();

    return {
      id: result.id,
      urlId: result.urlId,
      imageUrl: result.imageUrl,
      downloadCount: result.downloadCount || 0,
      createdAt: result.createdAt || '',
      updatedAt: result.updatedAt || '',
    };
  }

  async incrementDownloadCount(id: number): Promise<void> {
    await this.db
      .update(qrCodes)
      .set(
        withSchema({
          downloadCount: sql`${qrCodes.downloadCount} + 1`,
          updatedAt: new Date().toISOString(),
        })
      )
      .where(eq(qrCodes.id, id));
  }
}
