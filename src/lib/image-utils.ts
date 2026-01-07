// ============================================
// IMAGE UTILITIES: Otimização e processamento de imagens
// Lazy loading, compression, placeholders
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// TIPOS
// ============================================

interface ImageDimensions {
  width: number;
  height: number;
}

interface OptimizedImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

interface LazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface ImageUploadOptions {
  maxSizeMB?: number;
  acceptedTypes?: string[];
  resize?: OptimizedImageOptions;
}

// ============================================
// CONSTANTES
// ============================================

const DEFAULT_QUALITY = 0.8;
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1080;
const DEFAULT_MAX_SIZE_MB = 5;

const PLACEHOLDER_BLUR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4=';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// ============================================
// FUNÇÕES DE PROCESSAMENTO
// ============================================

/**
 * Carrega uma imagem e retorna suas dimensões
 */
export async function getImageDimensions(src: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = src;
  });
}

/**
 * Converte arquivo para Data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converte Data URL para Blob
 */
export function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Redimensiona uma imagem mantendo proporção
 */
export function calculateAspectRatioDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): ImageDimensions {
  let newWidth = width;
  let newHeight = height;

  if (width > maxWidth) {
    newWidth = maxWidth;
    newHeight = (height * maxWidth) / width;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = (width * maxHeight) / height;
  }

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
}

/**
 * Comprime e otimiza uma imagem
 */
export async function optimizeImage(
  file: File,
  options: OptimizedImageOptions = {}
): Promise<Blob> {
  const {
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
    format = 'jpeg',
    maintainAspectRatio = true,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas não suportado'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      if (maintainAspectRatio) {
        const dims = calculateAspectRatioDimensions(width, height, maxWidth, maxHeight);
        width = dims.width;
        height = dims.height;
      } else {
        width = Math.min(width, maxWidth);
        height = Math.min(height, maxHeight);
      }

      canvas.width = width;
      canvas.height = height;

      // Aplicar suavização
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erro ao criar blob'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem'));

    // Carregar arquivo
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Gera um placeholder blur para imagem
 */
export async function generateBlurPlaceholder(
  file: File,
  size: number = 10
): Promise<string> {
  const blob = await optimizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.5,
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao gerar placeholder'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Gera thumbnail de imagem
 */
export async function generateThumbnail(
  file: File,
  maxSize: number = 150
): Promise<Blob> {
  return optimizeImage(file, {
    maxWidth: maxSize,
    maxHeight: maxSize,
    quality: 0.7,
    maintainAspectRatio: true,
  });
}

/**
 * Valida arquivo de imagem
 */
export function validateImageFile(
  file: File,
  options: ImageUploadOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    acceptedTypes = ACCEPTED_IMAGE_TYPES,
  } = options;

  // Verificar tipo
  if (!acceptedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não suportado. Aceitos: ${acceptedTypes.join(', ')}`,
    };
  }

  // Verificar tamanho
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Rotaciona imagem por ângulo
 */
export async function rotateImage(
  file: File,
  degrees: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas não suportado'));
      return;
    }

    img.onload = () => {
      const radians = (degrees * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));

      canvas.width = img.width * cos + img.height * sin;
      canvas.height = img.width * sin + img.height * cos;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erro ao rotacionar'));
          }
        },
        file.type,
        0.9
      );
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem'));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Corta imagem com coordenadas
 */
export async function cropImage(
  file: File,
  crop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas não suportado'));
      return;
    }

    img.onload = () => {
      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        img,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, crop.width, crop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erro ao cortar'));
          }
        },
        file.type,
        0.9
      );
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem'));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook para lazy loading de imagens
 */
export function useLazyImage(
  src: string,
  options: LazyImageOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    placeholder = PLACEHOLDER_BLUR,
    onLoad,
    onError,
  } = options;

  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;
            
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
              onLoad?.();
            };
            
            img.onerror = () => {
              setIsError(true);
              onError?.(new Error('Erro ao carregar imagem'));
            };

            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, threshold, rootMargin, onLoad, onError]);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isError,
    placeholder,
  };
}

/**
 * Hook para upload de imagem com preview
 */
export function useImageUpload(options: ImageUploadOptions = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizedBlob, setOptimizedBlob] = useState<Blob | null>(null);

  const handleFile = useCallback(async (newFile: File) => {
    setError(null);

    // Validar
    const validation = validateImageFile(newFile, options);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    setFile(newFile);
    setIsUploading(true);

    try {
      // Gerar preview
      const dataUrl = await fileToDataURL(newFile);
      setPreview(dataUrl);

      // Otimizar se configurado
      if (options.resize) {
        const optimized = await optimizeImage(newFile, options.resize);
        setOptimizedBlob(optimized);
      } else {
        setOptimizedBlob(newFile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem');
    } finally {
      setIsUploading(false);
    }
  }, [options]);

  const clear = useCallback(() => {
    setFile(null);
    setPreview(null);
    setOptimizedBlob(null);
    setError(null);
  }, []);

  return {
    file,
    preview,
    optimizedBlob,
    isUploading,
    error,
    handleFile,
    clear,
  };
}

/**
 * Hook para drag and drop de imagens
 */
export function useImageDragDrop(
  onDrop: (files: File[]) => void,
  options: ImageUploadOptions = {}
) {
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar se saiu do elemento
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer?.files || []);
    const imageFiles = files.filter((file) => {
      const validation = validateImageFile(file, options);
      return validation.valid;
    });

    if (imageFiles.length > 0) {
      onDrop(imageFiles);
    }
  }, [onDrop, options]);

  useEffect(() => {
    const element = dropRef.current;
    if (!element) return;

    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    return () => {
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return {
    dropRef,
    isDragging,
  };
}

/**
 * Hook para preload de imagens
 */
export function useImagePreload(urls: string[]) {
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    urls.forEach((url) => {
      if (loaded.has(url) || errors.has(url)) return;

      const img = new Image();
      img.src = url;

      img.onload = () => {
        setLoaded((prev) => new Set(prev).add(url));
      };

      img.onerror = () => {
        setErrors((prev) => new Set(prev).add(url));
      };
    });
  }, [urls, loaded, errors]);

  return {
    loaded,
    errors,
    isAllLoaded: urls.every((url) => loaded.has(url)),
    progress: urls.length > 0 ? loaded.size / urls.length : 1,
  };
}

// ============================================
// EXPORTS
// ============================================

export const imageUtils = {
  getImageDimensions,
  fileToDataURL,
  dataURLToBlob,
  calculateAspectRatioDimensions,
  optimizeImage,
  generateBlurPlaceholder,
  generateThumbnail,
  validateImageFile,
  rotateImage,
  cropImage,
};

export default imageUtils;
