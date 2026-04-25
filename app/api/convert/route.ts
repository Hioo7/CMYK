import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // outputResolution options:
    //   'auto'    → 300 DPI (print standard), pixels resampled to preserve physical size
    //   'preserve'→ keep input DPI as-is, no resampling (pixel dimensions unchanged)
    //   numeric   → resample to that DPI, physical size preserved
    const outputResolution = (formData.get('outputResolution') as string) ?? 'auto';

    const inputMeta = await sharp(buffer).metadata();
    // metadata.density is pixels per inch; fall back to 72 DPI if absent.
    const inputDpi = inputMeta.density ?? 72;

    let targetDpi: number;
    let shouldResample: boolean;

    if (outputResolution === 'preserve') {
      // No resampling — keep pixel count and DPI exactly as input
      targetDpi = inputDpi;
      shouldResample = false;
    } else {
      // 'auto' → 300 DPI for print; numeric → that DPI
      targetDpi = outputResolution === 'auto' ? 300 : Number(outputResolution);
      // Resample only when DPI actually changes, to preserve physical print dimensions
      shouldResample = Math.round(inputDpi) !== Math.round(targetDpi);
    }

    // Sharp TIFF xres/yres are in pixels per mm (libvips convention).
    const ppmm = targetDpi / 25.4;

    let pipeline = sharp(buffer);

    // Resample pixels so the physical print size stays the same at the new DPI.
    // Example: 3000×2000 at 72 DPI → 12500×8333 at 300 DPI → same 41.7"×27.8" printed.
    if (shouldResample && inputMeta.width && inputMeta.height) {
      const scale = targetDpi / inputDpi;
      pipeline = pipeline.resize(
        Math.round(inputMeta.width * scale),
        Math.round(inputMeta.height * scale),
        { kernel: 'lanczos3', fit: 'fill' }
      );
    }

    // Sharp converts to a true CMYK TIFF using libvips ICC-managed conversion.
    // LZW is lossless and typically halves the file size vs uncompressed.
    const cmykBuffer = await pipeline
      .toColorspace('cmyk')
      .tiff({
        compression: 'lzw',
        xres: ppmm,
        yres: ppmm,
        bitdepth: 8,
      })
      .toBuffer();

    return new NextResponse(new Uint8Array(cmykBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/tiff',
        'Content-Length': String(cmykBuffer.length),
      },
    });
  } catch (err) {
    console.error('CMYK conversion error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}
