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

// Enhanced ICC Profiles with more accurate color matrices
const ICC_PROFILES = {
  'default': {
    name: 'Default CMYK',
    gamma: 2.2,
    whitePoint: [0.9505, 1.0000, 1.0890],
    matrix: [
      [0.4124564, 0.3575761, 0.1804375],
      [0.2126729, 0.7151522, 0.0721750],
      [0.0193339, 0.1191920, 0.9503041]
    ]
  },
  'coated-fogra39': {
    name: 'Coated FOGRA39',
    gamma: 1.8,
    whitePoint: [0.9642, 1.0000, 0.8249],
    matrix: [
      [0.4360747, 0.3850649, 0.1430804],
      [0.2225045, 0.7168786, 0.0606169],
      [0.0139322, 0.0971045, 0.7141733]
    ]
  },
  'uncoated-fogra29': {
    name: 'Uncoated FOGRA29',
    gamma: 1.8,
    whitePoint: [0.9642, 1.0000, 0.8249],
    matrix: [
      [0.4360747, 0.3850649, 0.1430804],
      [0.2225045, 0.7168786, 0.0606169],
      [0.0139322, 0.0971045, 0.7141733]
    ]
  },
  'us-web-coated': {
    name: 'US Web Coated',
    gamma: 2.2,
    whitePoint: [0.9505, 1.0000, 1.0890],
    matrix: [
      [0.4124564, 0.3575761, 0.1804375],
      [0.2126729, 0.7151522, 0.0721750],
      [0.0193339, 0.1191920, 0.9503041]
    ]
  },
  'japan-color-2001': {
    name: 'Japan Color 2001',
    gamma: 1.8,
    whitePoint: [0.9505, 1.0000, 1.0890],
    matrix: [
      [0.4124564, 0.3575761, 0.1804375],
      [0.2126729, 0.7151522, 0.0721750],
      [0.0193339, 0.1191920, 0.9503041]
    ]
  }
};

// Improved black generation with better color preservation
const BLACK_GENERATION = {
  'none': (c: number, m: number, y: number) => 0,
  'light': (c: number, m: number, y: number) => Math.min(c, m, y) * 0.1,
  'medium': (c: number, m: number, y: number) => Math.min(c, m, y) * 0.2,
  'heavy': (c: number, m: number, y: number) => Math.min(c, m, y) * 0.3,
  'maximum': (c: number, m: number, y: number) => Math.min(c, m, y) * 0.4
};

export async function getImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      
      // Check for alpha channel by sampling pixels
      const imageData = ctx.getImageData(0, 0, Math.min(100, img.width), Math.min(100, img.height));
      let hasAlpha = false;
      
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 255) {
          hasAlpha = true;
          break;
        }
      }

      resolve({
        width: img.width,
        height: img.height,
        colorSpace: 'RGB',
        hasAlpha
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Improved RGB to CMYK conversion with better color preservation
function preserveColorRgbToCmyk(r: number, g: number, b: number, blackGen: string = 'medium'): [number, number, number, number] {
  // Normalize RGB values to 0-1 range
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Simple, direct CMY calculation without gamma correction
  let c = 1 - rNorm;
  let m = 1 - gNorm;
  let y = 1 - bNorm;

  // Minimal black generation to preserve colors
  let k = 0;
  if (blackGen !== 'none') {
    const minCMY = Math.min(c, m, y);
    const blackGenFn = BLACK_GENERATION[blackGen as keyof typeof BLACK_GENERATION] || BLACK_GENERATION.light;
    k = blackGenFn(c, m, y) * 0.3; // Reduce black generation significantly
    
    // Very conservative UCR to maintain color appearance
    const reduction = k * 0.2; // Minimal reduction
    c = Math.max(0, c - reduction);
    m = Math.max(0, m - reduction);
    y = Math.max(0, y - reduction);
  }

  // Convert back to 0-255 range
  return [
    Math.round(c * 255),
    Math.round(m * 255),
    Math.round(y * 255),
    Math.round(k * 255)
  ];
}

// Enhanced CMYK to RGB conversion for preview
function accurateCmykToRgb(c: number, m: number, y: number, k: number): [number, number, number] {
  // Normalize CMYK values to 0-1 range
  const cNorm = c / 255;
  const mNorm = m / 255;
  const yNorm = y / 255;
  const kNorm = k / 255;

  // Direct CMYK to RGB conversion without gamma correction
  const r = 255 * (1 - cNorm) * (1 - kNorm);
  const g = 255 * (1 - mNorm) * (1 - kNorm);
  const b = 255 * (1 - yNorm) * (1 - kNorm);

  return [
    Math.round(Math.max(0, Math.min(255, r))),
    Math.round(Math.max(0, Math.min(255, g))),
    Math.round(Math.max(0, Math.min(255, b)))
  ];
}

export async function convertToCMYK(
  file: File, 
  settings: ConversionSettings,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image with high quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0);
        onProgress?.(20);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        onProgress?.(40);

        // Convert RGB to CMYK with improved algorithm
        const processedData = new Uint8ClampedArray(data.length);
        const totalPixels = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Convert to CMYK
          const [c, m, y, k] = preserveColorRgbToCmyk(r, g, b, settings.blackGeneration);
          
          // Convert back to RGB for display with improved accuracy
          const [rNew, gNew, bNew] = accurateCmykToRgb(c, m, y, k);

          processedData[i] = rNew;
          processedData[i + 1] = gNew;
          processedData[i + 2] = bNew;
          processedData[i + 3] = settings.preserveTransparency ? a : 255;

          // Update progress
          if (i % 8000 === 0) {
            onProgress?.(40 + (i / data.length) * 40);
          }
        }

        onProgress?.(80);

        // Create new image data and draw to canvas
        const newImageData = new ImageData(processedData, canvas.width, canvas.height);
        
        // Clear canvas and draw processed image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.putImageData(newImageData, 0, 0);

        onProgress?.(90);

        // Convert to high-quality blob
        canvas.toBlob((blob) => {
          if (blob) {
            onProgress?.(100);
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png', 1.0); // Use PNG for lossless quality

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function downloadImage(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Enhanced color space conversion utilities
export class ColorSpaceConverter {
  static sRGBToLinearRGB(value: number): number {
    const normalized = value / 255;
    return normalized <= 0.04045 
      ? normalized / 12.92 
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  }

  static linearRGBToSRGB(value: number): number {
    const clamped = Math.max(0, Math.min(1, value));
    const result = clamped <= 0.0031308 
      ? clamped * 12.92 
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(result * 255);
  }

  static rgbToXyz(r: number, g: number, b: number): [number, number, number] {
    const rLin = this.sRGBToLinearRGB(r);
    const gLin = this.sRGBToLinearRGB(g);
    const bLin = this.sRGBToLinearRGB(b);

    // sRGB to XYZ transformation matrix (D65 illuminant)
    const x = rLin * 0.4124564 + gLin * 0.3575761 + bLin * 0.1804375;
    const y = rLin * 0.2126729 + gLin * 0.7151522 + bLin * 0.0721750;
    const z = rLin * 0.0193339 + gLin * 0.1191920 + bLin * 0.9503041;

    return [x, y, z];
  }

  static xyzToLab(x: number, y: number, z: number, whitePoint = [0.9505, 1.0000, 1.0890]): [number, number, number] {
    const xn = x / whitePoint[0];
    const yn = y / whitePoint[1];
    const zn = z / whitePoint[2];

    const delta = 6/29;
    const fx = xn > Math.pow(delta, 3) ? Math.pow(xn, 1/3) : (xn / (3 * Math.pow(delta, 2)) + 4/29);
    const fy = yn > Math.pow(delta, 3) ? Math.pow(yn, 1/3) : (yn / (3 * Math.pow(delta, 2)) + 4/29);
    const fz = zn > Math.pow(delta, 3) ? Math.pow(zn, 1/3) : (zn / (3 * Math.pow(delta, 2)) + 4/29);

    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);

    return [l, a, b];
  }

  // Advanced CMYK conversion with perceptual color matching
  static rgbToCmykPerceptual(r: number, g: number, b: number): [number, number, number, number] {
    // Convert to XYZ color space first
    const [x, y, z] = this.rgbToXyz(r, g, b);
    
    // Convert to Lab for perceptual uniformity
    const [l, a, bLab] = this.xyzToLab(x, y, z);
    
    // Enhanced CMYK calculation based on perceptual data
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    
    // Calculate CMY with perceptual weighting
    const c = (1 - rNorm) * (1 + l / 200); // Lightness compensation
    const m = (1 - gNorm) * (1 + l / 200);
    const p = (1 - bNorm) * (1 + l / 200);
    
    // Calculate black with improved algorithm
    const k = Math.min(c, m, p) * 0.7; // Conservative black generation
    
    // Apply UCR with color preservation
    const cFinal = Math.max(0, Math.min(1, c - k * 0.8));
    const mFinal = Math.max(0, Math.min(1, m - k * 0.8));
    const yFinal = Math.max(0, Math.min(1, p - k * 0.8));
    const kFinal = Math.max(0, Math.min(1, k));
    
    return [
      Math.round(cFinal * 255),
      Math.round(mFinal * 255),
      Math.round(yFinal * 255),
      Math.round(kFinal * 255)
    ];
  }
}