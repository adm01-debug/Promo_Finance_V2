import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { useContasPagar, useContasPagarPaginated, useCentrosCusto } from '@/hooks/useFinancialData';
import { useConfiguracaoAprovacao, useCriarSolicitacaoAprovacao } from '@/hooks/useAprovacoes';
import { useAuth } from '@/hooks/useAuth';
import { useTableOptimization } from '@/hooks/useTableOptimization';
import { useBulkActions } from '@/hooks/useBulkActions';
import { useQuickDateFilter } from '@/components/ui/quick-date-filters';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedFilters } from '@/components/ui/advanced-filters';

export function useContasPagarLogic() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [centroCustoFilter, setCentroCustoFilter] = useState<string>('all');
  const [aprovacaoFilter, setAprovacaoFilter] = useState<string>('all');
  const [ordenacao, setOrdenacao] = useState<string>('vencimento');
  const [formOpen, setFormOpen] = useState(false);
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);
  const [aprovacaoDialogOpen, setAprovacaoDialogOpen] = useState(false);
  const [contaParaAprovacao, setContaParaAprovacao] = useState<any>(null);
  const [selectedConta, setSelectedConta] = useState<any>(null);
  const [editingConta, setEditingConta] = useState<any>(null);
  const [observacoesAprovacao, setObservacoesAprovacao] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingConta, setDeletingConta] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { filterType, handleFilterChange, filterByDate } = useQuickDateFilter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Data fetching
  const { data: paginatedResult, isLoading } = useContasPagarPaginated({
    page: currentPage,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    centroCustoId: centroCustoFilter,
  });

  const { data: allContas = [] } = useContasPagar();
  const { data: centrosCusto = [] } = useCentrosCusto();
  const { data: configuracao } = useConfiguracaoAprovacao();
  const criarSolicitacaoMutation = useCriarSolicitacaoAprovacao();

  const contas = paginatedResult?.data || [];
  const totalCount = paginatedResult?.totalCount || 0;
  const totalPages = paginatedResult?.totalPages || 1;

  // Fetch approval requests
  const { data: solicitacoesAprovacao = [] } = useQuery({
    queryKey: ['solicitacoes-aprovacao-detalhes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitacoes_aprovacao')
        .select('id, conta_pagar_id, status, motivo_rejeicao, aprovado_em, aprovado_por, solicitado_em, solicitado_por, observacoes')
        .order('solicitado_em', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-aprovadores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      if (error) throw error;
      return data || [];
    },
  });

  // Maps
  const profilesMap = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);
  const solicitacoesMap = useMemo(() => new Map(solicitacoesAprovacao.map(s => [s.conta_pagar_id, s])), [solicitacoesAprovacao]);
  const aprovacaoStatusMap = useMemo(() => 
    new Map(solicitacoesAprovacao.filter(s => s.status === 'pendente' || s.status === 'rejeitada').map(s => [s.conta_pagar_id, s.status])),
    [solicitacoesAprovacao]
  );
  const historicoAprovacaoPorConta = useMemo(() => 
    solicitacoesAprovacao.reduce((acc, s) => {
      if (!acc.has(s.conta_pagar_id)) {
        acc.set(s.conta_pagar_id, []);
      }
      acc.get(s.conta_pagar_id)!.push(s);
      return acc;
    }, new Map<string, typeof solicitacoesAprovacao>()),
    [solicitacoesAprovacao]
  );

  // KPIs
  const totalPagar = allContas.reduce((sum, c) => c.status !== 'pago' && c.status !== 'cancelado' ? sum + c.valor - (c.valor_pago || 0) : sum, 0);
  const totalVencido = allContas.filter(c => c.status === 'vencido').reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);
  const totalPagoMes = allContas.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.valor_pago || 0), 0);
  const venceHoje = allContas.filter(c => {
    const hoje = new Date().toDateString();
    return new Date(c.data_vencimento).toDateString() === hoje && c.status === 'pendente';
  }).length;

  const requerAprovacao = (valor: number) => {
    if (!configuracao?.ativo) return false;
    return valor >= configuracao.valor_minimo_aprovacao;
  };

  const contasPendentesAprovacao = allContas.filter(c => {
    const precisaAprovacao = requerAprovacao(c.valor);
    const temSolicitacaoPendente = aprovacaoStatusMap.get(c.id) === 'pendente';
    const naoAprovado = !c.aprovado_por && precisaAprovacao;
    return (temSolicitacaoPendente || (naoAprovado && !aprovacaoStatusMap.has(c.id))) && c.status !== 'pago' && c.status !== 'cancelado';
  });

  const countPendentesAprovacao = contasPendentesAprovacao.length;

  const aprovacoesUrgentes = contasPendentesAprovacao.filter(c => {
    const dataVenc = new Date(c.data_vencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataVenc.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias <= 3;
  });

  const countAprovacoesUrgentes = aprovacoesUrgentes.length;
  const valorAprovacoesUrgentes = aprovacoesUrgentes.reduce((sum, c) => sum + c.valor, 0);

  // Filtering
  const filteredContas = filterByDate(contas).filter(c => {
    let matchesAprovacao = true;
    if (aprovacaoFilter === 'pendente_aprovacao') {
      const precisaAprovacao = requerAprovacao(c.valor);
      const temSolicitacaoPendente = aprovacaoStatusMap.get(c.id) === 'pendente';
      const naoAprovado = !c.aprovado_por && precisaAprovacao;
      matchesAprovacao = (temSolicitacaoPendente || (naoAprovado && !aprovacaoStatusMap.has(c.id))) && c.status !== 'pago' && c.status !== 'cancelado';
    } else if (aprovacaoFilter === 'aprovado') {
      matchesAprovacao = !!c.aprovado_por;
    } else if (aprovacaoFilter === 'rejeitado') {
      matchesAprovacao = aprovacaoStatusMap.get(c.id) === 'rejeitada';
    }

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

    return matchesAprovacao && matchesAdvanced;
  });

  // Sorting
  const calcularPrioridadeAprovacao = (conta: any) => {
    const precisaAprovacao = requerAprovacao(conta.valor);
    const temSolicitacaoPendente = aprovacaoStatusMap.get(conta.id) === 'pendente';
    const naoAprovado = !conta.aprovado_por && precisaAprovacao;
    const pendente = (temSolicitacaoPendente || (naoAprovado && !aprovacaoStatusMap.has(conta.id))) && conta.status !== 'pago' && conta.status !== 'cancelado';

    if (!pendente) return 999;

    const dataVenc = new Date(conta.data_vencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataVenc.setHours(0, 0, 0, 0);
    return Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  const sortedContas = [...filteredContas].sort((a, b) => {
    switch (ordenacao) {
      case 'prioridade_aprovacao':
        const prioA = calcularPrioridadeAprovacao(a);
        const prioB = calcularPrioridadeAprovacao(b);
        if (prioA !== prioB) return prioA - prioB;
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      case 'vencimento':
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      case 'vencimento_desc':
        return new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime();
      case 'valor':
        return b.valor - a.valor;
      case 'valor_asc':
        return a.valor - b.valor;
      case 'fornecedor':
        return a.fornecedor_nome.localeCompare(b.fornecedor_nome);
      default:
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
    }
  });

  // Table optimization
  const { getRowAnimation } = useTableOptimization(sortedContas.length);

  // Bulk actions
  const bulkActionsHook = useBulkActions({
    items: sortedContas,
    getItemId: (conta) => conta.id,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contas-pagar'] }),
  });

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCentroCustoChange = (value: string) => {
    setCentroCustoFilter(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleOpenDeleteDialog = (conta: any) => {
    setDeletingConta(conta);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConta = async () => {
    if (!deletingConta) return;

    const contaBackup = { ...deletingConta };
    setDeleteDialogOpen(false);
    setDeletingConta(null);

    toastDeleteWithUndo({
      item: contaBackup,
      itemName: `Conta "${contaBackup.descricao}"`,
      onDelete: async () => {
        const { error } = await supabase.from('contas_pagar').delete().eq('id', contaBackup.id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      },
      onRestore: async () => {
        queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      },
    });
  };

  const abrirModalAprovacao = (conta: any) => {
    setContaParaAprovacao(conta);
    setObservacoesAprovacao('');
    setAprovacaoDialogOpen(true);
  };

  const handleConfirmarSolicitacao = async () => {
    if (!user || !contaParaAprovacao) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      await criarSolicitacaoMutation.mutateAsync({
        contaPagarId: contaParaAprovacao.id,
        observacoes: observacoesAprovacao || undefined,
      });
      toast.success('Solicitação de aprovação enviada com sucesso');
      setAprovacaoDialogOpen(false);
      setContaParaAprovacao(null);
      setObservacoesAprovacao('');
    } catch (error) {
      toast.error('Erro ao solicitar aprovação');
    }
  };

  const handleBulkMarkAsPaid = () => {
    bulkActionsHook.executeBulkAction(async (id) => {
      const { error } = await supabase
        .from('contas_pagar')
        .update({
          status: 'pago',
          data_pagamento: new Date().toISOString().split('T')[0],
          valor_pago: sortedContas.find(c => c.id === id)?.valor || 0
        })
        .eq('id', id);
      if (error) throw error;
    }, { showProgress: true });
  };

  const handleBulkCancel = () => {
    bulkActionsHook.executeBulkAction(async (id) => {
      const { error } = await supabase
        .from('contas_pagar')
        .update({ status: 'cancelado' })
        .eq('id', id);
      if (error) throw error;
    }, { showProgress: true });
  };

  const getApprovalStatus = (conta: any) => {
    const precisaAprovacao = requerAprovacao(conta.valor);
    const aprovacaoStatus = aprovacaoStatusMap.get(conta.id);
    const estaAprovado = !!conta.aprovado_por;
    const temSolicitacaoPendente = aprovacaoStatus === 'pendente';
    const foiRejeitado = aprovacaoStatus === 'rejeitada';
    const aguardandoSolicitacao = precisaAprovacao && !estaAprovado && !aprovacaoStatus && conta.status !== 'pago' && conta.status !== 'cancelado';

    return {
      precisaAprovacao,
      estaAprovado,
      temSolicitacaoPendente,
      foiRejeitado,
      aguardandoSolicitacao,
    };
  };

  return {
    // State
    searchTerm,
    statusFilter,
    centroCustoFilter,
    aprovacaoFilter,
    ordenacao,
    formOpen,
    pagamentoDialogOpen,
    aprovacaoDialogOpen,
    contaParaAprovacao,
    selectedConta,
    editingConta,
    observacoesAprovacao,
    advancedFilters,
    currentPage,
    pageSize,
    deleteDialogOpen,
    deletingConta,
    isDeleting,
    filterType,

    // Data
    sortedContas,
    centrosCusto,
    totalCount,
    totalPages,
    isLoading,
    profilesMap,
    historicoAprovacaoPorConta,

    // KPIs
    totalPagar,
    totalPagoMes,
    totalVencido,
    venceHoje,
    countPendentesAprovacao,
    countAprovacoesUrgentes,
    valorAprovacoesUrgentes,
    valorMinimoAprovacao: configuracao?.valor_minimo_aprovacao || 0,

    // Bulk actions
    ...bulkActionsHook,

    // Handlers
    setFormOpen,
    setPagamentoDialogOpen,
    setAprovacaoDialogOpen,
    setSelectedConta,
    setEditingConta,
    setObservacoesAprovacao,
    setAdvancedFilters,
    setCurrentPage,
    setDeleteDialogOpen,
    setAprovacaoFilter,
    setOrdenacao,
    handleSearchChange,
    handleStatusChange,
    handleCentroCustoChange,
    handlePageSizeChange,
    handleOpenDeleteDialog,
    handleDeleteConta,
    abrirModalAprovacao,
    handleConfirmarSolicitacao,
    handleFilterChange,
    handleBulkMarkAsPaid,
    handleBulkCancel,
    getRowAnimation,
    getApprovalStatus,
    criarSolicitacaoMutation,
  };
}
