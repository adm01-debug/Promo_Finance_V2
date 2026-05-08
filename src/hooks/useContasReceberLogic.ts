import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import { useContasReceber, useContasReceberPaginated, useCentrosCusto, useEmpresas } from '@/hooks/useFinancialData';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { useSorting } from '@/components/ui/sortable-header';
import { useTableOptimization } from '@/hooks/useTableOptimization';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useQuickDateFilter } from '@/components/ui/quick-date-filters';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { AdvancedFilters } from '@/components/ui/advanced-filters';
import type { Database } from '@/integrations/supabase/types';
import type { ContaReceberWithRelations } from '@/components/contas-receber/ContasReceberTableRow';

export function useContasReceberLogic() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [centroCustoFilter, setCentroCustoFilter] = useState<string>('all');
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [formaFilter, setFormaFilter] = useState<string>('all');
  const [contaBancariaFilter, setContaBancariaFilter] = useState<string>('all');
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
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailConta, setDetailConta] = useState<ContaReceberWithRelations | null>(null);
  const [cobrancaDialogOpen, setCobrancaDialogOpen] = useState(false);
  const [cobrancaConta, setCobrancaConta] = useState<ContaReceberWithRelations | null>(null);
  const [descontoDialogOpen, setDescontoDialogOpen] = useState(false);
  const [descontoConta, setDescontoConta] = useState<ContaReceberWithRelations | null>(null);
  const queryClient = useQueryClient();


  const { filterType, handleFilterChange, filterByDate } = useQuickDateFilter();

  const { data: paginatedResult, isLoading } = useContasReceberPaginated({
    page: currentPage,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    centroCustoId: centroCustoFilter,
  });

  const { data: allContas = [] } = useContasReceber();
  const { data: centrosCusto = [] } = useCentrosCusto();
  const { data: empresas = [] } = useEmpresas();
  const { data: contasBancarias = [] } = useContasBancarias();


  const contas = paginatedResult?.data || [];
  const totalCount = paginatedResult?.totalCount || 0;
  const totalPages = paginatedResult?.totalPages || 1;

  // Handlers
  const handleSearchChange = useCallback((value: string) => { setSearchTerm(value); setCurrentPage(1); }, []);
  const handleStatusChange = useCallback((value: string) => { setStatusFilter(value); setCurrentPage(1); }, []);
  const handleCentroCustoChange = useCallback((value: string) => { setCentroCustoFilter(value); setCurrentPage(1); }, []);
  const handleEmpresaChange = useCallback((value: string) => { setEmpresaFilter(value); setCurrentPage(1); }, []);
  const handleFormaChange = useCallback((value: string) => { setFormaFilter(value); setCurrentPage(1); }, []);
  const handleContaBancariaChange = useCallback((value: string) => { setContaBancariaFilter(value); setCurrentPage(1); }, []);
  const handlePageSizeChange = useCallback((size: number) => { setPageSize(size); setCurrentPage(1); }, []);


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
        const { error } = await supabase.from('contas_receber').delete().eq('id', contaBackup.id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      },
      onRestore: async () => { queryClient.invalidateQueries({ queryKey: ['contas-receber'] }); },
    });
  }, [deletingConta, queryClient]);

  // View/Detail drawer
  const handleViewConta = useCallback((conta: ContaReceberWithRelations) => {
    setDetailConta(conta);
    setDetailDrawerOpen(true);
  }, []);

  // Enviar cobrança
  const handleEnviarCobranca = useCallback((conta: ContaReceberWithRelations) => {
    setCobrancaConta(conta);
    setCobrancaDialogOpen(true);
  }, []);

  // Aplicar desconto (#12)
  const handleAplicarDesconto = useCallback((conta: ContaReceberWithRelations) => {
    setDescontoConta(conta);
    setDescontoDialogOpen(true);
  }, []);

  // KPI drill-down (#28)
  const handleKpiClick = useCallback((filter: string) => {
    if (filter === 'all') {
      setStatusFilter('all');
    } else if (filter === 'vence_hoje') {
      setStatusFilter('pendente');
      handleFilterChange('today', null);
    } else if (filter === 'vence_semana') {
      setStatusFilter('pendente');
      handleFilterChange('week', null);
    } else {
      setStatusFilter(filter);
    }
    setCurrentPage(1);
  }, [handleFilterChange]);

  // KPIs with temporal comparison (#4, #5)
  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    const totalReceber = allContas.reduce((sum, c) => 
      c.status !== 'pago' && c.status !== 'cancelado' ? sum + c.valor - (c.valor_recebido || 0) : sum, 0);
    const totalVencido = allContas.filter(c => c.status === 'vencido')
      .reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
    const totalRecebidoMes = allContas.filter(c => c.status === 'pago')
      .reduce((sum, c) => sum + (c.valor_recebido || 0), 0);
    const taxaInadimplencia = totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0;

    // Vence Hoje (#5)
    const venceHoje = allContas.filter(c => {
      if (c.status === 'pago' || c.status === 'cancelado') return false;
      const venc = new Date(c.data_vencimento);
      venc.setHours(0, 0, 0, 0);
      return venc.getTime() === today.getTime();
    }).length;

    // Vence esta semana (#5)
    const venceSemana = allContas.filter(c => {
      if (c.status === 'pago' || c.status === 'cancelado') return false;
      const venc = new Date(c.data_vencimento);
      venc.setHours(0, 0, 0, 0);
      return venc >= today && venc <= endOfWeek;
    }).length;

    return { totalReceber, totalVencido, totalRecebidoMes, taxaInadimplencia, venceHoje, venceSemana };
  }, [allContas]);

  // Client-side filtering
  const filteredContas = useMemo(() => {
    return filterByDate(contas).filter(c => {
      let match = true;
      if (advancedFilters.dataVencimentoInicio) {
        match = match && new Date(c.data_vencimento) >= advancedFilters.dataVencimentoInicio;
      }
      if (advancedFilters.dataVencimentoFim) {
        match = match && new Date(c.data_vencimento) <= advancedFilters.dataVencimentoFim;
      }
      if (advancedFilters.valorMinimo !== undefined) {
        match = match && c.valor >= advancedFilters.valorMinimo;
      }
      if (advancedFilters.valorMaximo !== undefined) {
        match = match && c.valor <= advancedFilters.valorMaximo;
      }
      if (advancedFilters.tipoCobranca) {
        match = match && c.tipo_cobranca === advancedFilters.tipoCobranca;
      }
      // Empresa filter (#3)
      if (empresaFilter !== 'all') {
        match = match && c.empresa_id === empresaFilter;
      }
      // Forma de pagamento filter (#32)
      if (formaFilter !== 'all') {
        match = match && c.tipo_cobranca === formaFilter;
      }
      return match;
    });
  }, [contas, advancedFilters, filterByDate, empresaFilter, formaFilter]);

  const { sortedData: sortedContas, sortKey, sortDirection, handleSort } = useSorting(filteredContas, 'data_vencimento');
  const { getRowAnimation } = useTableOptimization(sortedContas.length);

  const bulkActionsHook = useBulkActions({
    items: sortedContas,
    getItemId: (conta) => conta.id,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contas-receber'] }),
  });

  const handleBulkMarkAsReceived = useCallback(() => {
    bulkActionsHook.executeBulkAction(async (id) => {
      const conta = sortedContas.find(c => c.id === id);
      const { error } = await supabase.from('contas_receber').update({
        status: 'pago',
        data_recebimento: new Date().toISOString().split('T')[0],
        valor_recebido: conta?.valor || 0,
      }).eq('id', id);
      if (error) throw error;
    }, { showProgress: true });
  }, [bulkActionsHook, sortedContas]);

  const handleBulkCancel = useCallback(() => {
    bulkActionsHook.executeBulkAction(async (id) => {
      const { error } = await supabase.from('contas_receber').update({ status: 'cancelado' }).eq('id', id);
      if (error) throw error;
    }, { showProgress: true });
  }, [bulkActionsHook]);

  return {
    searchTerm, statusFilter, centroCustoFilter, empresaFilter, formaFilter,
    contaBancariaFilter, handleContaBancariaChange,
    formOpen, recebimentoDialogOpen, selectedConta, editingConta, advancedFilters,
    currentPage, pageSize, deleteDialogOpen, deletingConta, isDeleting, isLoading, filterType,
    viewMode, detailDrawerOpen, detailConta, cobrancaDialogOpen, cobrancaConta,
    descontoDialogOpen, descontoConta,
    contas, sortedContas, centrosCusto, empresas, contasBancarias, totalCount, totalPages, kpis, sortKey, sortDirection,
    handleSearchChange, handleStatusChange, handleCentroCustoChange, handleEmpresaChange,
    handleFormaChange, handlePageSizeChange, handleSort, handleOpenDeleteDialog, handleDeleteConta,
    handleFilterChange, handleBulkMarkAsReceived, handleBulkCancel, handleViewConta,
    handleEnviarCobranca, handleKpiClick, handleAplicarDesconto,
    setFormOpen, setRecebimentoDialogOpen, setSelectedConta, setEditingConta,
    setAdvancedFilters, setCurrentPage, setDeleteDialogOpen, setViewMode,
    setDetailDrawerOpen, setCobrancaDialogOpen, setDescontoDialogOpen,
    ...bulkActionsHook, getRowAnimation,
  };
}

