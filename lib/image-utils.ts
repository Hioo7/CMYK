import JSZip from 'jszip';

export interface ImageMetadata {
  width: number;
  height: number;
  colorSpace: string;
  hasAlpha: boolean;
}

export interface ConversionSettings {
  quality: number;
  preserveTransparency: boolean;
  iccProfile: string;
  blackGeneration: string;
}

// Extract images from a ZIP file
export async function extractImagesFromZip(zipFile: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(zipFile);
  const imageFiles: File[] = [];
  const supportedExts = ['jpg', 'jpeg', 'png'];

  const entries: Array<[string, JSZip.JSZipObject]> = [];
  zip.forEach((relativePath, entry) => {
    entries.push([relativePath, entry]);
  });

  for (const [relativePath, entry] of entries) {
    if (entry.dir) continue;

    const filename = relativePath.split('/').pop() || relativePath;
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext || !supportedExts.includes(ext)) continue;

    const blob = await entry.async('blob');
    const mimeType = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
    const file = new File([blob], filename, { type: mimeType });
    imageFiles.push(file);
  }

  return imageFiles;
}

export async function getImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(100, img.width);
      canvas.height = Math.min(100, img.height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let hasAlpha = false;

      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 255) {
          hasAlpha = true;
          break;
        }
      }

      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height, colorSpace: 'RGB', hasAlpha });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export async function convertToCMYK(
  file: File,
  _settings: ConversionSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  onProgress?.(10);

  const formData = new FormData();
  formData.append('file', file);

  onProgress?.(30);

  const response = await fetch('/api/convert', {
    method: 'POST',
    body: formData,
  });

  onProgress?.(80);

  if (!response.ok) {
    let message = 'Server conversion failed';
    try {
      const json = await response.json();
      message = json.error ?? message;
    } catch {}
    throw new Error(message);
  }

  const blob = await response.blob();
  onProgress?.(100);
  return blob;
}

export function downloadImage(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}
