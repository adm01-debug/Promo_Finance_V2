import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import { EmptyState } from '@/components/ui/micro-interactions';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { InteractivePageWrapper, PrimaryActionButton, useCelebrations, SwipeableTableRow } from '@/components/wrappers';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  Loader2,
  Inbox,
  XCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Progress } from '@/components/ui/progress';
import { ExportMenu } from '@/components/ui/export-menu';
import { SortableHeader, useSorting } from '@/components/ui/sortable-header';
import { useContasReceber, useContasReceberPaginated } from '@/hooks/useFinancialData';
import { formatCurrency, formatDate, calculateOverdueDays, getRelativeTime } from '@/lib/formatters';
import { TablePagination } from '@/components/ui/table-pagination';
import { contasReceberColumns } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContaReceberForm } from '@/components/contas-receber/ContaReceberForm';
import { RegistrarRecebimentoDialog } from '@/components/contas-receber/RegistrarRecebimentoDialog';
import { AdvancedFiltersPopover, AdvancedFilters } from '@/components/ui/advanced-filters';
import { useCentrosCusto } from '@/hooks/useFinancialData';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useTableOptimization } from '@/hooks/useTableOptimization';
import { useBulkActions } from '@/hooks/useBulkActions';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { QuickDateFilters, useQuickDateFilter } from '@/components/ui/quick-date-filters';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

type StatusPagamento = 'pago' | 'pendente' | 'vencido' | 'parcial' | 'cancelado';

const statusConfig: Record<StatusPagamento, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pago: { label: 'Pago', color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  pendente: { label: 'Pendente', color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  vencido: { label: 'Vencido', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  parcial: { label: 'Parcial', color: 'bg-secondary/10 text-secondary border-secondary/20', icon: TrendingUp },
  cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground border-muted', icon: Trash2 },
};

const getScoreColor = (score: number) => {
  if (score >= 800) return 'text-success';
  if (score >= 600) return 'text-warning';
  if (score >= 400) return 'text-orange-500';
  return 'text-destructive';
};

const getScoreLabel = (score: number) => {
  if (score >= 800) return 'Excelente';
  if (score >= 600) return 'Bom';
  if (score >= 400) return 'Regular';
  return 'Crítico';
};

export default function ContasReceber() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [centroCustoFilter, setCentroCustoFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [recebimentoDialogOpen, setRecebimentoDialogOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<any>(null);
  const [editingConta, setEditingConta] = useState<any>(null);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingConta, setDeletingConta] = useState<any>(null);
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

  // Handler para exclusão
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
  };

  // KPIs - use allContas for accurate totals
  const totalReceber = allContas.reduce((sum, c) => c.status !== 'pago' && c.status !== 'cancelado' ? sum + c.valor - (c.valor_recebido || 0) : sum, 0);
  const totalVencido = allContas.filter(c => c.status === 'vencido').reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
  const totalRecebidoMes = allContas.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.valor_recebido || 0), 0);
  const taxaInadimplencia = totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0;

  // Client-side filtering for advanced filters only (server handles basic filters)
  const filteredContas = filterByDate(contas).filter(c => {
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
    
    return matchesAdvanced;
  });

  // Use sorting hook
  const { sortedData: sortedContas, sortKey, sortDirection, handleSort } = useSorting(filteredContas, 'data_vencimento');

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contas-receber'] }),
  });

  // Bulk action handlers
  const handleBulkMarkAsReceived = () => {
    executeBulkAction(async (id) => {
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
  };

  const handleBulkCancel = () => {
    executeBulkAction(async (id) => {
      const { error } = await supabase
        .from('contas_receber')
        .update({ status: 'cancelado' })
        .eq('id', id);
      if (error) throw error;
    }, { showProgress: true });
  };

  const bulkActions = [
    {
      id: 'mark-received',
      label: 'Marcar como Recebido',
      icon: <CheckCircle2 className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: handleBulkMarkAsReceived,
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
            <h1 className="text-display-md text-foreground">Contas a Receber</h1>
            <p className="text-muted-foreground mt-1">Gerencie todos os títulos a receber e acompanhe a inadimplência</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportMenu
              data={sortedContas}
              columns={contasReceberColumns}
              filename="contas_receber"
              title="Relatório de Contas a Receber"
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
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total a Receber</p>
                  <p className="text-2xl font-bold font-display mt-1">{formatCurrency(totalReceber)}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recebido no Mês</p>
                  <p className="text-2xl font-bold font-display mt-1">{formatCurrency(totalRecebidoMes)}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Inadimplência</p>
                  <p className="text-2xl font-bold font-display mt-1">{taxaInadimplencia.toFixed(1)}%</p>
                  <div className="mt-2">
                    <Progress value={taxaInadimplencia} className="h-2" />
                  </div>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  taxaInadimplencia > 10 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                )}>
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Date Filters */}
        <motion.div variants={itemVariants}>
          <QuickDateFilters
            value={filterType}
            onChange={handleFilterChange}
            showOverdue
          />
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente, descrição..."
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
              <TableShimmerSkeleton rows={pageSize} columns={7} showCheckbox showAvatar />
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
                        <SortableHeader
                          label="Cliente"
                          sortKey="cliente_nome"
                          currentSort={sortKey}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Valor"
                          sortKey="valor"
                          currentSort={sortKey}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Vencimento"
                          sortKey="data_vencimento"
                          currentSort={sortKey}
                          currentDirection={sortDirection}
                          onSort={handleSort}
                        />
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedContas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0">
                          <EmptyState 
                            icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
                            title={contas.length === 0 ? 'Nenhuma conta cadastrada' : 'Nenhuma conta encontrada'}
                            description={contas.length === 0 ? 'Comece adicionando sua primeira conta a receber' : 'Tente ajustar os filtros de busca'}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedContas.map((conta, index) => {
                        const status = statusConfig[conta.status as StatusPagamento];
                        const StatusIcon = status?.icon || Clock;
                        const overdueDays = calculateOverdueDays(new Date(conta.data_vencimento));
                        const saldo = conta.valor - (conta.valor_recebido || 0);
                        const percentualRecebido = conta.valor_recebido ? (conta.valor_recebido / conta.valor) * 100 : 0;
                        const clienteData = conta.clientes as any;

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
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{conta.cliente_nome}</p>
                                  <p className="text-xs text-muted-foreground">{clienteData?.nome_fantasia || '-'}</p>
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
                                {conta.valor_recebido && conta.valor_recebido > 0 && (
                                  <div className="mt-1">
                                    <Progress value={percentualRecebido} className="h-1.5 w-20" />
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Saldo: {formatCurrency(saldo)}
                                    </p>
                                  </div>
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
                              <Badge variant="outline" className={cn("gap-1", status?.color)}>
                                <StatusIcon className="h-3 w-3" />
                                {status?.label || conta.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {clienteData?.score && (
                                <div className="flex items-center gap-2">
                                  <div className={cn("font-bold", getScoreColor(clienteData.score))}>
                                    {clienteData.score}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {getScoreLabel(clienteData.score)}
                                  </span>
                                </div>
                              )}
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
                                  <DropdownMenuItem className="gap-2">
                                    <Send className="h-4 w-4" />
                                    Enviar Cobrança
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="gap-2"
                                    onClick={() => {
                                      setSelectedConta(conta);
                                      setRecebimentoDialogOpen(true);
                                    }}
                                    disabled={conta.status === 'pago' || conta.status === 'cancelado'}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Registrar Recebimento
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

        <ContaReceberForm 
          open={formOpen} 
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingConta(null);
          }}
          conta={editingConta}
        />
        <RegistrarRecebimentoDialog 
          conta={selectedConta} 
          open={recebimentoDialogOpen} 
          onOpenChange={setRecebimentoDialogOpen} 
        />
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
