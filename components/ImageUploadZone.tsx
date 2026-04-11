'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, Image as ImageIcon, FileArchive, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ImageUploadZoneProps {
  onFileUpload: (files: File[]) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function ImageUploadZone({ onFileUpload }: ImageUploadZoneProps) {
  const [rejectedMessage, setRejectedMessage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setRejectedMessage(null);

    if (rejectedFiles.length > 0) {
      const messages = rejectedFiles.map(({ file, errors }) => {
        if (errors.some(e => e.message.toLowerCase().includes('size'))) {
          return `"${file.name}" exceeds 50 MB limit`;
        }
        return `"${file.name}" is not a supported format`;
      });
      setRejectedMessage(messages.join(' · '));
    }

    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png':  ['.png'],
      'application/zip':             ['.zip'],
      'application/x-zip-compressed':['.zip'],
    },
    multiple: true,
    maxSize: MAX_FILE_SIZE,
  });

  return (
    <Card className="bg-gray-900/70 border-gray-700/60 backdrop-blur-sm">
      <CardContent className="p-5">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive
              ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
              : 'border-gray-600 hover:border-cyan-600/70 hover:bg-gray-800/40'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-4">
            {/* Icon cluster */}
            <div className={`
              flex items-center gap-2 p-4 rounded-2xl transition-colors duration-200
              ${isDragActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-400'}
            `}>
              {isDragActive ? (
                <ImageIcon className="w-8 h-8" />
              ) : (
                <>
                  <Upload className="w-7 h-7" />
                  <span className="text-gray-600 font-light">·</span>
                  <FileArchive className="w-7 h-7" />
                </>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-white mb-1">
                {isDragActive ? 'Drop files here' : 'Upload Images or ZIP'}
              </h3>
              <p className="text-gray-400 text-sm">
                Drag & drop your files, or click to browse
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-cyan-700 text-cyan-400 hover:bg-cyan-950 hover:text-cyan-300 bg-transparent"
            >
              Choose Files
            </Button>

            <div className="text-xs text-gray-500 space-y-0.5">
              <p>Formats: JPG · PNG · ZIP (containing images)</p>
              <p>Max 50 MB per file</p>
            </div>
          </div>
        </div>

        {rejectedMessage && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-red-950/50 border border-red-700/40 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-400">{rejectedMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
