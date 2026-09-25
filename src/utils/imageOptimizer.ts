/**
 * Client-side image optimization utility.
 * Automatically resizes, compresses, and converts images into web-friendly WebP / JPEG
 * to preserve quality while minimizing storage and transfer size.
 */

export interface OptimizedImageResult {
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  reductionPercentage: number;
  format: string;
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxDimension?: number;
  quality?: number;
  format?: string;
}

export async function optimizeProductImage(
  file: File,
  optionsOrMaxDimension?: number | ImageOptimizationOptions,
  qualityParam: number = 0.82
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (PNG, JPG, WebP, etc.).'));
    }

    let maxDim = 800;
    let quality = qualityParam;
    let preferredFormat = 'image/webp';

    if (typeof optionsOrMaxDimension === 'number') {
      maxDim = optionsOrMaxDimension;
    } else if (typeof optionsOrMaxDimension === 'object' && optionsOrMaxDimension !== null) {
      maxDim = optionsOrMaxDimension.maxDimension || optionsOrMaxDimension.maxWidth || 800;
      if (optionsOrMaxDimension.quality !== undefined) {
        quality = optionsOrMaxDimension.quality;
      }
      if (optionsOrMaxDimension.format) {
        preferredFormat = optionsOrMaxDimension.format;
      }
    }

    const originalSize = file.size;
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio-preserving dimensions
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not initialize canvas context for image optimization.'));
        }

        // Draw with high-quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try preferred format (WebP by default); fallback if not supported
        let targetFormat = preferredFormat;
        let dataUrl = canvas.toDataURL(targetFormat, quality);

        if (!dataUrl.startsWith(`data:${targetFormat}`)) {
          targetFormat = 'image/jpeg';
          dataUrl = canvas.toDataURL(targetFormat, quality);
        }

        // Calculate approximate size in bytes from base64 string
        const base64Length = dataUrl.split(',')[1]?.length || 0;
        const optimizedSize = Math.round((base64Length * 3) / 4);

        const reductionPercentage = Math.max(
          0,
          Math.round(((originalSize - optimizedSize) / originalSize) * 100)
        );

        resolve({
          dataUrl,
          originalSize,
          optimizedSize,
          width,
          height,
          reductionPercentage,
          format: targetFormat.replace('image/', '').toUpperCase(),
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
