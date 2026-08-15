import { useState, useCallback, type ReactNode } from 'react';
import {
  ConfirmationDialog,
  DeleteConfirmationDialog,
  type ConfirmationType,
} from './confirmation-dialog';

interface UseConfirmationOptions {
  title: string;
  message: string | ReactNode;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmationState {
  isOpen: boolean;
  options: UseConfirmationOptions | null;
}

// useConfirmation Hook

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

// useDeleteConfirmation Hook

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
