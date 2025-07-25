'use client';

import React, { useState } from 'react';
import { Download, Eye, Info, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

interface ImagePreviewProps {
  image: ProcessedImage;
  onDownload: () => void;
}

export function ImagePreview({ image, onDownload }: ImagePreviewProps) {
  const [selectedTab, setSelectedTab] = useState('original');

  if (image.isProcessing || image.error) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
          <TabsTrigger value="original" className="data-[state=active]:bg-slate-600">
            Original (RGB)
          </TabsTrigger>
          <TabsTrigger 
            value="converted" 
            className="data-[state=active]:bg-slate-600"
            disabled={!image.convertedUrl}
          >
            CMYK Converted
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="original" className="mt-4">
          <div className="relative group">
            <img
              src={image.originalUrl}
              alt="Original"
              className="w-full h-64 object-contain bg-slate-900/50 rounded-lg"
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Original Image Preview</DialogTitle>
                </DialogHeader>
                <img
                  src={image.originalUrl}
                  alt="Original"
                  className="w-full max-h-[70vh] object-contain bg-slate-900/50 rounded-lg"
                />
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
        
        <TabsContent value="converted" className="mt-4">
          {image.convertedUrl && (
            <div className="relative group">
              <img
                src={image.convertedUrl}
                alt="CMYK Converted"
                className="w-full h-64 object-contain bg-slate-900/50 rounded-lg"
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">CMYK Converted Image</DialogTitle>
                  </DialogHeader>
                  <img
                    src={image.convertedUrl}
                    alt="CMYK Converted"
                    className="w-full max-h-[70vh] object-contain bg-slate-900/50 rounded-lg"
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Metadata */}
      {image.metadata && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
          <div>
            <p className="text-sm text-slate-400">Dimensions</p>
            <p className="text-white font-medium">
              {image.metadata.width} × {image.metadata.height}px
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Color Space</p>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                {selectedTab === 'original' ? 'RGB' : 'CMYK'}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-400">File Size</p>
            <p className="text-white font-medium">
              {(image.originalFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Format</p>
            <p className="text-white font-medium">
              {selectedTab === 'original' ? image.originalFile.type.split('/')[1].toUpperCase() : 'TIFF'}
            </p>
          </div>
        </div>
      )}

      {/* Download Button */}
      {image.convertedUrl && (
        <Button 
          onClick={onDownload}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Download CMYK Image
        </Button>
      )}
    </div>
  );
}