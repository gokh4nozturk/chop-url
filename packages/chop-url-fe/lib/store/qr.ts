import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { create } from 'zustand';

interface IQRCode {
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

export interface QRCodeOptions {
  logoUrl?: string;
  logoSize?: number;
  logoPosition?:
    | 'center'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';
}

interface QRCodeStore {
  qrCode: IQRCode | null;
  isLoading: boolean;
  error: Error | null;
  getQRCode: (urlId: number, shortUrl: string) => Promise<void>;
  updateQRCode: (id: number, options: QRCodeOptions) => Promise<void>;
  incrementDownloadCount: (id: number) => Promise<void>;
  uploadToR2: (file: File | Blob, path: string) => Promise<string>;
}

const useQRCodeStore = create<QRCodeStore>((set) => ({
  qrCode: null,
  isLoading: false,
  error: null,

  getQRCode: async (urlId: number, shortUrl: string) => {
    try {
      set({ isLoading: true, error: null });

      // First try to get existing QR code
      const { data } = await axios.get(`/api/qr/${urlId}`);
      console.log('data', data);
      if (data) {
        set({ qrCode: data, isLoading: false });
        return;
      }

      // If not found, generate new QR code
      const qrCodeElement = createElement(QRCodeSVG, {
        value: shortUrl,
        size: 1024,
        level: 'H',
        includeMargin: true,
      });
      const qrCodeSvg = renderToString(qrCodeElement);

      // Convert SVG to Blob
      const blob = new Blob([qrCodeSvg], { type: 'image/svg+xml' });

      // Upload to R2
      const store = useQRCodeStore.getState();
      const imageUrl = await store.uploadToR2(blob, `qr-codes/${urlId}.svg`);

      // Save to backend
      const { data: newQrCode } = await axios.post('/api/qr', {
        urlId,
        imageUrl,
      });

      set({ qrCode: newQrCode, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },

  updateQRCode: async (id: number, options: QRCodeOptions) => {
    try {
      set({ isLoading: true, error: null });

      // If logo provided, upload it first
      let logoUrl = options.logoUrl;
      if (options.logoUrl?.startsWith('data:')) {
        const logoBlob = await fetch(options.logoUrl).then((r) => r.blob());
        const store = useQRCodeStore.getState();
        logoUrl = await store.uploadToR2(logoBlob, `qr-codes/logos/${id}.png`);
      }

      const { data } = await axios.put(`/api/qr/${id}`, {
        ...options,
        logoUrl,
      });

      set({ qrCode: data, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },

  uploadToR2: async (file: File | Blob, path: string) => {
    try {
      // Get presigned URL
      const {
        data: { url, headers },
      } = await axios.post('/api/storage/presigned-url', { path });

      // Upload directly to R2
      await axios.put(url, file, {
        headers: {
          ...headers,
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      return url;
    } catch (error) {
      console.error('Error uploading to R2:', error);
      throw new Error('Failed to upload file');
    }
  },

  incrementDownloadCount: async (id: number) => {
    try {
      await axios.post(`/api/qr/${id}/download`);
    } catch (error) {
      console.error('Error incrementing download count:', error);
    }
  },
}));

export default useQRCodeStore;
