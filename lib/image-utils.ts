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
  outputResolution: string; // 'auto' = same as input, or a DPI number as string
}

// Black generation functions (original)
const BLACK_GENERATION: Record<string, (c: number, m: number, y: number) => number> = {
  'none':    () => 0,
  'light':   (c, m, y) => Math.min(c, m, y) * 0.1,
  'medium':  (c, m, y) => Math.min(c, m, y) * 0.2,
  'heavy':   (c, m, y) => Math.min(c, m, y) * 0.3,
  'maximum': (c, m, y) => Math.min(c, m, y) * 0.4,
};

// Extract images from a ZIP file
export async function extractImagesFromZip(zipFile: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(zipFile);
  const imageFiles: File[] = [];
  const supportedExts = ['jpg', 'jpeg', 'png'];

  const entries: Array<[string, JSZip.JSZipObject]> = [];
  zip.forEach((relativePath, entry) => entries.push([relativePath, entry]));

  for (const [relativePath, entry] of entries) {
    if (entry.dir) continue;
    const filename = relativePath.split('/').pop() || relativePath;
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext || !supportedExts.includes(ext)) continue;
    const blob = await entry.async('blob');
    const mimeType = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
    imageFiles.push(new File([blob], filename, { type: mimeType }));
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

      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('No canvas context')); return; }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let hasAlpha = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) { hasAlpha = true; break; }
      }

      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height, colorSpace: 'RGB', hasAlpha });
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Write a genuine CMYK TIFF binary in the browser — no server required.
//
// Key TIFF tags that make professional tools (Photoshop, etc.) recognise the
// file as true CMYK:
//   262  PhotometricInterpretation = 5  (CMYK)
//   277  SamplesPerPixel           = 4  (C, M, Y, K)
//   258  BitsPerSample             = 8,8,8,8
//   332  InkSet                    = 1  (CMYK)
// ─────────────────────────────────────────────────────────────────────────────
function writeCmykTiff(width: number, height: number, cmykData: Uint8Array): Blob {
  const N_TAGS       = 14;
  const HEADER_SIZE  = 8;
  const IFD_SIZE     = 2 + N_TAGS * 12 + 4;  // count + entries + next-IFD ptr
  const EXTRA_SIZE   = 8 + 8 + 8;             // BitsPerSample + XRes + YRes
  const IMG_OFFSET   = HEADER_SIZE + IFD_SIZE + EXTRA_SIZE;
  const IMG_SIZE     = width * height * 4;
  const TOTAL        = IMG_OFFSET + IMG_SIZE;

  const buf  = new ArrayBuffer(TOTAL);
  const view = new DataView(buf);
  let p = 0;

  const w16 = (v: number) => { view.setUint16(p, v, true); p += 2; };
  const w32 = (v: number) => { view.setUint32(p, v, true); p += 4; };

  // Offsets for values that don't fit inside a 4-byte IFD field
  const BPS_OFF  = HEADER_SIZE + IFD_SIZE;        // BitsPerSample [8,8,8,8]
  const XRES_OFF = BPS_OFF + 8;                   // XResolution RATIONAL
  const YRES_OFF = XRES_OFF + 8;                  // YResolution RATIONAL

  // ── TIFF header ──────────────────────────────────────────────────────────
  w16(0x4949);   // 'II'  little-endian
  w16(42);       // TIFF magic
  w32(8);        // offset to first IFD

  // ── IFD ─────────────────────────────────────────────────────────────────
  w16(N_TAGS);

  // tag(2) type(2) count(4) value_or_offset(4)
  // Types: SHORT=3  LONG=4  RATIONAL=5
  const e = (tag: number, type: number, count: number, val: number) => {
    w16(tag); w16(type); w32(count); w32(val);
  };

  // Entries MUST be in ascending tag order:
  e(256, 4, 1, width);         // ImageWidth
  e(257, 4, 1, height);        // ImageLength
  e(258, 3, 4, BPS_OFF);       // BitsPerSample → offset
  e(259, 3, 1, 1);             // Compression: none (1)
  e(262, 3, 1, 5);             // PhotometricInterpretation: CMYK (5) ← key tag
  e(273, 4, 1, IMG_OFFSET);    // StripOffsets
  e(277, 3, 1, 4);             // SamplesPerPixel: 4
  e(278, 4, 1, height);        // RowsPerStrip: one strip = entire image
  e(279, 4, 1, IMG_SIZE);      // StripByteCounts
  e(282, 5, 1, XRES_OFF);      // XResolution → offset
  e(283, 5, 1, YRES_OFF);      // YResolution → offset
  e(284, 3, 1, 1);             // PlanarConfiguration: chunky (CMYKCMYK…)
  e(296, 3, 1, 2);             // ResolutionUnit: inch
  e(332, 3, 1, 1);             // InkSet: CMYK (1) ← confirms ink model

  w32(0); // no next IFD

  // ── Extra data ───────────────────────────────────────────────────────────
  w16(8); w16(8); w16(8); w16(8);   // BitsPerSample values
  w32(300); w32(1);                  // XResolution: 300/1 DPI
  w32(300); w32(1);                  // YResolution: 300/1 DPI

  // ── Image data ───────────────────────────────────────────────────────────
  new Uint8Array(buf, IMG_OFFSET).set(cmykData);

  return new Blob([buf], { type: 'image/tiff' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main conversion — tries the server-side Sharp API first (proper ICC color
// management), falls back to the fixed client-side path if the server is
// unavailable.
// ─────────────────────────────────────────────────────────────────────────────
export async function convertToCMYK(
  file: File,
  settings: ConversionSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  onProgress?.(10);

  // ── 1. Try server-side conversion (Sharp + ICC profiles) ─────────────────
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('outputResolution', settings.outputResolution ?? 'auto');

    const res = await fetch('/api/convert', { method: 'POST', body: formData });
    if (res.ok) {
      onProgress?.(100);
      return await res.blob();
    }
  } catch {
    // Server unavailable — fall through to client-side path
  }

  // ── 2. Client-side fallback with corrected algorithm ─────────────────────
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Could not get canvas context');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0);
        onProgress?.(25);

        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const total    = data.length;
        onProgress?.(35);

        const cmykData   = new Uint8Array((total / 4) * 4);
        const blackGenFn = BLACK_GENERATION[settings.blackGeneration] ?? BLACK_GENERATION['medium'];

        for (let i = 0; i < total; i += 4) {
          // Work in sRGB display space — CMY are ink percentages, not light values,
          // so no gamma linearisation is needed. The roundtrip R = (1-C)×(1-K)×255
          // stays accurate this way.
          const rN = data[i]     / 255;
          const gN = data[i + 1] / 255;
          const bN = data[i + 2] / 255;

          let c = 1 - rN;
          let m = 1 - gN;
          let y = 1 - bN;

          let k = 0;
          if (settings.blackGeneration !== 'none') {
            k = blackGenFn(c, m, y); // correct GCR amount (no * 0.3 dampener)
            c = Math.max(0, c - k);  // proper UCR: subtract full k (not k * 0.2)
            m = Math.max(0, m - k);
            y = Math.max(0, y - k);
          }

          const px = (i / 4) * 4;
          cmykData[px]     = Math.round(c * 255);
          cmykData[px + 1] = Math.round(m * 255);
          cmykData[px + 2] = Math.round(y * 255);
          cmykData[px + 3] = Math.round(k * 255);

          if (i % 40000 === 0) {
            onProgress?.(35 + (i / total) * 55);
          }
        }

        onProgress?.(90);
        const tiff = writeCmykTiff(canvas.width, canvas.height, cmykData);
        onProgress?.(100);
        resolve(tiff);

      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

export function downloadImage(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}
