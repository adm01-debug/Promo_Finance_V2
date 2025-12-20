import { toast } from 'sonner';
import { Undo2 } from 'lucide-react';

interface UndoToastOptions {
  title: string;
  description?: string;
  duration?: number;
  onUndo: () => void | Promise<void>;
  onConfirm?: () => void | Promise<void>;
}

export function toastWithUndo({
  title,
  description,
  duration = 5000,
  onUndo,
  onConfirm,
}: UndoToastOptions) {
  let undoClicked = false;

  const toastId = toast(title, {
    description,
    duration,
    action: {
      label: 'Desfazer',
      onClick: async () => {
        undoClicked = true;
        try {
          await onUndo();
          toast.success('Ação desfeita', { duration: 2000 });
        } catch (error) {
          toast.error('Erro ao desfazer', {
            description: 'Não foi possível desfazer a ação.',
          });
        }
      },
    },
    onDismiss: async () => {
      if (!undoClicked && onConfirm) {
        try {
          await onConfirm();
        } catch (error) {
          console.error('Error on confirm:', error);
        }
      }
    },
  });

  return toastId;
}

// Specific toast for delete operations
export function toastDeleteWithUndo<T>({
  item,
  itemName,
  onDelete,
  onRestore,
}: {
  item: T;
  itemName: string;
  onDelete: () => void | Promise<void>;
  onRestore: (item: T) => void | Promise<void>;
}) {
  return toastWithUndo({
    title: `${itemName} removido`,
    description: 'Clique em "Desfazer" para restaurar.',
    onUndo: () => onRestore(item),
    onConfirm: onDelete,
  });
}

// Toast for bulk operations
export function toastBulkWithUndo({
  count,
  action,
  onUndo,
  onConfirm,
}: {
  count: number;
  action: string;
  onUndo: () => void | Promise<void>;
  onConfirm?: () => void | Promise<void>;
}) {
  return toastWithUndo({
    title: `${count} ${count === 1 ? 'item' : 'itens'} ${action}`,
    description: 'Clique em "Desfazer" para reverter.',
    duration: 6000,
    onUndo,
    onConfirm,
  });
}

// Success toast with optional undo
export function toastSuccessWithUndo({
  title,
  description,
  onUndo,
}: {
  title: string;
  description?: string;
  onUndo?: () => void | Promise<void>;
}) {
  if (onUndo) {
    return toastWithUndo({
      title,
      description,
      onUndo,
    });
  }
  
  return toast.success(title, { description });
}
