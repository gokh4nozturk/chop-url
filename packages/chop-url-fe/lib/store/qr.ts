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

      // First, try to get existing QR code from database
      try {
        const { data: existingQR } = await apiClient.get<QRResponse>(
          `/api/qr/url/${urlId}`
        );
        set({ qrCode: existingQR.imageUrl });
        return;
      } catch (error) {
        // If QR code doesn't exist (404) or other error, continue to create new one
        if (!(error instanceof AxiosError && error.response?.status === 404)) {
          throw error;
        }
      }

      // Generate new QR code SVG if one doesn't exist
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

      // Create new QR code in database
      const { data: newQrCode } = await apiClient.post<QRResponse>('/api/qr', {
        urlId,
        imageUrl,
      });
      set({ qrCode: newQrCode.imageUrl });
    } catch (error) {
      console.error('Error handling QR code:', error);
      set({
        error:
          error instanceof Error ? error : new Error('Unknown error occurred'),
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
