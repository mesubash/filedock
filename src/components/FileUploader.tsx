import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  selectedFiles: File[];
  onClear: () => void;
  uploadProgress?: number;
  isUploading?: boolean;
  multiple?: boolean;
}

export function FileUploader({
  onFileSelect,
  selectedFiles,
  onClear,
  uploadProgress,
  isUploading,
  multiple = true
}: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    disabled: isUploading
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    if (newFiles.length === 0) {
      onClear();
    } else {
      onFileSelect(newFiles);
    }
  };

  return (
    <div className="space-y-4">
      {selectedFiles.length === 0 ? (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop the {multiple ? 'files' : 'file'} here</p>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                Drag & drop {multiple ? 'files' : 'a file'} here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <Button type="button" variant="secondary">
                Browse Files
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <File className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {!isUploading && (
            <Button
              variant="outline"
              onClick={onClear}
              className="w-full"
            >
              Clear All
            </Button>
          )}
          
          {isUploading && uploadProgress !== undefined && (
            <div className="space-y-2 pt-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Uploading {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
