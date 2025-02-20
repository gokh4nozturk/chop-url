import apiClient from '@/lib/api/client';
import axios from 'axios';
import { AxiosError } from 'axios';
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
  logoUrl?: string;
  logoSize?: number;
  logoPosition?: string;
}

interface QRState {
  isLoading: boolean;
  qrCode: string | null;
  error: Error | null;
  options: QRCodeOptions | null;
  status: number | null;
  getQRCode: (
    urlId: string,
    shortUrl: string,
    options?: QRCodeOptions
  ) => Promise<void>;
  updateQRCode: (id: number, options: QRCodeOptions) => Promise<void>;
  downloadQRCode: () => void;
  fetchPresignedUrl: (urlId: string) => Promise<{
    presignedUrl: string;
  }>;
  uploadQRCode: (presignedUrl: string, file: Blob) => Promise<void>;
}

export const useQRStore = create<QRState>((set, get) => ({
  isLoading: false,
  qrCode: null,
  error: null,
  options: null,
  status: null,
  getQRCode: async (
    urlId: string,
    shortUrl: string,
    options?: QRCodeOptions
  ) => {
    const currentState = get();

    if (currentState.isLoading) return;

    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.get<QRResponse>(`/api/qr/url/${urlId}`);

      if (response.status === 204) {
        set({ status: response.status });
        return;
      }

      if (response.status === 200) {
        const currentOptions = {
          logoUrl: response.data.logoUrl,
          logoSize: response.data.logoSize,
          logoPosition: response.data.logoPosition,
        };

        // Only update if options are different
        if (
          options &&
          JSON.stringify(currentOptions) !== JSON.stringify(options)
        ) {
          await get().updateQRCode(response.data.id, options);
          return;
        }

        set({
          status: response.status,
          qrCode: response.data.imageUrl,
          options: response.data.logoUrl
            ? {
                logoUrl: response.data.logoUrl,
                logoSize: response.data.logoSize,
                logoPosition: response.data
                  .logoPosition as QRCodeOptions['logoPosition'],
              }
            : null,
        });
      }

      return;
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
  updateQRCode: async (id: number, options: QRCodeOptions) => {
    try {
      set({ isLoading: true, error: null });

      // Get the current QR code first
      const { data: currentQR } = await apiClient.get<QRResponse>(
        `/api/qr/${id}`
      );

      console.log('currentQR', currentQR);
    } catch (error) {
      console.error('Error updating QR code:', error);
      set({
        error:
          error instanceof Error ? error : new Error('Unknown error occurred'),
      });
    } finally {
      set({ isLoading: false });
    }
  },
  downloadQRCode: () => {
    const qrCode = document.querySelector('#qr-code-svg') as HTMLElement;
    if (!qrCode) return;

    // Get SVG data
    const svgData = new XMLSerializer().serializeToString(qrCode);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8',
    });

    // Convert to PNG with logo
    const img = new Image();
    const options = get().options;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // For better quality
      canvas.width = 280 * scale;
      canvas.height = 280 * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // If we have logo options, draw the logo
      if (options?.logoUrl) {
        const logo = new Image();
        logo.onload = () => {
          const logoSize = (options.logoSize || 40) * scale;
          let logoX = 0;
          let logoY = 0;

          // Calculate logo position
          switch (options.logoPosition) {
            case 'center':
              logoX = (canvas.width - logoSize) / 2;
              logoY = (canvas.height - logoSize) / 2;
              break;
            case 'top-left':
              logoX = canvas.width * 0.1;
              logoY = canvas.height * 0.1;
              console.log('top-left', logoX, logoY);
              break;
            case 'top-right':
              logoX = canvas.width * 0.9 - logoSize;
              logoY = canvas.height * 0.1;
              break;
            case 'bottom-left':
              logoX = canvas.width * 0.1;
              logoY = canvas.height * 0.9 - logoSize;
              break;
            case 'bottom-right':
              logoX = canvas.width * 0.9 - logoSize;
              logoY = canvas.height * 0.9 - logoSize;
              break;
            default:
              logoX = (canvas.width - logoSize) / 2;
              logoY = (canvas.height - logoSize) / 2;
          }

          // Draw logo
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

          // Create download link
          const link = document.createElement('a');
          link.download = 'qr-code.png';
          link.href = canvas.toDataURL('image/png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
        logo.src = options.logoUrl;
      } else {
        // If no logo, download immediately
        const link = document.createElement('a');
        link.download = 'qr-code.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    img.src = URL.createObjectURL(svgBlob);
  },
  fetchPresignedUrl: async (urlId: string) => {
    try {
      const { data } = await apiClient.post(
        '/api/storage/generate-presigned-url',
        {
          path: `qr/${urlId}.svg`,
          operation: 'write',
        }
      );

      return {
        presignedUrl: data.url,
      };
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
      throw error;
    }
  },
  uploadQRCode: async (presignedUrl: string, file: Blob) => {
    try {
      const response = await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      });

      if (response.status !== 200) {
        console.error('Upload failed:', response.status);
        throw new Error(`Upload failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
      throw error;
    }
  },
}));

export default useQRStore;
