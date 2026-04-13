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
    // LZW is lossless and typically halves the file size vs uncompressed,
    // keeping the response well under Vercel's 4.5 MB body limit.
    const cmykBuffer = await sharp(buffer)
      .toColorspace('cmyk')
      .tiff({
        compression: 'lzw', // lossless — no quality loss, smaller than uncompressed
        xres: 300,          // 300 DPI — print-ready
        yres: 300,
        bitdepth: 8,
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
