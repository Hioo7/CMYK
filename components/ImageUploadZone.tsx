'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ImageUploadZoneProps {
  onFileUpload: (files: File[]) => void;
}

export function ImageUploadZone({ onFileUpload }: ImageUploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: true
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-blue-400 bg-blue-500/10' 
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
            }
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            <div className={`
              p-4 rounded-full transition-colors duration-200
              ${isDragActive 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-slate-700/50 text-slate-400'
              }
            `}>
              {isDragActive ? (
                <ImageIcon className="w-8 h-8" />
              ) : (
                <Upload className="w-8 h-8" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {isDragActive ? 'Drop images here' : 'Upload Images'}
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Drag and drop your JPG, JPEG, or PNG files here
              </p>
            </div>
            
            <Button 
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Choose Files
            </Button>
            
            <div className="text-xs text-slate-500 space-y-1">
              <p>Supported formats: JPG, JPEG, PNG</p>
              <p>Maximum file size: 50MB per image</p>
              <p>Multiple files supported</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}