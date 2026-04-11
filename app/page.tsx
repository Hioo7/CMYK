'use client';

import React, { useState, useCallback } from 'react';
import { Download, Image as ImageIcon, Trash2, FileArchive, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { convertToCMYK, downloadImage, getImageMetadata, extractImagesFromZip } from '@/lib/image-utils';
import { ImagePreview } from '@/components/ImagePreview';
import { ImageUploadZone } from '@/components/ImageUploadZone';
import { ConversionSettings } from '@/components/ConversionSettings';

export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  convertedUrl: string | null;
  metadata: { width: number; height: number; colorSpace: string; hasAlpha: boolean } | null;
  isProcessing: boolean;
  progress: number;
  error: string | null;
  fromZip: string | null; // ZIP filename if extracted from a ZIP
}

export default function Home() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [settings, setSettings] = useState({
    quality: 100,
    preserveTransparency: true,
    iccProfile: 'default',
    blackGeneration: 'light',
  });

  const processFiles = useCallback(async (files: File[]) => {
    // Separate ZIP files from images
    const zipFiles  = files.filter(f => f.name.toLowerCase().endsWith('.zip') || f.type.includes('zip'));
    const imgFiles  = files.filter(f => !f.name.toLowerCase().endsWith('.zip') && !f.type.includes('zip'));

    // Validate individual image sizes
    const validImgFiles = imgFiles.filter(f => f.size <= 50 * 1024 * 1024);

    // Extract images from ZIPs
    const extractedFromZip: Array<{ file: File; zipName: string }> = [];
    for (const zip of zipFiles) {
      try {
        const extracted = await extractImagesFromZip(zip);
        extracted.forEach(f => extractedFromZip.push({ file: f, zipName: zip.name }));
      } catch {
        // ZIP read failure — silently skip
      }
    }

    // Build combined list
    const allEntries: Array<{ file: File; fromZip: string | null }> = [
      ...validImgFiles.map(f => ({ file: f, fromZip: null })),
      ...extractedFromZip.map(({ file, zipName }) => ({ file, fromZip: zipName })),
    ];

    if (allEntries.length === 0) return;

    const newImages: ProcessedImage[] = allEntries.map(({ file, fromZip }) => ({
      id: Math.random().toString(36).substr(2, 9),
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      convertedUrl: null,
      metadata: null,
      isProcessing: true,
      progress: 0,
      error: null,
      fromZip,
    }));

    setImages(prev => [...prev, ...newImages]);

    // Process each image sequentially to avoid memory spikes
    for (const image of newImages) {
      try {
        const metadata = await getImageMetadata(image.originalFile);
        setImages(prev => prev.map(img =>
          img.id === image.id ? { ...img, metadata, progress: 20 } : img
        ));

        const convertedBlob = await convertToCMYK(image.originalFile, settings, (progress) => {
          setImages(prev => prev.map(img =>
            img.id === image.id ? { ...img, progress: 20 + progress * 0.8 } : img
          ));
        });

        const convertedUrl = URL.createObjectURL(convertedBlob);
        setImages(prev => prev.map(img =>
          img.id === image.id
            ? { ...img, convertedUrl, isProcessing: false, progress: 100 }
            : img
        ));
      } catch (error) {
        setImages(prev => prev.map(img =>
          img.id === image.id
            ? { ...img, error: error instanceof Error ? error.message : 'Conversion failed', isProcessing: false }
            : img
        ));
      }
    }
  }, [settings]);

  const handleFileUpload = useCallback((files: File[]) => {
    processFiles(files);
  }, [processFiles]);

  const handleDownload = (image: ProcessedImage) => {
    if (image.convertedUrl) {
      const baseName = image.originalFile.name.replace(/\.[^.]+$/, '');
      downloadImage(image.convertedUrl, `${baseName}_CMYK.png`);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalUrl);
        if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const handleClearAll = () => {
    images.forEach(img => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl);
    });
    setImages([]);
  };

  const completedImages = images.filter(img => img.convertedUrl && !img.isProcessing && !img.error);
  const processingCount = images.filter(img => img.isProcessing).length;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top gradient bar mimicking CMYK colors */}
      <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-pink-500 via-yellow-400 to-gray-900" />

      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-5">
            {/* CMYK color dots */}
            <span className="w-5 h-5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/40" />
            <span className="w-5 h-5 rounded-full bg-pink-400 shadow-lg shadow-pink-500/40" />
            <span className="w-5 h-5 rounded-full bg-yellow-400 shadow-lg shadow-yellow-500/40" />
            <span className="w-5 h-5 rounded-full bg-gray-300 shadow-lg shadow-gray-400/30" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            CMYK{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Converter
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Convert RGB images to print-ready CMYK — lossless PNG output.
            Supports JPG, PNG, and ZIP archives.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left panel */}
          <div className="lg:col-span-1 space-y-4">
            <ImageUploadZone onFileUpload={handleFileUpload} />
            <ConversionSettings settings={settings} onSettingsChange={setSettings} />

            {/* Batch actions */}
            {images.length > 0 && (
              <div className="flex flex-col gap-2">
                {completedImages.length > 1 && (
                  <Button
                    onClick={() => {
                      completedImages.forEach((img, i) =>
                        setTimeout(() => handleDownload(img), i * 150)
                      );
                    }}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All ({completedImages.length})
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="w-full border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-700/50 hover:bg-red-950/30 bg-transparent"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}

            {/* Stats bar */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-2">
                  <p className="text-lg font-bold text-white">{images.length}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-2">
                  <p className="text-lg font-bold text-cyan-400">{processingCount}</p>
                  <p className="text-xs text-gray-500">Processing</p>
                </div>
                <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-2">
                  <p className="text-lg font-bold text-emerald-400">{completedImages.length}</p>
                  <p className="text-xs text-gray-500">Done</p>
                </div>
              </div>
            )}
          </div>

          {/* Right panel — image list */}
          <div className="lg:col-span-2 space-y-4">
            {images.length === 0 ? (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="p-5 bg-gray-800/60 rounded-full">
                    <ImageIcon className="w-10 h-10 text-gray-500" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-300 mb-1">No images yet</h3>
                    <p className="text-gray-500 text-sm">Upload images or a ZIP archive to get started</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              images.map((image) => (
                <Card key={image.id} className="bg-gray-900/70 border-gray-700/60 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-start justify-between gap-3">
                      {/* File info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-gray-800 rounded-lg shrink-0">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-white text-sm font-medium truncate">
                            {image.originalFile.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-500">
                              {(image.originalFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            {image.fromZip && (
                              <span className="flex items-center gap-1 text-xs text-cyan-500">
                                <FileArchive className="w-3 h-3" />
                                {image.fromZip}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status + remove */}
                      <div className="flex items-center gap-2 shrink-0">
                        {image.error && (
                          <Badge className="bg-red-950 text-red-400 border-red-700/50 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Error
                          </Badge>
                        )}
                        {image.isProcessing && (
                          <Badge className="bg-cyan-950 text-cyan-400 border-cyan-700/50 text-xs">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Processing
                          </Badge>
                        )}
                        {image.convertedUrl && !image.isProcessing && !image.error && (
                          <Badge className="bg-emerald-950 text-emerald-400 border-emerald-700/50 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Done
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveImage(image.id)}
                          className="text-gray-600 hover:text-red-400 hover:bg-red-950/30 h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {image.isProcessing && (
                      <div className="mt-3 space-y-1">
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                            style={{ width: `${image.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Converting… {Math.round(image.progress)}%
                        </p>
                      </div>
                    )}

                    {image.error && (
                      <div className="mt-3 p-3 bg-red-950/40 border border-red-700/30 rounded-lg">
                        <p className="text-red-400 text-xs">{image.error}</p>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="px-5 pb-5">
                    <ImagePreview
                      image={image}
                      onDownload={() => handleDownload(image)}
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-xs flex items-center justify-center gap-4">
          <span>Lossless PNG output</span>
          <span>·</span>
          <span>Client-side processing — your images never leave your device</span>
          <span>·</span>
          <span>ZIP support</span>
        </div>
      </div>
    </div>
  );
}
