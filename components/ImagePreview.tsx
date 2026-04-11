'use client';

import React from 'react';
import { Download, ZoomIn, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { ProcessedImage } from '@/app/page';

interface ImagePreviewProps {
  image: ProcessedImage;
  onDownload: () => void;
}

export function ImagePreview({ image, onDownload }: ImagePreviewProps) {
  if (image.isProcessing || image.error) return null;

  const originalFormat = image.originalFile.name.split('.').pop()?.toUpperCase() ?? 'IMAGE';

  return (
    <div className="space-y-3">
      {/* Original image preview */}
      <div className="relative group rounded-lg overflow-hidden bg-[#111] border border-gray-800">
        <img
          src={image.originalUrl}
          alt="Original"
          className="w-full h-56 object-contain"
        />
        <div className="absolute top-2 left-2">
          <span className="text-xs bg-black/60 text-gray-300 px-2 py-0.5 rounded">
            Original · {originalFormat}
          </span>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white border-0 h-7 w-7 p-0"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl bg-gray-950 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white text-sm">Original Image</DialogTitle>
            </DialogHeader>
            <img
              src={image.originalUrl}
              alt="Original"
              className="w-full max-h-[75vh] object-contain rounded-lg bg-[#0a0a0a]"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* CMYK ready banner */}
      {image.convertedUrl && (
        <div className="flex items-center gap-3 p-3 bg-emerald-950/40 border border-emerald-700/40 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-emerald-300 text-sm font-medium">CMYK TIFF ready</p>
            <p className="text-emerald-600 text-xs">
              True CMYK color space · LZW lossless · 300 DPI · ICC profiled
            </p>
          </div>
        </div>
      )}

      {/* Metadata strip */}
      {image.metadata && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <MetaCell label="Dimensions" value={`${image.metadata.width}×${image.metadata.height}`} />
          <MetaCell label="Input" value={originalFormat} />
          <MetaCell label="Output" value="CMYK TIFF" highlight />
        </div>
      )}

      {/* Download */}
      {image.convertedUrl && (
        <Button
          onClick={onDownload}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium h-9"
        >
          <Download className="w-4 h-4 mr-2" />
          Download CMYK TIFF
        </Button>
      )}
    </div>
  );
}

function MetaCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/40 rounded-lg py-2 px-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-xs font-semibold ${highlight ? 'text-cyan-400' : 'text-gray-200'}`}>
        {value}
      </p>
    </div>
  );
}
