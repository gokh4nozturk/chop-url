// QR Code types
export interface IQRCode {
  id: number;
  urlId: number;
  imageUrl: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQRCodeData {
  urlId: number;
  imageUrl: string;
}

export interface UpdateQRCodeData {
  imageUrl?: string;
  logoUrl?: string;
  logoSize?: number;
  logoPosition?: string;
  downloadCount?: number;
  updatedAt?: string;
}
