export interface ImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number; // default 2MB
}

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function fileToDataUrl(file: File, options: ImageOptions = {}): Promise<string> {
  const {
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.9,
    maxSizeBytes = MAX_FILE_SIZE,
  } = options;

  if (file.size > maxSizeBytes) {
    const sizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${sizeMb} MB.`);
  }

  const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    throw new Error('Unsupported file type. Please upload a PNG, JPG, WebP, or SVG image.');
  }

  // Special handling for SVG files
  if (file.type === 'image/svg+xml') {
    const text = await file.text();
    // Security check: reject SVGs containing script tags or event handlers
    const hasScriptTag = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(text) || /<script/i.test(text);
    const hasInlineHandlers = /\bon[a-z]+\s*=/i.test(text);

    if (hasScriptTag || hasInlineHandlers) {
      throw new Error('Security warning: SVG files containing scripts or inline event handlers are not allowed.');
    }

    // Convert safe SVG text to base64 data URL
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return `data:image/svg+xml;base64,${encoded}`;
  }

  // Handle raster images (PNG, JPEG, WebP)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file content.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // If smaller than bounds, return reader result directly
        if (width <= maxWidth && height <= maxHeight) {
          resolve(reader.result as string);
          return;
        }

        // Downscale preserving aspect ratio
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export with requested format
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputType, quality);
        resolve(dataUrl);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
