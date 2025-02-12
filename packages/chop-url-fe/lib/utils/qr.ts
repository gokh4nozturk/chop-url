import { QRCodeSVG } from 'qrcode.react';
import { createElement } from 'react';

interface QRCodeOptions {
  value: string;
  size?: number;
  logo?: {
    src: string;
    size?: number;
    excavate?: boolean;
  };
}

export const generateQRCode = async (
  options: QRCodeOptions
): Promise<string> => {
  const { value, size = 190, logo } = options;

  // Create SVG element
  const svgElement = createElement(QRCodeSVG, {
    value,
    size,
    level: 'H',
    includeMargin: true,
    imageSettings: logo
      ? {
          src: logo.src,
          height: logo.size || 40,
          width: logo.size || 40,
          excavate: logo.excavate ?? true,
        }
      : undefined,
  });

  // Convert React element to SVG string
  const container = document.createElement('div');
  container.appendChild(svgElement as unknown as Node);
  const svgString = container.innerHTML;

  // Convert QR code to PNG
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set up canvas
  const scale = 4; // 4x magnification for better quality
  canvas.width = size * scale;
  canvas.height = size * scale;

  // Configure canvas
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Make background white
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Create QR code image
  const qrImg = document.createElement('img');

  return new Promise<string>((resolve, reject) => {
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 0, 0, canvas.width, canvas.height);

      // Add logo if specified
      if (logo) {
        const logoImg = document.createElement('img');
        logoImg.onload = () => {
          const logoSize = (logo.size || 40) * scale;
          const logoX = (canvas.width - logoSize) / 2;
          const logoY = (canvas.height - logoSize) / 2;
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          resolve(canvas.toDataURL('image/png', 1.0));
        };
        logoImg.onerror = reject;
        logoImg.src = logo.src;
      } else {
        resolve(canvas.toDataURL('image/png', 1.0));
      }
    };
    qrImg.onerror = reject;
    qrImg.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
  });
};

export const downloadQRCode = (qrCodeUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = qrCodeUrl;
  link.download = filename;
  link.click();
};
