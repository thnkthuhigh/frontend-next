'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadImage, validateImageFile, IMAGE_CONFIG } from '@/lib/supabase/storage';
import type { Editor } from '@tiptap/react';

interface ImageUploadProps {
  editor: Editor | null;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

export function ImageUpload({ editor, onUploadComplete, onUploadError }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Upload to Supabase
      const result = await uploadImage(file, {
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      // Insert image into editor
      // Note: setImage requires @tiptap/extension-image to be installed
      // Run: npm install @tiptap/extension-image
      if (editor) {
        editor
          .chain()
          .focus()
          .setImage({ src: result.url, alt: result.fileName })
          .run();
      }

      // Callback
      onUploadComplete?.(result.url);

      // Reset
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.message || 'Failed to upload image';
      setError(errorMessage);
      onUploadError?.(errorMessage);
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleUpload(files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_CONFIG.ALLOWED_TYPES.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-all',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-border hover:border-primary/50',
          isUploading && 'pointer-events-none opacity-60'
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Icon */}
          {isUploading ? (
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
          )}

          {/* Text */}
          {isUploading ? (
            <div className="space-y-1">
              <p className="text-sm font-medium">Uploading...</p>
              <p className="text-xs text-muted-foreground">
                {uploadProgress > 0 ? `${uploadProgress}%` : 'Processing...'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Drop image here or{' '}
                  <button
                    onClick={handleButtonClick}
                    className="text-primary hover:underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: JPG, PNG, GIF, WebP, SVG (max {IMAGE_CONFIG.MAX_FILE_SIZE_MB}MB)
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleButtonClick}
                className="mt-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </>
          )}
        </div>

        {/* Progress bar */}
        {isUploading && uploadProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-lg overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="shrink-0 text-destructive hover:text-destructive/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="mt-3 text-xs text-muted-foreground">
        💡 Tip: You can also paste images directly into the editor (Ctrl+V)
      </div>
    </div>
  );
}
