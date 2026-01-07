/**
 * Enhanced Toast Notifications System
 * Sistema de notificações toast com múltiplas variantes e funcionalidades
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Loader2,
  Bell,
  Download,
  Upload,
  Trash2,
  RefreshCw
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading' | 'promise';
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
  dismissible?: boolean;
  icon?: ReactNode;
  action?: ToastAction;
  progress?: number;
  onDismiss?: () => void;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  removeToast: (id: string) => void;
  removeAllToasts: () => void;
  position: ToastPosition;
  setPosition: (position: ToastPosition) => void;
}

// ============================================
// CONTEXT & PROVIDER
// ============================================

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
  defaultPosition?: ToastPosition;
  maxToasts?: number;
}

export function ToastProvider({ 
  children, 
  defaultPosition = 'bottom-right',
  maxToasts = 5
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [position, setPosition] = useState<ToastPosition>(defaultPosition);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      ...toast,
      id,
      dismissible: toast.dismissible ?? true,
      duration: toast.variant === 'loading' ? Infinity : (toast.duration ?? 5000),
    };

    setToasts(prev => {
      const updated = [...prev, newToast];
      // Limit number of toasts
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });

    return id;
  }, [maxToasts]);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      toast?.onDismiss?.();
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const removeAllToasts = useCallback(() => {
    toasts.forEach(t => t.onDismiss?.());
    setToasts([]);
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ 
      toasts, 
      addToast, 
      updateToast, 
      removeToast, 
      removeAllToasts,
      position,
      setPosition 
    }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

// ============================================
// TOAST CONTAINER
// ============================================

function ToastContainer() {
  const { toasts, position, removeToast } = useToast();

  const positionClasses: Record<ToastPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  const isTop = position.startsWith('top');

  return (
    <div className={cn('fixed z-[100] flex flex-col gap-2 pointer-events-none', positionClasses[position])}>
      <AnimatePresence mode="sync">
        {(isTop ? toasts : [...toasts].reverse()).map(toast => (
          <ToastItem 
            key={toast.id} 
            toast={toast} 
            onDismiss={() => removeToast(toast.id)}
            fromTop={isTop}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// TOAST ITEM
// ============================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
  fromTop: boolean;
}

function ToastItem({ toast, onDismiss, fromTop }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const icons: Record<ToastVariant, ReactNode> = {
    default: <Bell className="h-5 w-5" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    loading: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
    promise: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
  };

  const variantClasses: Record<ToastVariant, string> = {
    default: 'border-border',
    success: 'border-green-500/30 bg-green-500/5',
    error: 'border-destructive/30 bg-destructive/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    info: 'border-blue-500/30 bg-blue-500/5',
    loading: 'border-primary/30',
    promise: 'border-primary/30',
  };

  // Auto-dismiss timer
  useEffect(() => {
    if (toast.duration === Infinity || isPaused) return;

    const duration = toast.duration || 5000;
    const interval = 50;
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.duration, isPaused, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: fromTop ? -20 : 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', duration: 0.3 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        'pointer-events-auto relative w-[360px] overflow-hidden rounded-lg border bg-background shadow-lg',
        variantClasses[toast.variant]
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          {toast.icon || icons[toast.variant]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{toast.title}</p>
          {toast.description && (
            <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={cn(
                'mt-2 text-sm font-medium underline-offset-4 hover:underline',
                toast.action.variant === 'destructive' ? 'text-destructive' : 'text-primary'
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Dismiss button */}
        {toast.dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {toast.duration !== Infinity && (
        <div className="h-1 bg-muted/50">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            className={cn(
              'h-full transition-all',
              toast.variant === 'success' && 'bg-green-500',
              toast.variant === 'error' && 'bg-destructive',
              toast.variant === 'warning' && 'bg-yellow-500',
              toast.variant === 'info' && 'bg-blue-500',
              (toast.variant === 'default' || toast.variant === 'loading' || toast.variant === 'promise') && 'bg-primary'
            )}
          />
        </div>
      )}

      {/* Custom progress */}
      {toast.progress !== undefined && (
        <div className="h-1 bg-muted/50">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${toast.progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createToastHelpers(addToast: ToastContextValue['addToast'], updateToast: ToastContextValue['updateToast']) {
  return {
    success: (title: string, description?: string) => 
      addToast({ title, description, variant: 'success' }),

    error: (title: string, description?: string) => 
      addToast({ title, description, variant: 'error' }),

    warning: (title: string, description?: string) => 
      addToast({ title, description, variant: 'warning' }),

    info: (title: string, description?: string) => 
      addToast({ title, description, variant: 'info' }),

    loading: (title: string, description?: string) => 
      addToast({ title, description, variant: 'loading', duration: Infinity, dismissible: false }),

    promise: async <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ): Promise<T> => {
      const id = addToast({ 
        title: messages.loading, 
        variant: 'loading', 
        duration: Infinity, 
        dismissible: false 
      });

      try {
        const result = await promise;
        updateToast(id, {
          title: typeof messages.success === 'function' ? messages.success(result) : messages.success,
          variant: 'success',
          duration: 5000,
          dismissible: true,
        });
        return result;
      } catch (error) {
        updateToast(id, {
          title: typeof messages.error === 'function' ? messages.error(error as Error) : messages.error,
          variant: 'error',
          duration: 5000,
          dismissible: true,
        });
        throw error;
      }
    },

    custom: (toast: Omit<Toast, 'id'>) => addToast(toast),
  };
}

// ============================================
// SPECIALIZED TOAST HOOKS
// ============================================

export function useToastHelpers() {
  const { addToast, updateToast } = useToast();
  return createToastHelpers(addToast, updateToast);
}

export function useDownloadToast() {
  const { addToast, updateToast, removeToast } = useToast();

  return useCallback((filename: string, downloadFn: () => Promise<void>) => {
    const id = addToast({
      title: 'Baixando arquivo',
      description: filename,
      variant: 'loading',
      icon: <Download className="h-5 w-5 animate-bounce" />,
      duration: Infinity,
      dismissible: false,
    });

    downloadFn()
      .then(() => {
        updateToast(id, {
          title: 'Download concluído',
          description: filename,
          variant: 'success',
          icon: <Download className="h-5 w-5 text-green-500" />,
          duration: 3000,
          dismissible: true,
        });
      })
      .catch(() => {
        updateToast(id, {
          title: 'Erro no download',
          description: filename,
          variant: 'error',
          icon: <Download className="h-5 w-5 text-destructive" />,
          duration: 5000,
          dismissible: true,
        });
      });

    return id;
  }, [addToast, updateToast]);
}

export function useUploadToast() {
  const { addToast, updateToast } = useToast();

  return useCallback((filename: string) => {
    const id = addToast({
      title: 'Enviando arquivo',
      description: filename,
      variant: 'loading',
      icon: <Upload className="h-5 w-5 animate-bounce" />,
      duration: Infinity,
      dismissible: false,
      progress: 0,
    });

    return {
      updateProgress: (progress: number) => {
        updateToast(id, { progress });
      },
      success: () => {
        updateToast(id, {
          title: 'Upload concluído',
          variant: 'success',
          icon: <Upload className="h-5 w-5 text-green-500" />,
          duration: 3000,
          dismissible: true,
          progress: undefined,
        });
      },
      error: (message?: string) => {
        updateToast(id, {
          title: 'Erro no upload',
          description: message || filename,
          variant: 'error',
          icon: <Upload className="h-5 w-5 text-destructive" />,
          duration: 5000,
          dismissible: true,
          progress: undefined,
        });
      },
    };
  }, [addToast, updateToast]);
}

export function useDeleteToast() {
  const { addToast, updateToast } = useToast();

  return useCallback(async <T,>(
    deleteFn: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
    }
  ) => {
    const id = addToast({
      title: options?.loadingMessage || 'Excluindo...',
      variant: 'loading',
      icon: <Trash2 className="h-5 w-5" />,
      duration: Infinity,
      dismissible: false,
    });

    try {
      const result = await deleteFn();
      updateToast(id, {
        title: options?.successMessage || 'Excluído com sucesso',
        variant: 'success',
        icon: <Trash2 className="h-5 w-5 text-green-500" />,
        duration: 3000,
        dismissible: true,
      });
      return result;
    } catch (error) {
      updateToast(id, {
        title: options?.errorMessage || 'Erro ao excluir',
        variant: 'error',
        icon: <Trash2 className="h-5 w-5 text-destructive" />,
        duration: 5000,
        dismissible: true,
      });
      throw error;
    }
  }, [addToast, updateToast]);
}

export function useSyncToast() {
  const { addToast, updateToast } = useToast();

  return useCallback(async <T,>(
    syncFn: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
    }
  ) => {
    const id = addToast({
      title: options?.loadingMessage || 'Sincronizando...',
      variant: 'loading',
      icon: <RefreshCw className="h-5 w-5 animate-spin" />,
      duration: Infinity,
      dismissible: false,
    });

    try {
      const result = await syncFn();
      updateToast(id, {
        title: options?.successMessage || 'Sincronizado com sucesso',
        variant: 'success',
        icon: <RefreshCw className="h-5 w-5 text-green-500" />,
        duration: 3000,
        dismissible: true,
      });
      return result;
    } catch (error) {
      updateToast(id, {
        title: options?.errorMessage || 'Erro na sincronização',
        variant: 'error',
        icon: <RefreshCw className="h-5 w-5 text-destructive" />,
        duration: 5000,
        dismissible: true,
      });
      throw error;
    }
  }, [addToast, updateToast]);
}
