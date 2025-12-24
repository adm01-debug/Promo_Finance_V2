import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { toastBulkSuccess } from '@/lib/toast-confetti';

interface BulkActionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  onSuccess?: (ids: string[]) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useBulkActions<T>({
  items,
  getItemId,
  onSuccess,
  successMessage = 'Ação executada com sucesso',
  errorMessage = 'Erro ao executar ação',
}: BulkActionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectAll = useCallback(() => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(getItemId));
    }
  }, [items, selectedIds.length, getItemId]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isSomeSelected = selectedIds.length > 0;
  const selectedCount = selectedIds.length;

  const executeBulkAction = useCallback(async (
    action: (id: string) => Promise<void>,
    options?: { showProgress?: boolean }
  ) => {
    if (selectedIds.length === 0) {
      toast.warning('Nenhum item selecionado');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const total = selectedIds.length;
    let completed = 0;
    let errors = 0;

    // Show initial toast with progress
    const toastId = toast.loading(`Processando ${total} itens...`, {
      description: '0% concluído',
    });

    for (const id of selectedIds) {
      try {
        await action(id);
        completed++;
      } catch (error) {
        errors++;
        console.error(`Error processing item ${id}:`, error);
      }

      const progressPercent = Math.round((completed + errors) / total * 100);
      setProgress(progressPercent);

      if (options?.showProgress) {
        toast.loading(`Processando ${total} itens...`, {
          id: toastId,
          description: `${progressPercent}% concluído`,
        });
      }
    }

    setIsProcessing(false);
    setProgress(0);

    if (errors === 0) {
      // Dismiss loading toast
      toast.dismiss(toastId);
      // Show celebratory toast with confetti
      toastBulkSuccess(completed, 'processados');
      onSuccess?.(selectedIds);
      setSelectedIds([]);
    } else if (completed > 0) {
      toast.warning('Ação parcialmente concluída', {
        id: toastId,
        description: `${completed} sucesso, ${errors} erros`,
      });
      onSuccess?.(selectedIds.slice(0, completed));
      setSelectedIds([]);
    } else {
      toast.error(errorMessage, {
        id: toastId,
        description: `Todos os ${errors} itens falharam`,
      });
    }
  }, [selectedIds, successMessage, errorMessage, onSuccess]);

  return {
    selectedIds,
    selectedCount,
    isProcessing,
    progress,
    isSelected,
    isAllSelected,
    isSomeSelected,
    selectAll,
    toggleSelect,
    clearSelection,
    executeBulkAction,
  };
}
