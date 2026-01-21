import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, X, File, FileText, Image, Archive, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/formatters';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  showPreview?: boolean;
  onUpload?: (files: File[]) => Promise<void>;
}

interface FileWithProgress {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// Get file icon based on mime type
function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="w-8 h-8" />;
  if (type.startsWith('application/pdf')) return <FileText className="w-8 h-8" />;
  if (type.includes('zip') || type.includes('archive')) return <Archive className="w-8 h-8" />;
  return <File className="w-8 h-8" />;
}

export function FileUpload({
  value = [],
  onChange,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  disabled = false,
  className,
  placeholder = 'Arraste arquivos aqui ou clique para selecionar',
  showPreview = true,
  onUpload,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Validate file
  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `${file.name} excede o tamanho máximo de ${formatFileSize(maxSize)}`;
    }
    
    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim());
      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });
      
      if (!isAccepted) {
        return `${file.name} não é um tipo de arquivo aceito`;
      }
    }
    
    return null;
  };

  // Handle files
  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validationErrors: string[] = [];
      const validFiles: FileWithProgress[] = [];

      // Check max files
      const currentCount = files.length + value.length;
      if (currentCount + fileArray.length > maxFiles) {
        validationErrors.push(`Máximo de ${maxFiles} arquivos permitido`);
        return;
      }

      // Validate each file
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          validationErrors.push(error);
        } else {
          validFiles.push({
            file,
            id: generateId(),
            progress: 0,
            status: 'pending',
          });
        }
      }

      setErrors(validationErrors);

      if (validFiles.length === 0) return;

      // Update state
      const newFilesState = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(newFilesState);

      // Call onChange with raw files
      const rawFiles = newFilesState.map((f) => f.file);
      onChange?.(rawFiles);

      // Auto upload if handler provided
      if (onUpload) {
        for (const fileInfo of validFiles) {
          try {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileInfo.id ? { ...f, status: 'uploading', progress: 0 } : f
              )
            );

            // Simulate progress
            const progressInterval = setInterval(() => {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === fileInfo.id && f.progress < 90
                    ? { ...f, progress: f.progress + 10 }
                    : f
                )
              );
            }, 100);

            await onUpload([fileInfo.file]);

            clearInterval(progressInterval);

            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileInfo.id ? { ...f, status: 'success', progress: 100 } : f
              )
            );
          } catch (error) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileInfo.id
                  ? { ...f, status: 'error', error: 'Falha no upload' }
                  : f
              )
            );
          }
        }
      }
    },
    [files, value, multiple, maxFiles, onChange, onUpload, validateFile]
  );

  // Drag handlers
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles) {
      handleFiles(droppedFiles);
    }
  };

  // Input change handler
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      handleFiles(selectedFiles);
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Remove file
  const removeFile = (id: string) => {
    const newFiles = files.filter((f) => f.id !== id);
    setFiles(newFiles);
    onChange?.(newFiles.map((f) => f.file));
  };

  // Clear all
  const clearAll = () => {
    setFiles([]);
    setErrors([]);
    onChange?.([]);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
        />

        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {placeholder}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          {accept && `Formatos: ${accept}`}
          {maxSize && ` • Máx: ${formatFileSize(maxSize)}`}
          {multiple && maxFiles && ` • Até ${maxFiles} arquivos`}
        </p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {showPreview && files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {files.length} arquivo{files.length > 1 ? 's' : ''}
            </span>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Limpar todos
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((fileInfo) => (
              <div
                key={fileInfo.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  fileInfo.status === 'error'
                    ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                )}
              >
                {/* File icon */}
                <div className="text-gray-400">
                  {getFileIcon(fileInfo.file.type)}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {fileInfo.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(fileInfo.file.size)}
                    {fileInfo.error && (
                      <span className="text-red-500 ml-2">{fileInfo.error}</span>
                    )}
                  </p>

                  {/* Progress bar */}
                  {fileInfo.status === 'uploading' && (
                    <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${fileInfo.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Status icon */}
                <div className="flex-shrink-0">
                  {fileInfo.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                  )}
                  {fileInfo.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {fileInfo.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {fileInfo.status === 'pending' && (
                    <button
                      onClick={() => removeFile(fileInfo.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple file input
interface SimpleFileInputProps {
  value?: File | null;
  onChange?: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function SimpleFileInput({
  value,
  onChange,
  accept,
  disabled,
  className,
  placeholder = 'Selecionar arquivo',
}: SimpleFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.files?.[0] || null)}
        className="sr-only"
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <Upload className="w-4 h-4 mr-2" />
        {placeholder}
      </Button>
      
      {value && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="truncate max-w-[200px]">{value.name}</span>
          <button
            type="button"
            onClick={() => {
              onChange?.(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
