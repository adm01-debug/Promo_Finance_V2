/**
 * Hook para Ações em Massa
 * 
 * @module hooks/useBulkActions
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Valid table names that can be used with Supabase
type ValidTableName = 
  | 'contas_pagar' 
  | 'contas_receber' 
  | 'clientes' 
  | 'fornecedores' 
  | 'boletos'
  | 'notas_fiscais'
  | 'alertas'
  | 'empresas'
  | 'centros_custo';

export interface BulkAction<T> {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  confirm?: {
    title: string;
    description: string;
  };
  handler: (items: T[]) => Promise<void>;
}

interface UseBulkActionsOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  tableName?: ValidTableName;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export interface UseBulkActionsResult<T> {
  // Selection state
  selectedIds: Set<string>;
  selectionCount: number;
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  
  // Selection actions
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggle: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  
  // Execution
  execute: (action: BulkAction<T>) => Promise<void>;
  isExecuting: boolean;
  
  // Default actions
  defaultActions: BulkAction<T>[];
  
  // Aliases for backwards compatibility
  selectedCount: number;
  isProcessing: boolean;
  progress: number;
  isSomeSelected: boolean;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  executeBulkAction: (
    action: (id: string) => Promise<void>,
    options?: { showProgress?: boolean }
  ) => Promise<void>;
}

export function useBulkActions<T extends { id: string }>({
  items,
  getItemId,
  tableName,
  onSuccess,
  onError,
  successMessage = 'Ação executada com sucesso',
  errorMessage = 'Erro ao executar ação',
}: UseBulkActionsOptions<T>): UseBulkActionsResult<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Selection count
  const selectionCount = selectedIds.size;

  // Check if an item is selected
  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    if (items.length === 0) return false;
    return items.every(item => selectedIds.has(getItemId(item)));
  }, [items, selectedIds, getItemId]);

  // Check if some items are selected
  const isSomeSelected = useMemo(() => {
    return selectedIds.size > 0 && !isAllSelected;
  }, [selectedIds.size, isAllSelected]);

  // Select an item
  const select = useCallback((id: string) => {
    setSelectedIds(prev => new Set([...prev, id]));
  }, []);

  // Deselect an item
  const deselect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Toggle selection
  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all items
  const selectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(getItemId)));
    }
  }, [items, getItemId, isAllSelected]);

  // Deselect all items
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Execute a bulk action
  const execute = useCallback(async (action: BulkAction<T>) => {
    const selectedItems = items.filter(item => selectedIds.has(getItemId(item)));
    if (selectedItems.length === 0) return;

    setIsExecuting(true);
    setProgress(0);
    
    try {
      await action.handler(selectedItems);
      setSelectedIds(new Set());
      toast({
        title: successMessage,
        description: `${selectedItems.length} item(s) processado(s)`,
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: errorMessage,
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsExecuting(false);
      setProgress(100);
    }
  }, [items, selectedIds, getItemId, successMessage, errorMessage, onSuccess, onError]);

  // Execute bulk action with progress (backwards compatible)
  const executeBulkAction = useCallback(async (
    action: (id: string) => Promise<void>,
    options?: { showProgress?: boolean }
  ) => {
    const selectedIdsList = Array.from(selectedIds);
    if (selectedIdsList.length === 0) return;

    setIsExecuting(true);
    setProgress(0);
    
    let completed = 0;
    const total = selectedIdsList.length;

    try {
      for (const id of selectedIdsList) {
        await action(id);
        completed++;
        if (options?.showProgress) {
          setProgress(Math.round((completed / total) * 100));
        }
      }
      setSelectedIds(new Set());
      toast({
        title: successMessage,
        description: `${total} item(s) processado(s)`,
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: errorMessage,
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsExecuting(false);
    }
  }, [selectedIds, successMessage, errorMessage, onSuccess, onError]);

  // Default actions
  const defaultActions: BulkAction<T>[] = useMemo(() => {
    if (!tableName) return [];
    
    return [
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        variant: 'destructive' as const,
        confirm: {
          title: 'Confirmar exclusão',
          description: `Deseja excluir ${selectionCount} item(s) selecionado(s)?`,
        },
        handler: async (selectedItems: T[]) => {
          const ids = selectedItems.map(getItemId);
          const { error } = await supabase
            .from(tableName)
            .delete()
            .in('id', ids);
          if (error) throw error;
        },
      },
      {
        id: 'mark-done',
        label: 'Marcar como Concluído',
        icon: CheckCircle,
        variant: 'default' as const,
        handler: async (selectedItems: T[]) => {
          const ids = selectedItems.map(getItemId);
          const { error } = await supabase
            .from(tableName)
            .update({ status: 'pago' as string })
            .in('id', ids);
          if (error) throw error;
        },
      },
    ];
  }, [tableName, selectionCount, getItemId]);

  return {
    // Selection state
    selectedIds,
    selectionCount,
    isSelected,
    isAllSelected,
    
    // Selection actions
    select,
    deselect,
    toggle,
    selectAll,
    deselectAll,
    
    // Execution
    execute,
    isExecuting,
    
    // Default actions
    defaultActions,
    
    // Backwards compatibility aliases
    selectedCount: selectionCount,
    isProcessing: isExecuting,
    progress,
    isSomeSelected,
    toggleSelect: toggle,
    clearSelection: deselectAll,
    executeBulkAction,
  };
}

export default useBulkActions;
