/**
 * Toast with Undo Action
 * 
 * Componente de toast com ação de desfazer para operações destrutivas
 */

import { toast } from 'sonner';
import { Undo2, Check, X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface ToastWithUndoOptions {
  title: string;
  description?: string;
  duration?: number;
  onUndo: () => void | Promise<void>;
  onConfirm?: () => void;
}

export function toastWithUndo({
  title,
  description,
  duration = 5000,
  onUndo,
  onConfirm,
}: ToastWithUndoOptions) {
  let undone = false;
  
  const toastId = toast(title, {
    description,
    duration,
    icon: <AlertTriangle className="h-4 w-4 text-warning" />,
    action: {
      label: 'Desfazer',
      onClick: async () => {
        if (undone) return;
        undone = true;
        await onUndo();
        toast.success('Ação desfeita!', {
          icon: <Undo2 className="h-4 w-4" />,
          duration: 2000,
        });
      },
    },
    onDismiss: () => {
      if (!undone && onConfirm) {
        onConfirm();
      }
    },
  });

  return toastId;
}

// Toast de sucesso aprimorado
export function toastSuccess(title: string, description?: string) {
  return toast.success(title, {
    description,
    icon: <CheckCircle2 className="h-4 w-4 text-success" />,
    className: 'border-success/20 bg-success/5',
  });
}

// Toast de erro aprimorado  
export function toastError(title: string, description?: string) {
  return toast.error(title, {
    description,
    icon: <X className="h-4 w-4 text-destructive" />,
    className: 'border-destructive/20 bg-destructive/5',
  });
}

// Toast de info
export function toastInfo(title: string, description?: string) {
  return toast.info(title, {
    description,
    icon: <Info className="h-4 w-4 text-secondary" />,
    className: 'border-secondary/20 bg-secondary/5',
  });
}

// Toast de loading com promise
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
}
