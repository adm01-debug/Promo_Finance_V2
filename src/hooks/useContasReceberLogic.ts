import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import { useContasReceber, useContasReceberPaginated, useCentrosCusto } from '@/hooks/useFinancialData';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { useSorting } from '@/components/ui/sortable-header';
import { useTableOptimization } from '@/hooks/useTableOptimization';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useQuickDateFilter } from '@/components/ui/quick-date-filters';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { AdvancedFilters } from '@/components/ui/advanced-filters';
import type { Database } from '@/integrations/supabase/types';

type ContaReceberRow = Database['public']['Tables']['contas_receber']['Row'];

interface ClienteData {
  razao_social: string;
  nome_fantasia: string | null;
  score: number | null;
}

// Exported type for use in other components
export interface ContaReceberWithRelations extends ContaReceberRow {
  clientes: ClienteData | null;
  centros_custo?: { nome: string; codigo: string } | null;
  contas_bancarias?: { banco: string } | null;
}

export function useContasReceberLogic() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [centroCustoFilter, setCentroCustoFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [recebimentoDialogOpen, setRecebimentoDialogOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaReceberWithRelations | null>(null);
  const [editingConta, setEditingConta] = useState<ContaReceberWithRelations | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingConta, setDeletingConta] = useState<ContaReceberWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  // Quick date filter hook
  const { filterType, handleFilterChange, filterByDate } = useQuickDateFilter();

  // Server-side paginated query with debounced search
  const { data: paginatedResult, isLoading } = useContasReceberPaginated({
    page: currentPage,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    centroCustoId: centroCustoFilter,
  });

  // Get all data for KPIs (non-paginated)
  const { data: allContas = [] } = useContasReceber();
  const { data: centrosCusto = [] } = useCentrosCusto();

  const contas = paginatedResult?.data || [];
  const totalCount = paginatedResult?.totalCount || 0;
  const totalPages = paginatedResult?.totalPages || 1;

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleCentroCustoChange = useCallback((value: string) => {
    setCentroCustoFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleOpenDeleteDialog = useCallback((conta: ContaReceberWithRelations) => {
    setDeletingConta(conta);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConta = useCallback(async () => {
    if (!deletingConta) return;
    
    const contaBackup = { ...deletingConta };
    setDeleteDialogOpen(false);
    setDeletingConta(null);
    
    toastDeleteWithUndo({
      item: contaBackup,
      itemName: `Conta "${contaBackup.descricao}"`,
      onDelete: async () => {
        const { error } = await supabase
          .from('contas_receber')
          .delete()
          .eq('id', contaBackup.id);
        
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      },
      onRestore: async () => {
        queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      },
    });
  }, [deletingConta, queryClient]);

  // KPIs
  const kpis = useMemo(() => {
    const totalReceber = allContas.reduce((sum, c) => 
      c.status !== 'pago' && c.status !== 'cancelado' ? sum + c.valor - (c.valor_recebido || 0) : sum, 0);
    const totalVencido = allContas.filter(c => c.status === 'vencido')
      .reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
    const totalRecebidoMes = allContas.filter(c => c.status === 'pago')
      .reduce((sum, c) => sum + (c.valor_recebido || 0), 0);
    const taxaInadimplencia = totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0;

    return { totalReceber, totalVencido, totalRecebidoMes, taxaInadimplencia };
  }, [allContas]);

  // Client-side filtering for advanced filters
  const filteredContas = useMemo(() => {
    return filterByDate(contas).filter(c => {
      let matchesAdvanced = true;
      
      if (advancedFilters.dataVencimentoInicio) {
        const vencimento = new Date(c.data_vencimento);
        matchesAdvanced = matchesAdvanced && vencimento >= advancedFilters.dataVencimentoInicio;
      }
      if (advancedFilters.dataVencimentoFim) {
        const vencimento = new Date(c.data_vencimento);
        matchesAdvanced = matchesAdvanced && vencimento <= advancedFilters.dataVencimentoFim;
      }
      if (advancedFilters.valorMinimo !== undefined) {
        matchesAdvanced = matchesAdvanced && c.valor >= advancedFilters.valorMinimo;
      }
      if (advancedFilters.valorMaximo !== undefined) {
        matchesAdvanced = matchesAdvanced && c.valor <= advancedFilters.valorMaximo;
      }
      if (advancedFilters.tipoCobranca) {
        matchesAdvanced = matchesAdvanced && c.tipo_cobranca === advancedFilters.tipoCobranca;
      }
      
      return matchesAdvanced;
    });
  }, [contas, advancedFilters, filterByDate]);

  // Sorting
  const { sortedData: sortedContas, sortKey, sortDirection, handleSort } = useSorting(filteredContas, 'data_vencimento');

  // Table optimization
  const { getRowAnimation } = useTableOptimization(sortedContas.length);

  // Bulk actions
  const bulkActionsHook = useBulkActions({
    items: sortedContas,
    getItemId: (conta) => conta.id,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contas-receber'] }),
  });

  const handleBulkMarkAsReceived = useCallback(() => {
    bulkActionsHook.executeBulkAction(async (id) => {
      const conta = sortedContas.find(c => c.id === id);
      const { error } = await supabase
        .from('contas_receber')
        .update({ 
          status: 'pago', 
          data_recebimento: new Date().toISOString().split('T')[0],
          valor_recebido: conta?.valor || 0
        })
        .eq('id', id);
      if (error) throw error;
    }, { showProgress: true });
  }, [bulkActionsHook, sortedContas]);

  const handleBulkCancel = useCallback(() => {
    bulkActionsHook.executeBulkAction(async (id) => {
      const { error } = await supabase
        .from('contas_receber')
        .update({ status: 'cancelado' })
        .eq('id', id);
      if (error) throw error;
    }, { showProgress: true });
  }, [bulkActionsHook]);

  return {
    // State
    searchTerm,
    statusFilter,
    centroCustoFilter,
    formOpen,
    recebimentoDialogOpen,
    selectedConta,
    editingConta,
    advancedFilters,
    currentPage,
    pageSize,
    deleteDialogOpen,
    deletingConta,
    isDeleting,
    isLoading,
    filterType,

    // Data
    contas,
    sortedContas,
    centrosCusto,
    totalCount,
    totalPages,
    kpis,
    sortKey,
    sortDirection,

    // Handlers
    handleSearchChange,
    handleStatusChange,
    handleCentroCustoChange,
    handlePageSizeChange,
    handleSort,
    handleOpenDeleteDialog,
    handleDeleteConta,
    handleFilterChange,
    handleBulkMarkAsReceived,
    handleBulkCancel,
    setFormOpen,
    setRecebimentoDialogOpen,
    setSelectedConta,
    setEditingConta,
    setAdvancedFilters,
    setCurrentPage,
    setDeleteDialogOpen,

    // Bulk actions
    ...bulkActionsHook,
    getRowAnimation,
  };
}
