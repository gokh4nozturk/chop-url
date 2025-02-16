import apiClient from '@/lib/api/client';
import { AxiosError } from 'axios';
import QRCode from 'qrcode';
import { create } from 'zustand';

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

interface QRResponse {
  id: number;
  imageUrl: string;
}

interface QRState {
  isLoading: boolean;
  qrCode: string | null;
  error: Error | null;
  getQRCode: (urlId: string, shortUrl: string) => Promise<void>;
  downloadQRCode: () => void;
}

export const useQRStore = create<QRState>((set, get) => ({
  isLoading: false,
  qrCode: null,
  error: null,
  getQRCode: async (urlId: string, shortUrl: string) => {
    try {
      set({ isLoading: true, error: null });

      // Generate QR code SVG
      const qrCodeSvg = await QRCode.toString(shortUrl, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 41,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Create a data URL from the SVG
      const base64 = btoa(unescape(encodeURIComponent(qrCodeSvg)));
      const imageUrl = `data:image/svg+xml;base64,${base64}`;

      // Create or update QR code in database
      try {
        const { data: existingQR } = await apiClient.get<QRResponse>(
          `/api/qr/url/${urlId}`
        );
        const { data: updatedQR } = await apiClient.put<QRResponse>(
          `/api/qr/${existingQR.id}`,
          { imageUrl }
        );
        set({ qrCode: updatedQR.imageUrl });
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          const { data: newQrCode } = await apiClient.post<QRResponse>(
            '/api/qr',
            { urlId, imageUrl }
          );
          set({ qrCode: newQrCode.imageUrl });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      set({
        error:
          error instanceof Error ? error : new Error('Unknown error occurred'),
        isLoading: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },
  downloadQRCode: () => {
    const qrCode = get().qrCode;
    if (!qrCode) return;

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'qr-code.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
}));

export default useQRStore;
