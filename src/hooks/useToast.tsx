import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastOptions {
  id?: string | number;
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

interface Toast extends ToastOptions {
  id: string | number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, options?: ToastOptions) => string | number;
  success: (message: string, options?: ToastOptions) => string | number;
  error: (message: string, options?: ToastOptions) => string | number;
  warning: (message: string, options?: ToastOptions) => string | number;
  info: (message: string, options?: ToastOptions) => string | number;
  loading: (message: string, options?: ToastOptions) => string | number;
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => Promise<T>;
  dismiss: (id?: string | number) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, options?: ToastOptions): string | number => {
    const id = options?.id ?? Date.now();
    
    const newToast: Toast = {
      id,
      type,
      message,
      ...options,
    };

    setToasts((prev) => [...prev, newToast]);

    // Use sonner for actual toast display
    switch (type) {
      case 'success':
        sonnerToast.success(message, {
          id,
          description: options?.description,
          duration: options?.duration,
          action: options?.action,
          cancel: options?.cancel,
          onDismiss: options?.onDismiss,
          onAutoClose: options?.onAutoClose,
        });
        break;
      case 'error':
        sonnerToast.error(message, {
          id,
          description: options?.description,
          duration: options?.duration ?? 5000,
          action: options?.action,
          cancel: options?.cancel,
          onDismiss: options?.onDismiss,
          onAutoClose: options?.onAutoClose,
        });
        break;
      case 'warning':
        sonnerToast.warning(message, {
          id,
          description: options?.description,
          duration: options?.duration,
          action: options?.action,
          cancel: options?.cancel,
          onDismiss: options?.onDismiss,
          onAutoClose: options?.onAutoClose,
        });
        break;
      case 'info':
        sonnerToast.info(message, {
          id,
          description: options?.description,
          duration: options?.duration,
          action: options?.action,
          cancel: options?.cancel,
          onDismiss: options?.onDismiss,
          onAutoClose: options?.onAutoClose,
        });
        break;
      case 'loading':
        sonnerToast.loading(message, {
          id,
          description: options?.description,
        });
        break;
      default:
        sonnerToast(message, {
          id,
          description: options?.description,
          duration: options?.duration,
        });
    }

    return id;
  }, []);

  const toast = useCallback((message: string, options?: ToastOptions) => {
    return addToast('info', message, options);
  }, [addToast]);

  const success = useCallback((message: string, options?: ToastOptions) => {
    return addToast('success', message, options);
  }, [addToast]);

  const error = useCallback((message: string, options?: ToastOptions) => {
    return addToast('error', message, options);
  }, [addToast]);

  const warning = useCallback((message: string, options?: ToastOptions) => {
    return addToast('warning', message, options);
  }, [addToast]);

  const info = useCallback((message: string, options?: ToastOptions) => {
    return addToast('info', message, options);
  }, [addToast]);

  const loading = useCallback((message: string, options?: ToastOptions) => {
    return addToast('loading', message, options);
  }, [addToast]);

  const promise = useCallback(async <T,>(
    promiseOrFn: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ): Promise<T> => {
    return sonnerToast.promise(promiseOrFn, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    });
  }, []);

  const dismiss = useCallback((id?: string | number) => {
    if (id) {
      sonnerToast.dismiss(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  const dismissAll = useCallback(() => {
    sonnerToast.dismiss();
    setToasts([]);
  }, []);

  const value: ToastContextValue = {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <SonnerToaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        theme="system"
        toastOptions={{
          className: 'toast-custom',
          duration: 4000,
        }}
      />
    </ToastContext.Provider>
  );
}

// Hook
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Standalone functions (using sonner directly)
export const toastStandalone = {
  show: (message: string, options?: ToastOptions) => {
    return sonnerToast(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
    });
  },
  
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
    });
  },
  
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
      action: options?.action,
      cancel: options?.cancel,
    });
  },
  
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
    });
  },
  
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
    });
  },
  
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },
  
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, options);
  },
  
  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },
  
  dismissAll: () => {
    sonnerToast.dismiss();
  },
};

export { SonnerToaster as Toaster };
export default useToast;
