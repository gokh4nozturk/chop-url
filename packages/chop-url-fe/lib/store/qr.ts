import apiClient from '@/lib/api/client';
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
  getQRCode: (
    urlId: string,
    shortUrl: string,
    options?: QRCodeOptions
  ) => Promise<void>;
  updateQRCode: (id: number, options: QRCodeOptions) => Promise<void>;
  downloadQRCode: () => void;
}

export const useQRStore = create<QRState>((set, get) => ({
  isLoading: false,
  qrCode: null,
  error: null,
  options: null,
  getQRCode: async (
    urlId: string,
    shortUrl: string,
    options?: QRCodeOptions
  ) => {
    try {
      set({ isLoading: true, error: null });

      // First, try to get existing QR code from database
      try {
        const { data: existingQR } = await apiClient.get<QRResponse>(
          `/api/qr/url/${urlId}`
        );

        // If options are different, update the QR code
        if (
          JSON.stringify({
            logoUrl: existingQR.logoUrl,
            logoSize: existingQR.logoSize,
            logoPosition: existingQR.logoPosition,
          }) !== JSON.stringify(options)
        ) {
          // Update existing QR code with new options
          await get().updateQRCode(existingQR.id, options || {});
          return;
        }

        set({
          qrCode: existingQR.imageUrl,
          options: existingQR.logoUrl
            ? {
                logoUrl: existingQR.logoUrl,
                logoSize: existingQR.logoSize,
                logoPosition:
                  existingQR.logoPosition as QRCodeOptions['logoPosition'],
              }
            : null,
        });
        return;
      } catch (error) {
        // If QR code doesn't exist (404), continue to create new one
        if (!(error instanceof AxiosError && error.response?.status === 404)) {
          throw error;
        }
      }

      // Create QR code using QRCodeSVG
      const { createElement } = await import('react');
      const { QRCodeSVG } = await import('qrcode.react');

      // Create SVG element
      const svgElement = createElement(QRCodeSVG, {
        value: shortUrl,
        size: 280,
        level: 'H',
        includeMargin: true,
      });

      // Convert React element to SVG string
      const container = document.createElement('div');
      container.appendChild(svgElement as unknown as Node);
      const svgString = container.innerHTML;

      // Convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const scale = 2;
      canvas.width = 280 * scale;
      canvas.height = 280 * scale;

      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create QR code image
      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 0, 0, canvas.width, canvas.height);
          resolve();
        };
        qrImg.onerror = () => reject(new Error('Failed to load QR code image'));
        qrImg.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
      });

      // Convert to base64
      const qrImageUrl = canvas.toDataURL('image/png');

      // Create new QR code in database
      const { data: newQrCode } = await apiClient.post<QRResponse>('/api/qr', {
        urlId: parseInt(urlId),
        imageUrl: qrImageUrl,
        ...(options?.logoUrl ? { logoUrl: options.logoUrl } : {}),
        ...(options?.logoSize ? { logoSize: options.logoSize } : {}),
        ...(options?.logoPosition
          ? { logoPosition: options.logoPosition }
          : {}),
      });

      set({
        qrCode: newQrCode.imageUrl,
        options: null,
      });
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

      // Create a canvas to combine QR code and logo
      const canvas = document.createElement('canvas');
      const scale = 2; // For better quality
      canvas.width = 280 * scale;
      canvas.height = 280 * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Load and draw QR code
      const qrImage = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = () =>
          reject(new Error('Failed to load QR code image'));
        qrImage.src = currentQR.imageUrl;
      });

      // Set white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx.drawImage(qrImage, 0, 0, canvas.width, canvas.height);

      let logoBase64: string | null = null;

      // If we have logo, convert it to base64
      if (options.logoUrl && typeof options.logoUrl === 'string') {
        const logoCanvas = document.createElement('canvas');
        const logoCtx = logoCanvas.getContext('2d');
        if (!logoCtx) throw new Error('Could not get logo canvas context');

        const logoImg = new Image();
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => {
            // Set canvas size to match the logo
            logoCanvas.width = logoImg.width;
            logoCanvas.height = logoImg.height;

            // Draw logo on its own canvas
            logoCtx.drawImage(logoImg, 0, 0);

            // Convert to base64
            const base64 = logoCanvas.toDataURL('image/png');
            logoBase64 = base64;
            resolve();
          };
          logoImg.onerror = () =>
            reject(new Error('Failed to load logo image'));
          if (options.logoUrl) {
            logoImg.src = options.logoUrl;
          } else {
            reject(new Error('Logo URL is undefined'));
          }
        });

        // Draw logo on QR code canvas if we have a valid base64
        if (logoBase64) {
          const overlayLogo = new Image();
          await new Promise<void>((resolve, reject) => {
            overlayLogo.onload = () => resolve();
            overlayLogo.onerror = () =>
              reject(new Error('Failed to load overlay logo'));
            if (typeof logoBase64 === 'string') {
              overlayLogo.src = logoBase64;
            } else {
              reject(new Error('Invalid logo base64'));
            }
          });

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
          ctx.drawImage(overlayLogo, logoX, logoY, logoSize, logoSize);
        }
      }

      // Convert canvas to base64
      const combinedImageUrl = canvas.toDataURL('image/png');

      // Update QR code with new logo options and the combined image
      const { data: updatedQR } = await apiClient.put<QRResponse>(
        `/api/qr/${id}`,
        {
          imageUrl: combinedImageUrl,
          ...(logoBase64 ? { logoUrl: logoBase64 } : {}),
          ...(options.logoSize ? { logoSize: options.logoSize } : {}),
          ...(options.logoPosition
            ? { logoPosition: options.logoPosition }
            : {}),
        }
      );

      set({
        qrCode: updatedQR.imageUrl,
        options: {
          logoUrl: updatedQR.logoUrl,
          logoSize: updatedQR.logoSize,
          logoPosition: updatedQR.logoPosition as QRCodeOptions['logoPosition'],
        },
      });
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
}));

export default useQRStore;
