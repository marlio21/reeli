/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImageMeta {
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  width: number;
  height: number;
  format: 'webp' | 'jpg' | 'png';
  optimized: boolean;
}

export interface OptimizedBlob extends Blob {
  imageMeta: ImageMeta;
}

/**
 * Checks if the browser supports 'image/webp' natively.
 */
function isWebpSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) {
    return false;
  }
}

/**
 * Reads a user-uploaded image file, crops it to a strict 1:1 square ratio
 * centered on the original, resizes it, and compresses it.
 */
export function compressAndSquareImage(
  file: File,
  maxDim: number = 800,
  quality: number = 0.8
): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
      return reject(new Error('Das hochgeladene Dokument ist kein unterstütztes Bild (nur JPG, PNG, WebP erlaubt).'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context creation failed'));
        }

        // Center crop calculation for 1:1 ratio
        const srcW = img.width;
        const srcH = img.height;
        const squareSize = Math.min(srcW, srcH);
        
        const startX = (srcW - squareSize) / 2;
        const startY = (srcH - squareSize) / 2;

        // Fill with white background (handles transparent images cleanly if converted to JPG)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, maxDim, maxDim);
        ctx.drawImage(
          img,
          startX,
          startY,
          squareSize,
          squareSize,
          0,
          0,
          maxDim,
          maxDim
        );

        const useWebp = isWebpSupported();
        const mimeType = useWebp ? 'image/webp' : 'image/jpeg';
        const formatName = useWebp ? 'webp' : 'jpg';

        const exportToBlobOfSize = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Bild-Konvertierung fehlgeschlagen / Export failed'));
              }
              // Adjust size down to fits the general limit of 300KB
              if (blob.size > 300 * 1024 && currentQuality > 0.2) {
                exportToBlobOfSize(currentQuality - 0.1);
              } else {
                const previewUrl = URL.createObjectURL(blob);
                const imageMeta: ImageMeta = {
                  originalSizeBytes: file.size,
                  optimizedSizeBytes: blob.size,
                  width: maxDim,
                  height: maxDim,
                  format: formatName,
                  optimized: true
                };
                Object.defineProperty(blob, 'imageMeta', {
                  value: imageMeta,
                  writable: true,
                  enumerable: true,
                  configurable: true
                });
                resolve({ blob, previewUrl });
              }
            },
            mimeType,
            currentQuality
          );
        };
        exportToBlobOfSize(quality);
      };
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Reads an image file, resizes it preserving the original aspect ratio, and compresses it.
 */
export function compressImageKeepAspect(
  file: File,
  maxW: number = 1080,
  maxH: number = 1920,
  quality: number = 0.8
): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return reject(new Error('Das hochgeladene Dokument ist kein unterstütztes Bild (nur JPG, PNG, WebP erlaubt).'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }
        if (height > maxH) {
          width = Math.round((width * maxH) / height);
          height = maxH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context creation failed'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        const useWebp = isWebpSupported();
        const mimeType = useWebp ? 'image/webp' : 'image/jpeg';
        const formatName = useWebp ? 'webp' : 'jpg';

        const exportToBlobOfSize = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Bild-Konvertierung fehlgeschlagen / Export failed'));
              }
              if (blob.size > 800 * 1024 && currentQuality > 0.2) {
                exportToBlobOfSize(currentQuality - 0.1);
              } else {
                const previewUrl = URL.createObjectURL(blob);
                const imageMeta: ImageMeta = {
                  originalSizeBytes: file.size,
                  optimizedSizeBytes: blob.size,
                  width,
                  height,
                  format: formatName,
                  optimized: true
                };
                Object.defineProperty(blob, 'imageMeta', {
                  value: imageMeta,
                  writable: true,
                  enumerable: true,
                  configurable: true
                });
                resolve({ blob, previewUrl });
              }
            },
            mimeType,
            currentQuality
          );
        };
        exportToBlobOfSize(quality);
      };
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Universal compress and optimize image function targeting:
 * - 'profile': Max 800x800px, 1:1 center-cropped, WebP/JPG fallback, Target: ~300KB
 * - 'background' / 'hero' / 'slideshow' / 'after-sequence': Max 1080x1920px, format WebP/JPG fallback, Target: ~800KB
 * - 'logo': Max 1200px longest edge, preserves transparent PNG if transparent pixels exist, else WebP/JPG, Target: ~400KB
 * - 'og': 1200x630 px fixed aspect-fit or stretch box, WebP/JPG, Target: ~500KB
 */
export function compressImageBeforeUpload(
  file: File,
  type: 'profile' | 'logo' | 'background' | 'hero' | 'gallery' | 'slideshow' | 'after-sequence' | 'og'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 1. Strict File Type Validation
    const mimeLower = file.type.toLowerCase();
    const isPng = mimeLower === 'image/png';
    const isJpg = mimeLower === 'image/jpeg' || mimeLower === 'image/jpg';
    const isWebp = mimeLower === 'image/webp';

    if (!isPng && !isJpg && !isWebp) {
      return reject(new Error('Nur Bilddateien im Format JPG, PNG oder WebP sind erlaubt! Gefährliche Dateiendungen wurden aus Sicherheitsgründen blockiert.'));
    }

    // Set configuration bounds based on image type requirements
    let maxW = 1080;
    let maxH = 1920;
    let targetSizeKB = 800;
    let quality = 0.85;
    let isSquareCrop = false;
    let isOgAspect = false;

    if (type === 'profile') {
      maxW = 800;
      maxH = 800;
      targetSizeKB = 300;
      isSquareCrop = true;
    } else if (type === 'background' || type === 'hero' || type === 'slideshow' || type === 'after-sequence' || type === 'gallery') {
      maxW = 1080;
      maxH = 1920;
      targetSizeKB = 800;
    } else if (type === 'logo') {
      maxW = 1200;
      maxH = 1200;
      targetSizeKB = 400;
    } else if (type === 'og') {
      maxW = 1200;
      maxH = 630;
      targetSizeKB = 500;
      isOgAspect = true;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let destW = img.width;
        let destH = img.height;

        // Keep aspect ratio resize sizing logic
        if (!isSquareCrop && !isOgAspect) {
          if (destW > maxW || destH > maxH) {
            const ratio = Math.min(maxW / destW, maxH / destH);
            destW = Math.round(destW * ratio);
            destH = Math.round(destH * ratio);
          }
        } else if (isSquareCrop) {
          destW = maxW;
          destH = maxH;
        } else if (isOgAspect) {
          destW = 1200;
          destH = 630;
        }

        const canvas = document.createElement('canvas');
        canvas.width = destW;
        canvas.height = destH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context could not be created.'));
        }

        // Action drawing on canvas based on crop/fit structure
        if (isSquareCrop) {
          // Center crop calculation for 1:1 format
          const srcSize = Math.min(img.width, img.height);
          const srcX = (img.width - srcSize) / 2;
          const srcY = (img.height - srcSize) / 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, destW, destH);
          ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, destW, destH);
        } else if (isOgAspect) {
          // Fill white and draw container scaled to fit safely inside 1200x630
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, destW, destH);
          
          const imgRatio = img.width / img.height;
          const canvasRatio = destW / destH;
          let drawW = destW;
          let drawH = destH;
          let drawX = 0;
          let drawY = 0;

          if (imgRatio > canvasRatio) {
            drawH = destW / imgRatio;
            drawY = (destH - drawH) / 2;
          } else {
            drawW = destH * imgRatio;
            drawX = (destW - drawW) / 2;
          }
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
          // Standard transparent/opaque copy
          ctx.drawImage(img, 0, 0, destW, destH);
        }

        // Assess transparency for PNG to preserve transparent branding safely!
        let hasTransparentPixels = false;
        if (isPng) {
          try {
            const imgData = ctx.getImageData(0, 0, destW, destH).data;
            for (let i = 3; i < imgData.length; i += 4) {
              if (imgData[i] < 250) {
                hasTransparentPixels = true;
                break;
              }
            }
          } catch (e) {
            // sandbox CORS or fallback safety
            hasTransparentPixels = true;
          }
        }

        // WebP, JPG, or PNG (only if transparency needed in PNG files)
        const useWebp = isWebpSupported();
        let targetMime = 'image/jpeg';
        let formatName: 'webp' | 'jpg' | 'png' = 'jpg';

        if (isPng && hasTransparentPixels) {
          targetMime = 'image/png';
          formatName = 'png';
        } else if (useWebp) {
          targetMime = 'image/webp';
          formatName = 'webp';
        }

        const exportToFinalBlob = (currentQuality: number) => {
          canvas.toBlob(
            (finalBlob) => {
              if (!finalBlob) {
                // If WebP failed, fallback immediately to JPEG
                if (targetMime === 'image/webp') {
                  targetMime = 'image/jpeg';
                  formatName = 'jpg';
                  exportToFinalBlob(currentQuality);
                } else {
                  return reject(new Error('Bild-Verarbeitung ist fehlgeschlagen.'));
                }
                return;
              }

              // Adjust down quality iteratively if size exceeds target limit
              // PNG files are lossless, so size control exists primarily via scale-down dimensions above
              if (targetMime !== 'image/png' && finalBlob.size > targetSizeKB * 1024 && currentQuality > 0.25) {
                exportToFinalBlob(currentQuality - 0.1);
              } else {
                // Attach imageMeta values cleanly for consumption/display
                const imageMeta: ImageMeta = {
                  originalSizeBytes: file.size,
                  optimizedSizeBytes: finalBlob.size,
                  width: destW,
                  height: destH,
                  format: formatName,
                  optimized: true
                };

                // Inject property dynamically on final Blob
                Object.defineProperty(finalBlob, 'imageMeta', {
                  value: imageMeta,
                  writable: true,
                  enumerable: true,
                  configurable: true
                });

                resolve(finalBlob);
              }
            },
            targetMime,
            targetMime === 'image/png' ? undefined : currentQuality
          );
        };

        exportToFinalBlob(quality);
      };
      img.onerror = () => reject(new Error('Bild-Rendern im Canvas fehlgeschlagen. Die Datei ist möglicherweise beschädigt.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Fehler beim Einlesen des Bildes.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Formats user storage bytes to dynamic MB sizes.
 */
export function formatMB(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2);
}

/**
 * Formats image optimization metrics helper string for toasts/messages
 */
export function formatImageOptimizationToast(meta: ImageMeta, lang: string): string {
  const savingsPercent = Math.max(0, Math.min(99, Math.round((1 - meta.optimizedSizeBytes / meta.originalSizeBytes) * 100)));
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  const origStr = formatBytes(meta.originalSizeBytes);
  const optStr = formatBytes(meta.optimizedSizeBytes);
  
  if (lang === 'de') {
    return `Bild optimiert: ${origStr} → ${optStr} (-${savingsPercent}%)`;
  } else {
    return `Image optimized: ${origStr} → ${optStr} (-${savingsPercent}%)`;
  }
}
