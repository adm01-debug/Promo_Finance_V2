import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  XCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ExportMenu } from '@/components/ui/export-menu';
import { SortableHeader, useSorting } from '@/components/ui/sortable-header';
import { useContasPagar, useContasPagarPaginated, useCentrosCusto } from '@/hooks/useFinancialData';
import { TablePagination } from '@/components/ui/table-pagination';
import { formatCurrency, formatDate, calculateOverdueDays, getRelativeTime } from '@/lib/formatters';
import { contasPagarColumns } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContaPagarForm } from '@/components/contas-pagar/ContaPagarForm';
import { RegistrarPagamentoDialog } from '@/components/contas-pagar/RegistrarPagamentoDialog';
import { supabase } from '@/integrations/supabase/client';
import { useConfiguracaoAprovacao, useCriarSolicitacaoAprovacao } from '@/hooks/useAprovacoes';
import { useAuth } from '@/hooks/useAuth';
import { AdvancedFiltersPopover, AdvancedFilters } from '@/components/ui/advanced-filters';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useTableOptimization } from '@/hooks/useTableOptimization';
import { useBulkActions } from '@/hooks/useBulkActions';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

type StatusPagamento = 'pago' | 'pendente' | 'vencido' | 'parcial' | 'cancelado';
type TipoCobranca = 'boleto' | 'pix' | 'cartao' | 'transferencia' | 'dinheiro';

const statusConfig: Record<StatusPagamento, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pago: { label: 'Pago', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  pendente: { label: 'Pendente', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  vencido: { label: 'Vencido', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  parcial: { label: 'Parcial', color: 'bg-secondary/10 text-secondary border-secondary/20', icon: TrendingUp },
  cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground border-muted', icon: Trash2 },
};

const tipoCobrancaIcons: Record<TipoCobranca, typeof CreditCard> = {
  boleto: Banknote,
  pix: QrCode,
  cartao: CreditCard,
  transferencia: Building2,
  dinheiro: DollarSign,
};

export default function ContasPagar() {
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

  // Server-side paginated query with debounced search
  const { data: paginatedResult, isLoading } = useContasPagarPaginated({
    page: currentPage,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    centroCustoId: centroCustoFilter,
  });

  // Get all data for KPIs (non-paginated)
  const { data: allContas = [] } = useContasPagar();
  const { data: centrosCusto = [] } = useCentrosCusto();
  const { data: configuracao } = useConfiguracaoAprovacao();
  const criarSolicitacaoMutation = useCriarSolicitacaoAprovacao();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const contas = paginatedResult?.data || [];
  const totalCount = paginatedResult?.totalCount || 0;
  const totalPages = paginatedResult?.totalPages || 1;

  // Reset page when filters change
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

  // Abrir modal de confirmação de exclusão
  const handleOpenDeleteDialog = (conta: any) => {
    setDeletingConta(conta);
    setDeleteDialogOpen(true);
  };

  // Handler para excluir conta com undo
  const handleDeleteConta = async () => {
    if (!deletingConta) return;
    
    const contaBackup = { ...deletingConta };
    setDeleteDialogOpen(false);
    setDeletingConta(null);
    
    toastDeleteWithUndo({
      item: contaBackup,
      itemName: `Conta "${contaBackup.descricao}"`,
      onDelete: async () => {
        const { error } = await supabase
          .from('contas_pagar')
          .delete()
          .eq('id', contaBackup.id);
        
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      },
      onRestore: async () => {
        // Não faz nada - a exclusão só ocorre após o timeout
        queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      },
    });
  };

  // Abrir modal de confirmação
  const abrirModalAprovacao = (conta: any) => {
    setContaParaAprovacao(conta);
    setObservacoesAprovacao('');
    setAprovacaoDialogOpen(true);
  };

  // Handler para solicitar aprovação
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
  
  // Buscar solicitações de aprovação com detalhes (histórico completo)
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

  // Buscar nomes dos aprovadores
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

  // Mapa de profiles por id
  const profilesMap = new Map(profiles.map(p => [p.id, p]));

  // Mapa de solicitações por conta (apenas a mais recente para exibição)
  const solicitacoesMap = new Map(
    solicitacoesAprovacao.map(s => [s.conta_pagar_id, s])
  );

  // Histórico de solicitações agrupado por conta
  const historicoAprovacaoPorConta = solicitacoesAprovacao.reduce((acc, s) => {
    if (!acc.has(s.conta_pagar_id)) {
      acc.set(s.conta_pagar_id, []);
    }
    acc.get(s.conta_pagar_id)!.push(s);
    return acc;
  }, new Map<string, typeof solicitacoesAprovacao>());

  // Mapa de status de aprovação por conta (para filtro)
  const aprovacaoStatusMap = new Map(
    solicitacoesAprovacao.filter(s => s.status === 'pendente' || s.status === 'rejeitada').map(s => [s.conta_pagar_id, s.status])
  );

  // KPIs - use allContas for accurate totals
  const totalPagar = allContas.reduce((sum, c) => c.status !== 'pago' && c.status !== 'cancelado' ? sum + c.valor - (c.valor_pago || 0) : sum, 0);
  const totalVencido = allContas.filter(c => c.status === 'vencido').reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);
  const totalPagoMes = allContas.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.valor_pago || 0), 0);
  const venceHoje = allContas.filter(c => {
    const hoje = new Date().toDateString();
    return new Date(c.data_vencimento).toDateString() === hoje && c.status === 'pendente';
  }).length;

  // Verificar se conta requer aprovação
  const requerAprovacao = (valor: number) => {
    if (!configuracao?.ativo) return false;
    return valor >= configuracao.valor_minimo_aprovacao;
  };

  // Contar pendentes de aprovação - use allContas for accurate counts
  const contasPendentesAprovacao = allContas.filter(c => {
    const precisaAprovacao = requerAprovacao(c.valor);
    const temSolicitacaoPendente = aprovacaoStatusMap.get(c.id) === 'pendente';
    const naoAprovado = !c.aprovado_por && precisaAprovacao;
    return (temSolicitacaoPendente || (naoAprovado && !aprovacaoStatusMap.has(c.id))) && c.status !== 'pago' && c.status !== 'cancelado';
  });
  
  const countPendentesAprovacao = contasPendentesAprovacao.length;

  // Contar aprovações urgentes (vence em 3 dias ou menos, incluindo vencidos)
  const aprovacoesUrgentes = contasPendentesAprovacao.filter(c => {
    const dataVenc = new Date(c.data_vencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataVenc.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias <= 3; // Vence em 3 dias ou menos (ou já venceu)
  });
  
  const countAprovacoesUrgentes = aprovacoesUrgentes.length;
  const valorAprovacoesUrgentes = aprovacoesUrgentes.reduce((sum, c) => sum + c.valor, 0);

  // Client-side filtering for advanced filters and approval status (server handles basic filters)
  const filteredContas = contas.filter(c => {
    // Filtro de aprovação
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
    
    // Filtros avançados
    let matchesAdvanced = true;
    
    // Filtro de período de vencimento
    if (advancedFilters.dataVencimentoInicio) {
      const vencimento = new Date(c.data_vencimento);
      matchesAdvanced = matchesAdvanced && vencimento >= advancedFilters.dataVencimentoInicio;
    }
    if (advancedFilters.dataVencimentoFim) {
      const vencimento = new Date(c.data_vencimento);
      matchesAdvanced = matchesAdvanced && vencimento <= advancedFilters.dataVencimentoFim;
    }
    
    // Filtro de faixa de valor
    if (advancedFilters.valorMinimo !== undefined) {
      matchesAdvanced = matchesAdvanced && c.valor >= advancedFilters.valorMinimo;
    }
    if (advancedFilters.valorMaximo !== undefined) {
      matchesAdvanced = matchesAdvanced && c.valor <= advancedFilters.valorMaximo;
    }
    
    // Filtro de tipo de cobrança
    if (advancedFilters.tipoCobranca) {
      matchesAdvanced = matchesAdvanced && c.tipo_cobranca === advancedFilters.tipoCobranca;
    }
    
    return matchesAprovacao && matchesAdvanced;
  });

  // Função para calcular prioridade de aprovação
  const calcularPrioridadeAprovacao = (conta: any) => {
    const precisaAprovacao = requerAprovacao(conta.valor);
    const temSolicitacaoPendente = aprovacaoStatusMap.get(conta.id) === 'pendente';
    const naoAprovado = !conta.aprovado_por && precisaAprovacao;
    const pendente = (temSolicitacaoPendente || (naoAprovado && !aprovacaoStatusMap.has(conta.id))) && conta.status !== 'pago' && conta.status !== 'cancelado';
    
    if (!pendente) return 999; // Sem prioridade de aprovação
    
    const dataVenc = new Date(conta.data_vencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataVenc.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDias; // Quanto menor (ou mais negativo), maior a urgência
  };

  // Ordenar contas
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

  // Optimization hook for large datasets
  const { getRowAnimation } = useTableOptimization(sortedContas.length);

  // Bulk actions
  const {
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
  } = useBulkActions({
    items: sortedContas,
    getItemId: (conta) => conta.id,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contas-pagar'] }),
  });

  // Bulk action handlers
  const handleBulkMarkAsPaid = () => {
    executeBulkAction(async (id) => {
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
    executeBulkAction(async (id) => {
      const { error } = await supabase
        .from('contas_pagar')
        .update({ status: 'cancelado' })
        .eq('id', id);
      if (error) throw error;
    }, { showProgress: true });
  };

  const bulkActions = [
    {
      id: 'mark-paid',
      label: 'Marcar como Pago',
      icon: <CheckCircle2 className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: handleBulkMarkAsPaid,
    },
    {
      id: 'cancel',
      label: 'Cancelar',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: handleBulkCancel,
    },
  ];

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Contas a Pagar</h1>
            <p className="text-muted-foreground mt-1">Controle todas as obrigações financeiras e fornecedores</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportMenu
              data={sortedContas}
              columns={contasPagarColumns}
              filename="contas_pagar"
              title="Relatório de Contas a Pagar"
            />
            <Button 
              size="sm" 
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total a Pagar</p>
                  <p className="text-2xl font-bold font-display mt-1">{formatCurrency(totalPagar)}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center transition-transform group-hover:scale-110">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pago no Mês</p>
                  <p className="text-2xl font-bold font-display mt-1">{formatCurrency(totalPagoMes)}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vencido</p>
                  <p className="text-2xl font-bold font-display mt-1 text-destructive">{formatCurrency(totalVencido)}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center transition-transform group-hover:scale-110">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vence Hoje</p>
                  <p className="text-2xl font-bold font-display mt-1">{venceHoje}</p>
                  <p className="text-xs text-muted-foreground">Contas</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center transition-transform group-hover:scale-110">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "stat-card group cursor-pointer transition-all",
            countAprovacoesUrgentes > 0 && "ring-2 ring-warning/50 animate-pulse"
          )} onClick={() => setAprovacaoFilter('pendente_aprovacao')}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aprovações Urgentes</p>
                  <p className={cn(
                    "text-2xl font-bold font-display mt-1",
                    countAprovacoesUrgentes > 0 ? "text-warning" : ""
                  )}>{countAprovacoesUrgentes}</p>
                  <p className="text-xs text-muted-foreground">
                    {countAprovacoesUrgentes > 0 ? formatCurrency(valorAprovacoesUrgentes) : 'Nenhuma pendente'}
                  </p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  countAprovacoesUrgentes > 0 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                )}>
                  <ShieldAlert className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por fornecedor, descrição..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={centroCustoFilter} onValueChange={handleCentroCustoChange}>
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue placeholder="Centro de Custo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os centros</SelectItem>
                    {centrosCusto.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={aprovacaoFilter} onValueChange={setAprovacaoFilter}>
                  <SelectTrigger className="w-full lg:w-[200px]">
                    <SelectValue placeholder="Aprovação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas aprovações</SelectItem>
                    <SelectItem value="pendente_aprovacao">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-warning" />
                        Pendente de Aprovação {countPendentesAprovacao > 0 && `(${countPendentesAprovacao})`}
                      </div>
                    </SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ordenacao} onValueChange={setOrdenacao}>
                  <SelectTrigger className="w-full lg:w-[200px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prioridade_aprovacao">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-warning" />
                        Prioridade Aprovação
                      </div>
                    </SelectItem>
                    <SelectItem value="vencimento">Vencimento (próximos)</SelectItem>
                    <SelectItem value="vencimento_desc">Vencimento (distantes)</SelectItem>
                    <SelectItem value="valor">Maior valor</SelectItem>
                    <SelectItem value="valor_asc">Menor valor</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
                <AdvancedFiltersPopover
                  filters={advancedFilters}
                  onFiltersChange={setAdvancedFilters}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={isAllSelected}
                          onCheckedChange={selectAll}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead className="w-[250px]">
                        <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-semibold">
                          Fornecedor
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-semibold">
                          Valor
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="gap-1 -ml-3 h-8 font-semibold">
                          Vencimento
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Centro de Custo</TableHead>
                      <TableHead>Aprovação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedContas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                          {contas.length === 0 ? 'Nenhuma conta cadastrada' : 'Nenhuma conta encontrada com os filtros aplicados'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedContas.map((conta, index) => {
                        const status = statusConfig[conta.status as StatusPagamento];
                        const StatusIcon = status?.icon || Clock;
                        const TipoIcon = tipoCobrancaIcons[conta.tipo_cobranca as TipoCobranca] || Banknote;
                        const overdueDays = calculateOverdueDays(new Date(conta.data_vencimento));
                        
                        // Status de aprovação
                        const precisaAprovacao = requerAprovacao(conta.valor);
                        const aprovacaoStatus = aprovacaoStatusMap.get(conta.id);
                        const estaAprovado = !!conta.aprovado_por;
                        const temSolicitacaoPendente = aprovacaoStatus === 'pendente';
                        const foiRejeitado = aprovacaoStatus === 'rejeitada';
                        const aguardandoSolicitacao = precisaAprovacao && !estaAprovado && !aprovacaoStatus && conta.status !== 'pago' && conta.status !== 'cancelado';

                        const RowComponent = getRowAnimation(index).transition ? motion.tr : 'tr';
                        
                        return (
                          <RowComponent
                            key={conta.id}
                            {...(getRowAnimation(index).transition ? getRowAnimation(index) : {})}
                            className={cn(
                              "group hover:bg-muted/50 transition-colors",
                              isSelected(conta.id) && "bg-primary/5"
                            )}
                          >
                            <TableCell>
                              <Checkbox 
                                checked={isSelected(conta.id)}
                                onCheckedChange={() => toggleSelect(conta.id)}
                                aria-label={`Selecionar ${conta.descricao}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-secondary" />
                                </div>
                                <div>
                                  <p className="font-medium">{conta.fornecedor_nome}</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <TipoIcon className="h-3 w-3" />
                                    <span className="capitalize">{conta.tipo_cobranca}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm truncate max-w-[200px]">{conta.descricao}</span>
                              </div>
                              {conta.numero_documento && (
                                <p className="text-xs text-muted-foreground mt-0.5">{conta.numero_documento}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-semibold">{formatCurrency(conta.valor)}</p>
                                {conta.recorrente && (
                                  <Badge variant="outline" className="text-xs mt-1">Recorrente</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{formatDate(new Date(conta.data_vencimento))}</p>
                                  {overdueDays > 0 && conta.status !== 'pago' && (
                                    <p className="text-xs text-destructive font-medium">
                                      {overdueDays} dias em atraso
                                    </p>
                                  )}
                                  {overdueDays < 0 && conta.status !== 'pago' && (
                                    <p className="text-xs text-muted-foreground">
                                      Vence {getRelativeTime(new Date(conta.data_vencimento))}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {(conta.centros_custo as any)?.nome || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const historico = historicoAprovacaoPorConta.get(conta.id) || [];
                                const temHistorico = historico.length > 0;
                                
                                // Calcular dias restantes para vencimento
                                const diasRestantes = -overdueDays; // overdueDays é negativo para datas futuras
                                const vencido = overdueDays > 0;
                                const vendeHoje = overdueDays === 0;
                                const urgente = diasRestantes <= 3 && diasRestantes > 0;
                                const atencao = diasRestantes <= 7 && diasRestantes > 3;
                                
                                const getUrgenciaLabel = () => {
                                  if (vencido) return `${overdueDays}d atrasado`;
                                  if (vendeHoje) return 'Vence hoje!';
                                  if (urgente) return `${diasRestantes}d restante${diasRestantes > 1 ? 's' : ''}`;
                                  if (atencao) return `${diasRestantes}d restantes`;
                                  return null;
                                };
                                
                                const urgenciaLabel = getUrgenciaLabel();
                                const mostrarUrgencia = (temSolicitacaoPendente || aguardandoSolicitacao) && conta.status !== 'pago' && conta.status !== 'cancelado';
                                
                                const getBadgeContent = () => {
                                  if (estaAprovado) {
                                    return (
                                      <Badge variant="outline" className="gap-1 bg-success/10 text-success border-success/20 cursor-pointer">
                                        <ShieldCheck className="h-3 w-3" />
                                        Aprovado
                                      </Badge>
                                    );
                                  }
                                  if (foiRejeitado) {
                                    return (
                                      <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive/20 cursor-pointer">
                                        <ShieldX className="h-3 w-3" />
                                        Rejeitado
                                      </Badge>
                                    );
                                  }
                                  if (temSolicitacaoPendente) {
                                    return (
                                      <div className="flex flex-col items-start gap-1">
                                        <Badge variant="outline" className={cn(
                                          "gap-1 cursor-pointer",
                                          vencido || vendeHoje 
                                            ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse" 
                                            : urgente 
                                              ? "bg-warning/10 text-warning border-warning/20" 
                                              : "bg-warning/10 text-warning border-warning/20"
                                        )}>
                                          <ShieldAlert className="h-3 w-3" />
                                          Pendente
                                        </Badge>
                                        {mostrarUrgencia && urgenciaLabel && (
                                          <span className={cn(
                                            "text-[10px] font-medium flex items-center gap-1",
                                            vencido || vendeHoje ? "text-destructive" : urgente ? "text-warning" : "text-muted-foreground"
                                          )}>
                                            <Clock className="h-3 w-3" />
                                            {urgenciaLabel}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  }
                                  if (aguardandoSolicitacao) {
                                    return (
                                      <div className="flex flex-col items-start gap-1">
                                        <Badge variant="outline" className={cn(
                                          "gap-1 cursor-pointer",
                                          vencido || vendeHoje 
                                            ? "bg-destructive/10 text-destructive border-destructive/20" 
                                            : urgente 
                                              ? "bg-warning/10 text-warning border-warning/20" 
                                              : "bg-muted text-muted-foreground"
                                        )}>
                                          <ShieldAlert className="h-3 w-3" />
                                          Requer Aprovação
                                        </Badge>
                                        {mostrarUrgencia && urgenciaLabel && (
                                          <span className={cn(
                                            "text-[10px] font-medium flex items-center gap-1",
                                            vencido || vendeHoje ? "text-destructive" : urgente ? "text-warning" : "text-muted-foreground"
                                          )}>
                                            <Clock className="h-3 w-3" />
                                            {urgenciaLabel}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  }
                                  return <span className="text-xs text-muted-foreground">-</span>;
                                };

                                const getStatusIcon = (status: string) => {
                                  switch (status) {
                                    case 'aprovada': return <ShieldCheck className="h-4 w-4 text-success" />;
                                    case 'rejeitada': return <ShieldX className="h-4 w-4 text-destructive" />;
                                    case 'pendente': return <ShieldAlert className="h-4 w-4 text-warning" />;
                                    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
                                  }
                                };

                                const getStatusLabel = (status: string) => {
                                  switch (status) {
                                    case 'aprovada': return 'Aprovada';
                                    case 'rejeitada': return 'Rejeitada';
                                    case 'pendente': return 'Pendente';
                                    default: return status;
                                  }
                                };

                                if (!temHistorico && !aguardandoSolicitacao && !estaAprovado) {
                                  return <span className="text-xs text-muted-foreground">-</span>;
                                }

                                return (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded">
                                        {getBadgeContent()}
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0" align="start">
                                      <div className="p-3 border-b">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                          <Clock className="h-4 w-4" />
                                          Histórico de Aprovação
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {temHistorico ? `${historico.length} registro(s)` : 'Nenhum registro'}
                                        </p>
                                      </div>
                                      
                                      <ScrollArea className="max-h-64">
                                        <div className="p-2 space-y-2">
                                          {/* Status atual da conta */}
                                          {estaAprovado && (
                                            <div className="p-2 rounded-lg bg-success/5 border border-success/20">
                                              <div className="flex items-start gap-2">
                                                <ShieldCheck className="h-4 w-4 text-success mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium text-success">Aprovado na Conta</p>
                                                  {conta.aprovado_por && (
                                                    <p className="text-xs text-muted-foreground">
                                                      Por: {profilesMap.get(conta.aprovado_por)?.full_name || profilesMap.get(conta.aprovado_por)?.email || 'Usuário'}
                                                    </p>
                                                  )}
                                                  {conta.aprovado_em && (
                                                    <p className="text-xs text-muted-foreground">
                                                      {formatDate(new Date(conta.aprovado_em))}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Histórico de solicitações */}
                                          {historico.map((item, idx) => {
                                            const solicitante = profilesMap.get(item.solicitado_por);
                                            const aprovador = item.aprovado_por ? profilesMap.get(item.aprovado_por) : null;
                                            
                                            return (
                                              <div key={item.id || idx} className="p-2 rounded-lg bg-muted/30 border">
                                                <div className="flex items-start gap-2">
                                                  {getStatusIcon(item.status)}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                      <p className="text-sm font-medium">{getStatusLabel(item.status)}</p>
                                                    </div>
                                                    
                                                    <p className="text-xs text-muted-foreground">
                                                      Solicitado: {formatDate(new Date(item.solicitado_em))}
                                                    </p>
                                                    
                                                    {solicitante && (
                                                      <p className="text-xs text-muted-foreground">
                                                        Por: {solicitante.full_name || solicitante.email}
                                                      </p>
                                                    )}
                                                    
                                                    {item.aprovado_em && (
                                                      <p className="text-xs text-muted-foreground mt-1">
                                                        {item.status === 'aprovada' ? 'Aprovado' : 'Respondido'}: {formatDate(new Date(item.aprovado_em))}
                                                        {aprovador && ` por ${aprovador.full_name || aprovador.email}`}
                                                      </p>
                                                    )}
                                                    
                                                    {item.observacoes && (
                                                      <p className="text-xs text-muted-foreground mt-1 italic">
                                                        "{item.observacoes}"
                                                      </p>
                                                    )}
                                                    
                                                    {item.motivo_rejeicao && (
                                                      <p className="text-xs text-destructive mt-1">
                                                        Motivo: {item.motivo_rejeicao}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {/* Mensagem se requer aprovação mas não tem histórico */}
                                          {aguardandoSolicitacao && !temHistorico && (
                                            <div className="p-3 text-center text-sm text-muted-foreground">
                                              <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                              <p>Valor acima de {formatCurrency(configuracao?.valor_minimo_aprovacao || 0)}</p>
                                              <p className="text-xs">Requer aprovação antes do pagamento</p>
                                            </div>
                                          )}
                                        </div>
                                      </ScrollArea>
                                    </PopoverContent>
                                  </Popover>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("gap-1", status?.color)}>
                                <StatusIcon className="h-3 w-3" />
                                {status?.label || conta.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2">
                                    <Eye className="h-4 w-4" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="gap-2"
                                    onClick={() => {
                                      setEditingConta(conta);
                                      setFormOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {aguardandoSolicitacao && (
                                    <DropdownMenuItem 
                                      className="gap-2 text-warning"
                                      onClick={() => abrirModalAprovacao(conta)}
                                    >
                                      <ShieldAlert className="h-4 w-4" />
                                      Solicitar Aprovação
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    className="gap-2"
                                    onClick={() => {
                                      setSelectedConta(conta);
                                      setPagamentoDialogOpen(true);
                                    }}
                                    disabled={conta.status === 'pago' || conta.status === 'cancelado' || (aguardandoSolicitacao || temSolicitacaoPendente)}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Registrar Pagamento
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="gap-2 text-destructive"
                                    onClick={() => handleOpenDeleteDialog(conta)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </RowComponent>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalCount}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </Card>
        </motion.div>

        <ContaPagarForm 
          open={formOpen} 
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingConta(null);
          }}
          conta={editingConta}
        />
        <RegistrarPagamentoDialog 
          conta={selectedConta} 
          open={pagamentoDialogOpen} 
          onOpenChange={setPagamentoDialogOpen} 
        />

        {/* Modal de Confirmação de Aprovação */}
        <Dialog open={aprovacaoDialogOpen} onOpenChange={setAprovacaoDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-warning" />
                Solicitar Aprovação
              </DialogTitle>
              <DialogDescription>
                Confirme os detalhes da conta antes de enviar para aprovação.
              </DialogDescription>
            </DialogHeader>
            
            {contaParaAprovacao && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Fornecedor</p>
                      <p className="font-medium">{contaParaAprovacao.fornecedor_nome}</p>
                    </div>
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      Requer Aprovação
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-semibold text-lg">{formatCurrency(contaParaAprovacao.valor)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vencimento</p>
                      <p className="font-medium">{formatDate(new Date(contaParaAprovacao.data_vencimento))}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="text-sm">{contaParaAprovacao.descricao}</p>
                  </div>
                  
                  {contaParaAprovacao.numero_documento && (
                    <div>
                      <p className="text-sm text-muted-foreground">Documento</p>
                      <p className="text-sm">{contaParaAprovacao.numero_documento}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações (opcional)</label>
                  <Input
                    placeholder="Adicione uma justificativa ou observação..."
                    value={observacoesAprovacao}
                    onChange={(e) => setObservacoesAprovacao(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setAprovacaoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmarSolicitacao}
                disabled={criarSolicitacaoMutation.isPending}
                className="gap-2"
              >
                {criarSolicitacaoMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    Confirmar Solicitação
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Confirmar exclusão"
          description={`Tem certeza que deseja excluir a conta "${deletingConta?.descricao}" no valor de ${deletingConta?.valor ? formatCurrency(deletingConta.valor) : ''}? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDeleteConta}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedCount}
          isProcessing={isProcessing}
          progress={progress}
          actions={bulkActions}
          onClear={clearSelection}
        />
      </motion.div>
    </MainLayout>
  );
}
