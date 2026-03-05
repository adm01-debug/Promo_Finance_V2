import { useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Trash2,
  CheckCircle,
  Info,
  HelpCircle,
  X,
} from 'lucide-react';
import { Button } from './button';

// ============================================================================
// Types
// ============================================================================

type ConfirmationType = 'danger' | 'warning' | 'success' | 'info' | 'question';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string | ReactNode;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  icon?: ReactNode;
  className?: string;
}

interface UseConfirmationOptions {
  title: string;
  message: string | ReactNode;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

// ============================================================================
// Icon and style configurations
// ============================================================================

const typeConfig: Record<
  ConfirmationType,
  {
    icon: typeof AlertTriangle;
    iconBg: string;
    iconColor: string;
    confirmVariant: 'danger' | 'primary' | 'secondary';
  }
> = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    confirmVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    confirmVariant: 'warning' as const,
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    confirmVariant: 'default' as const,
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    confirmVariant: 'default' as const,
  },
  question: {
    icon: HelpCircle,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    confirmVariant: 'default' as const,
  },
};

// ============================================================================
// Confirmation Dialog Component
// ============================================================================

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'question',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  icon,
  className,
}: ConfirmationDialogProps) {
  const [loading, setLoading] = useState(false);
  const config = typeConfig[type];
  const Icon = config.icon;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isProcessing = loading || isLoading;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={!isProcessing ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
          'w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className={cn(
            'absolute top-4 right-4 text-gray-400 hover:text-gray-600',
            'dark:hover:text-gray-300 transition-colors',
            isProcessing && 'opacity-50 cursor-not-allowed'
          )}
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-full',
              config.iconBg
            )}
          >
            {icon || <Icon className={cn('h-6 w-6', config.iconColor)} />}
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h3
            id="confirmation-title"
            className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
          >
            {title}
          </h3>
          <div
            id="confirmation-message"
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {message}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Processando...' : confirmText}
          </Button>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Delete Confirmation Dialog
// ============================================================================

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isLoading,
}: DeleteConfirmationDialogProps) {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      type="danger"
      title="Confirmar exclusão"
      message={
        itemName
          ? `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`
          : 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.'
      }
      confirmText="Excluir"
      cancelText="Cancelar"
      isLoading={isLoading}
    />
  );
}

// ============================================================================
// useConfirmation Hook
// ============================================================================

interface ConfirmationState {
  isOpen: boolean;
  options: UseConfirmationOptions | null;
}

export function useConfirmation() {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    options: null,
  });

  const confirm = useCallback((options: UseConfirmationOptions) => {
    setState({ isOpen: true, options });
  }, []);

  const close = useCallback(() => {
    if (state.options?.onCancel) {
      state.options.onCancel();
    }
    setState({ isOpen: false, options: null });
  }, [state.options]);

  const handleConfirm = useCallback(async () => {
    if (state.options?.onConfirm) {
      await state.options.onConfirm();
    }
  }, [state.options]);

  const ConfirmationDialogComponent = useCallback(() => {
    if (!state.options) return null;

    return (
      <ConfirmationDialog
        isOpen={state.isOpen}
        onClose={close}
        onConfirm={handleConfirm}
        title={state.options.title}
        message={state.options.message}
        type={state.options.type}
        confirmText={state.options.confirmText}
        cancelText={state.options.cancelText}
      />
    );
  }, [state.isOpen, state.options, close, handleConfirm]);

  return {
    confirm,
    close,
    isOpen: state.isOpen,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
}

// ============================================================================
// useDeleteConfirmation Hook
// ============================================================================

export function useDeleteConfirmation(onDelete: () => void | Promise<void>) {
  const [isOpen, setIsOpen] = useState(false);
  const [itemName, setItemName] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const openDialog = useCallback((name?: string) => {
    setItemName(name);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setItemName(undefined);
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      setIsLoading(true);
      await onDelete();
      closeDialog();
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onDelete, closeDialog]);

  const DeleteDialog = useCallback(
    () => (
      <DeleteConfirmationDialog
        isOpen={isOpen}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        itemName={itemName}
        isLoading={isLoading}
      />
    ),
    [isOpen, closeDialog, handleConfirm, itemName, isLoading]
  );

  return {
    openDeleteDialog: openDialog,
    closeDeleteDialog: closeDialog,
    DeleteConfirmationDialog: DeleteDialog,
    isDeleting: isLoading,
  };
}
