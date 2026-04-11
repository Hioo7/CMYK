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

    // Sharp converts to a true CMYK TIFF using libvips ICC-managed conversion.
    // PNG cannot hold CMYK — TIFF is the correct container for print-ready CMYK.
    const cmykBuffer = await sharp(buffer)
      .toColorspace('cmyk')
      .tiff({
        compression: 'lzw',  // lossless
        xres: 300,            // 300 DPI — print-ready
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
