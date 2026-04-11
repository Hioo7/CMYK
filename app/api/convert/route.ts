import { NextRequest, NextResponse } from 'next/server';

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

    // Dynamically import sharp
    let sharp;
    try {
      sharp = (await import('sharp')).default;
    } catch (importErr) {
      console.warn('Sharp import failed:', importErr);
      return NextResponse.json(
        { error: 'Image processing library unavailable' },
        { status: 503 }
      );
    }

    try {
      // Convert to CMYK PNG (more serverless-compatible than TIFF)
      const cmykBuffer = await sharp(buffer)
        .toColorspace('cmyk')
        .png({
          quality: 100,
          compressionLevel: 9,
        })
        .toBuffer();

      return new NextResponse(cmykBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': String(cmykBuffer.length),
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (sharpErr) {
      console.error('Sharp conversion error:', sharpErr);
      throw sharpErr;
    }
  } catch (err) {
    console.error('CMYK conversion error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Conversion failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
