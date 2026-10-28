import { resolveLogoUrl } from '../utils/prebuiltLogos';

export interface PreparedImages {
  logoDataUrl: string | null;
  qrDataUrl: string | null;
  warnings: string[];
}

interface RasterizeOptions {
  targetWidth?: number;
  targetHeight?: number;
  maxSide?: number;
}

/**
 * Loads an image (SVG, WebP, PNG, JPG, or data URL), draws it to a canvas,
 * and returns a PNG data URL.
 * Keeps aspect ratio, scales to target dimensions, and caps the longest side at 1200px.
 */
export async function rasterizeImage(
  src: string,
  options: RasterizeOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!src) {
      return reject(new Error('Empty image source'));
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    const maxSide = options.maxSide ?? 1200;

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Fallback for SVGs without explicit naturalWidth/Height in some viewports
        if (!width || !height) {
          width = options.targetWidth || 300;
          height = options.targetHeight || 300;
        }

        let targetW: number;
        let targetH: number;

        if (options.targetHeight && !options.targetWidth) {
          const scale = options.targetHeight / height;
          targetH = options.targetHeight;
          targetW = Math.round(width * scale);
        } else if (options.targetWidth && !options.targetHeight) {
          const scale = options.targetWidth / width;
          targetW = options.targetWidth;
          targetH = Math.round(height * scale);
        } else if (options.targetWidth && options.targetHeight) {
          targetW = options.targetWidth;
          targetH = options.targetHeight;
        } else {
          targetW = width;
          targetH = height;
        }

        // Cap the longest side at maxSide (default 1200px)
        const longest = Math.max(targetW, targetH);
        if (longest > maxSide) {
          const capScale = maxSide / longest;
          targetW = Math.round(targetW * capScale);
          targetH = Math.round(targetH * capScale);
        }

        targetW = Math.max(1, targetW);
        targetH = Math.max(1, targetH);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const pngDataUrl = canvas.toDataURL('image/png');
        resolve(pngDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src.slice(0, 60)}...`));
    };

    img.src = src;
  });
}

/**
 * Prepares the logo and QR images for PDF export.
 * Logo displays at max-height 48px -> rasterize at 3x = 144px height.
 * QR displays at 150px wide -> rasterize at 3x = 450px width.
 * If an image fails to load, skips it, records a non-blocking warning, and does not fail.
 */
export async function prepareImages(
  logoSrc?: string | null,
  qrDataUrl?: string | null
): Promise<PreparedImages> {
  const result: PreparedImages = {
    logoDataUrl: null,
    qrDataUrl: null,
    warnings: [],
  };

  if (logoSrc) {
    try {
      const resolvedSrc = logoSrc.startsWith('data:')
        ? logoSrc
        : resolveLogoUrl({ kind: 'prebuilt', src: logoSrc });
      result.logoDataUrl = await rasterizeImage(resolvedSrc, {
        targetHeight: 48 * 3, // 144px
        maxSide: 1200,
      });
    } catch (err) {
      console.warn('Logo rasterization skipped:', err);
      result.warnings.push('Logo could not be included.');
    }
  }

  if (qrDataUrl) {
    try {
      result.qrDataUrl = await rasterizeImage(qrDataUrl, {
        targetWidth: 150 * 3, // 450px
        maxSide: 1200,
      });
    } catch (err) {
      console.warn('QR rasterization skipped:', err);
      result.warnings.push('QR could not be included.');
    }
  }

  return result;
}
