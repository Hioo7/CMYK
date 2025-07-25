import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Professional CMYK Converter - High-Quality Image Conversion',
  description: 'Convert your RGB images to professional CMYK format for printing. Support for JPG, JPEG, PNG with lossless conversion and advanced color space management.',
  keywords: 'CMYK converter, RGB to CMYK, image conversion, print ready, color space, professional printing',
  authors: [{ name: 'CMYK Converter' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#1e293b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎨</text></svg>" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}