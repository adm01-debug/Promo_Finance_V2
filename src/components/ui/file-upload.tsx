/**
 * File Upload - Enhanced file upload with drag & drop
 * 
 * Features: drag states, progress, preview, validation feedback
 */

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  CloudUpload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useCallback, useRef } from 'react';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  onFilesChange?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

const fileTypeIcons: Record<string, typeof File> = {
  image: Image,
  document: FileText,
  default: File,
};

function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) return Image;
  if (file.type.includes('pdf') || file.type.includes('document')) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  accept,
  multiple = false,
  maxSize = 10,
  maxFiles = 5,
  onFilesChange,
  onUpload,
  className,
  disabled = false,
  variant = 'default'
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande (máx: ${maxSize}MB)`;
    }
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileType = file.type || '';
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) return fileExt === type.toLowerCase();
        if (type.endsWith('/*')) return fileType.startsWith(type.replace('/*', ''));
        return fileType === type;
      });
      
      if (!isAccepted) return 'Tipo de arquivo não permitido';
    }
    return null;
  }, [accept, maxSize]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    if (!multiple && fileArray.length > 1) {
      fileArray.splice(1);
    }
    
    if (files.length + fileArray.length > maxFiles) {
      return; // Could show error toast here
    }

    const uploadedFiles: UploadedFile[] = fileArray.map(file => {
      const error = validateFile(file);
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: error ? 'error' : 'pending',
        error,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };
    });

    const newFilesList = multiple ? [...files, ...uploadedFiles] : uploadedFiles;
    setFiles(newFilesList);
    onFilesChange?.(newFilesList.filter(f => f.status !== 'error').map(f => f.file));
  }, [files, multiple, maxFiles, validateFile, onFilesChange]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      const newFiles = prev.filter(f => f.id !== id);
      onFilesChange?.(newFiles.filter(f => f.status !== 'error').map(f => f.file));
      return newFiles;
    });
  }, [onFilesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [disabled, addFiles]);

  const handleUpload = async () => {
    if (!onUpload || files.length === 0) return;
    
    setIsUploading(true);
    const validFiles = files.filter(f => f.status === 'pending');
    
    // Simulate upload progress
    for (const file of validFiles) {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading' } : f
      ));
      
      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(r => setTimeout(r, 100));
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ));
      }
      
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'success', progress: 100 } : f
      ));
    }
    
    try {
      await onUpload(validFiles.map(f => f.file));
    } catch (error) {
      // Handle error
    }
    
    setIsUploading(false);
  };

  if (variant === 'minimal') {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-md border border-dashed',
            'text-sm text-muted-foreground hover:text-foreground hover:border-primary',
            'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Upload className="h-4 w-4" />
          <span>Selecionar arquivo</span>
        </motion.button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => e.target.files && addFiles(e.target.files)}
        className="hidden"
        disabled={disabled}
      />
      
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? 'hsl(var(--primary))' : 'hsl(var(--border))'
        }}
        className={cn(
          'relative flex flex-col items-center justify-center gap-4 p-8 rounded-xl',
          'border-2 border-dashed cursor-pointer transition-colors',
          'hover:border-primary/50 hover:bg-muted/30',
          isDragging && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          variant === 'compact' && 'p-4'
        )}
      >
        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="dragging"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <CloudUpload className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="text-primary font-medium">Solte aqui!</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="p-3 rounded-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  Arraste arquivos aqui ou <span className="text-primary">clique para selecionar</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {accept ? `Tipos aceitos: ${accept}` : 'Qualquer tipo de arquivo'} • Máx: {maxSize}MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, index) => {
              const Icon = getFileIcon(file.file);
              
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border bg-card',
                    file.status === 'error' && 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                  )}
                >
                  {/* Preview or icon */}
                  <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    {file.preview ? (
                      <img src={file.preview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    )}
                    
                    {/* Status overlay */}
                    <AnimatePresence>
                      {file.status === 'uploading' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center"
                        >
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        </motion.div>
                      )}
                      {file.status === 'success' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 bg-green-500/80 flex items-center justify-center"
                        >
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.file.size)}</span>
                      {file.error && (
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {file.error}
                        </span>
                      )}
                    </div>
                    
                    {/* Progress bar */}
                    {file.status === 'uploading' && (
                      <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${file.progress}%` }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </motion.button>
                </motion.div>
              );
            })}

            {/* Upload button */}
            {onUpload && files.some(f => f.status === 'pending') && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpload}
                disabled={isUploading}
                className={cn(
                  'w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium',
                  'flex items-center justify-center gap-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Enviar {files.filter(f => f.status === 'pending').length} arquivo(s)
                  </>
                )}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple dropzone for quick integrations
interface DropzoneProps {
  onDrop: (files: File[]) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Dropzone({ onDrop, children, className, disabled }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!disabled && e.dataTransfer.files.length > 0) {
          onDrop(Array.from(e.dataTransfer.files));
        }
      }}
      animate={{
        scale: isDragging ? 1.01 : 1,
      }}
      className={cn(
        'relative transition-colors',
        isDragging && 'ring-2 ring-primary ring-offset-2',
        className
      )}
    >
      {children}
      
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-lg flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-2 text-primary">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >
                <CloudUpload className="h-8 w-8" />
              </motion.div>
              <span className="font-medium">Solte para fazer upload</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
