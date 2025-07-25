'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, Download, Eye, Settings, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { convertToCMYK, downloadImage, getImageMetadata } from '@/lib/image-utils';
import { ImagePreview } from '@/components/ImagePreview';
import { ImageUploadZone } from '@/components/ImageUploadZone';
import { ConversionSettings } from '@/components/ConversionSettings';

interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  convertedUrl: string | null;
  metadata: any;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export default function Home() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [settings, setSettings] = useState({
    quality: 100,
    preserveTransparency: true,
    iccProfile: 'default',
    blackGeneration: 'medium'
  });

  const handleFileUpload = useCallback(async (files: File[]) => {
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      convertedUrl: null,
      metadata: null,
      isProcessing: true,
      progress: 0,
      error: null
    }));

    setImages(prev => [...prev, ...newImages]);

    // Process each image
    for (const image of newImages) {
      try {
        // Get metadata
        const metadata = await getImageMetadata(image.originalFile);
        
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, metadata, progress: 25 }
            : img
        ));

        // Convert to CMYK
        const convertedBlob = await convertToCMYK(image.originalFile, settings, (progress) => {
          setImages(prev => prev.map(img => 
            img.id === image.id 
              ? { ...img, progress: 25 + (progress * 0.75) }
              : img
          ));
        });

        const convertedUrl = URL.createObjectURL(convertedBlob);
        
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { 
                ...img, 
                convertedUrl, 
                isProcessing: false, 
                progress: 100 
              }
            : img
        ));

      } catch (error) {
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { 
                ...img, 
                error: error instanceof Error ? error.message : 'Conversion failed',
                isProcessing: false 
              }
            : img
        ));
      }
    }
  }, [settings]);

  const handleDownload = (image: ProcessedImage) => {
    if (image.convertedUrl) {
      downloadImage(image.convertedUrl, `${image.originalFile.name.split('.')[0]}_CMYK.tiff`);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.originalUrl);
        if (imageToRemove.convertedUrl) {
          URL.revokeObjectURL(imageToRemove.convertedUrl);
        }
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleDownloadAll = () => {
    images.forEach(image => {
      if (image.convertedUrl && !image.isProcessing && !image.error) {
        handleDownload(image);
      }
    });
  };

  const completedImages = images.filter(img => img.convertedUrl && !img.isProcessing && !img.error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Professional CMYK
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {' '}Converter
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Convert your RGB images to high-quality CMYK format for professional printing. 
            Supports JPG, JPEG, and PNG with lossless conversion.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload and Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <ImageUploadZone onFileUpload={handleFileUpload} />
            <ConversionSettings settings={settings} onSettingsChange={setSettings} />
            
            {completedImages.length > 1 && (
              <Button 
                onClick={handleDownloadAll}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All ({completedImages.length})
              </Button>
            )}
          </div>

          {/* Images Panel */}
          <div className="lg:col-span-2">
            {images.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-slate-700/50 rounded-full mb-4">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No images uploaded</h3>
                  <p className="text-slate-400 text-center">
                    Drag and drop your images or click the upload button to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {images.map((image) => (
                  <Card key={image.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-slate-700/50 rounded-lg">
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">
                              {image.originalFile.name}
                            </CardTitle>
                            <p className="text-sm text-slate-400">
                              {(image.originalFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {image.error && (
                            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                              Error
                            </Badge>
                          )}
                          {image.isProcessing && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Processing
                            </Badge>
                          )}
                          {image.convertedUrl && !image.isProcessing && !image.error && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Complete
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveImage(image.id)}
                            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {image.isProcessing && (
                        <div className="space-y-2">
                          <Progress value={image.progress} className="w-full" />
                          <p className="text-sm text-slate-400">
                            Converting to CMYK... {Math.round(image.progress)}%
                          </p>
                        </div>
                      )}
                      
                      {image.error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-red-400 text-sm">{image.error}</p>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent>
                      <ImagePreview 
                        image={image} 
                        onDownload={() => handleDownload(image)} 
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-4 text-slate-400 text-sm">
            <span>✨ Lossless CMYK Conversion</span>
            <span>•</span>
            <span>🖨️ Print-Ready Output</span>
            <span>•</span>
            <span>⚡ Client-Side Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
}