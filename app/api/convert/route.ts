import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

// Allow up to 50 MB request body
export const config = {
  api: { bodyParser: false },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Convert to true CMYK TIFF using Sharp/libvips ICC-based conversion
    const cmykBuffer = await sharp(buffer)
      .toColorspace('cmyk')
      .tiff({
        compression: 'lzw',   // lossless LZW compression
        quality: 100,
        xres: 300,             // 300 DPI — print-ready resolution
        yres: 300,
      })
      .toBuffer();

    return new NextResponse(cmykBuffer, {
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
