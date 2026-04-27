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
    //   'auto'    → 300 DPI (print standard)
    //   'preserve'→ keep input DPI as-is
    //   numeric   → that DPI
    // Output is always resized to credit-card physical dimensions: 85.6 × 54 mm
    const outputResolution = (formData.get('outputResolution') as string) ?? 'auto';

    const inputMeta = await sharp(buffer).metadata();
    // metadata.density is pixels per inch; fall back to 72 DPI if absent.
    const inputDpi = inputMeta.density ?? 72;

    let targetDpi: number;
    if (outputResolution === 'preserve') {
      targetDpi = inputDpi;
    } else {
      targetDpi = outputResolution === 'auto' ? 300 : Number(outputResolution);
    }

    // Credit-card physical dimensions (ISO/IEC 7810 ID-1)
    const CARD_WIDTH_MM  = 85.6;
    const CARD_HEIGHT_MM = 54;

    // Sharp TIFF xres/yres are in pixels per mm (libvips convention).
    const ppmm = targetDpi / 25.4;

    // Always resize to exact credit-card pixel dimensions at the target DPI.
    const outWidth  = Math.round(CARD_WIDTH_MM  * ppmm);
    const outHeight = Math.round(CARD_HEIGHT_MM * ppmm);

    let pipeline = sharp(buffer).resize(outWidth, outHeight, {
      kernel: 'lanczos3',
      fit: 'fill',
    });

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
