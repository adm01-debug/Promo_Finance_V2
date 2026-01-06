import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import { EmptyState, HoverLift } from '@/components/ui/micro-interactions';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { InteractivePageWrapper, PrimaryActionButton, KPICard } from '@/components/wrappers';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Star,
  Loader2,
  Filter,
  X,
  Trophy,
  Users,
} from 'lucide-react';
import { RankBadge, getRankFromScore, RankLegend } from '@/components/ui/rank-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExportMenu } from '@/components/ui/export-menu';
import { SortableHeader, useSorting } from '@/components/ui/sortable-header';
import { LoadingSkeleton, TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useClientes, useClientesPaginated, Cliente } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { clientesColumns } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { ClienteForm } from '@/components/clientes/ClienteForm';
import { ClienteDetailDialog } from '@/components/clientes/ClienteDetailDialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

const getScoreColor = (score: number | null) => {
  if (!score) return 'text-muted-foreground';
  if (score >= 800) return 'text-success';
  if (score >= 600) return 'text-warning';
  if (score >= 400) return 'text-orange-500';
  return 'text-destructive';
};

const getScoreLabel = (score: number | null) => {
  if (!score) return '-';
  if (score >= 800) return 'Excelente';
  if (score >= 600) return 'Bom';
  if (score >= 400) return 'Regular';
  return 'Crítico';
};

export default function Clientes() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingCliente, setViewingCliente] = useState<Cliente | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  // Advanced filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const queryClient = useQueryClient();
  
  // Server-side paginated query with debounced search
  const { data: paginatedResult, isLoading } = useClientesPaginated({
    page: currentPage,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    estado: estadoFilter,
    scoreRange: scoreFilter !== 'all' ? scoreFilter : undefined,
  });

  // Get all data for KPIs
  const { data: allClientes = [] } = useClientes();

  const clientes = paginatedResult?.data || [];
  const totalCount = paginatedResult?.totalCount || 0;
  const totalPages = paginatedResult?.totalPages || 1;

  // Get unique states for filter
  const estados = useMemo(() => {
    const unique = [...new Set(clientes.map(c => c.estado).filter(Boolean))];
    return unique.sort() as string[];
  }, [clientes]);

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => {
      // Text search
      const matchesSearch = 
        c.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.cnpj_cpf?.includes(searchTerm)) ||
        (c.email?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'ativo' && c.ativo) ||
        (statusFilter === 'inativo' && !c.ativo);
      
      // Estado filter
      const matchesEstado = 
        estadoFilter === 'all' || 
        c.estado === estadoFilter;
      
      // Score filter
      const matchesScore = (() => {
        if (scoreFilter === 'all') return true;
        const score = c.score || 0;
        switch (scoreFilter) {
          case 'excelente': return score >= 800;
          case 'bom': return score >= 600 && score < 800;
          case 'regular': return score >= 400 && score < 600;
          case 'critico': return score < 400;
          default: return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesEstado && matchesScore;
    });
  }, [clientes, searchTerm, statusFilter, estadoFilter, scoreFilter]);

  const hasActiveFilters = statusFilter !== 'all' || estadoFilter !== 'all' || scoreFilter !== 'all';
  
  const clearFilters = () => {
    setStatusFilter('all');
    setEstadoFilter('all');
    setScoreFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Use server-side paginated data directly
  const paginatedClientes = clientes;

  // Reset to page 1 when filters change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const totalClientes = allClientes.length;
  const clientesAtivos = allClientes.filter(c => c.ativo).length;
  const limiteTotal = allClientes.reduce((sum, c) => sum + (c.limite_credito || 0), 0);

  const handleDelete = async () => {
    if (!deletingCliente) return;
    
    const clienteBackup = { ...deletingCliente };
    setDeleteDialogOpen(false);
    setDeletingCliente(null);
    
    toastDeleteWithUndo({
      item: clienteBackup,
      itemName: `Cliente "${clienteBackup.razao_social}"`,
      onDelete: async () => {
        const { error } = await supabase
          .from('clientes')
          .update({ ativo: false })
          .eq('id', clienteBackup.id);
        
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
      },
      onRestore: async () => {
        await supabase
          .from('clientes')
          .update({ ativo: true })
          .eq('id', clienteBackup.id);
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
      },
    });
  };
  return (
    <MainLayout>
      <InteractivePageWrapper queryKeys={['clientes']} className="space-y-6">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">Gerencie sua base de clientes</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportMenu
              data={filteredClientes}
              columns={clientesColumns}
              filename="clientes"
              title="Relatório de Clientes"
            />
            <Button 
              size="sm" 
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
              onClick={() => {
                setEditingCliente(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HoverLift>
            <Card className="stat-card group h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
                    <p className="text-2xl font-bold font-display mt-1">{totalClientes}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                    <User className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </HoverLift>

          <HoverLift>
            <Card className="stat-card group h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Clientes Ativos</p>
                    <p className="text-2xl font-bold font-display mt-1">{clientesAtivos}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110">
                    <Star className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </HoverLift>

          <HoverLift>
            <Card className="stat-card group h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Limite Total</p>
                    <p className="text-2xl font-bold font-display mt-1">{formatCurrency(limiteTotal)}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center transition-transform group-hover:scale-110">
                    <Building2 className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </HoverLift>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="card-base">
            <CardContent className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por razão social, nome fantasia, CNPJ ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Advanced Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  Filtros:
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {estados.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="excelente">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-success" />
                        Excelente (800+)
                      </span>
                    </SelectItem>
                    <SelectItem value="bom">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-warning" />
                        Bom (600-799)
                      </span>
                    </SelectItem>
                    <SelectItem value="regular">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                        Regular (400-599)
                      </span>
                    </SelectItem>
                    <SelectItem value="critico">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-destructive" />
                        Crítico (&lt;400)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 px-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
                
                <div className="flex items-center gap-4 ml-auto">
                  <RankLegend />
                  <span className="text-sm text-muted-foreground">
                    {filteredClientes.length} de {clientes.length} clientes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated overflow-hidden">
            {isLoading ? (
              <TableShimmerSkeleton rows={pageSize} columns={6} showCheckbox={false} showAvatar />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[250px]">Cliente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-coins" />
                          Score / Rank
                        </div>
                      </TableHead>
                      <TableHead>Limite</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <EmptyState 
                            icon={<Users className="h-8 w-8 text-muted-foreground" />}
                            title={clientes.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
                            description={clientes.length === 0 ? 'Comece adicionando seu primeiro cliente' : 'Tente ajustar os filtros de busca'}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedClientes.map((cliente, index) => {
                        // Disable animations for large datasets
                        const shouldAnimate = paginatedClientes.length <= 20;
                        const RowComponent = shouldAnimate ? motion.tr : 'tr';
                        const animationProps = shouldAnimate 
                          ? { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.02 } }
                          : {};

                        return (
                          <RowComponent
                            key={cliente.id}
                            {...animationProps}
                            className="group hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{cliente.razao_social}</p>
                                {cliente.nome_fantasia && (
                                  <p className="text-xs text-muted-foreground">{cliente.nome_fantasia}</p>
                                )}
                                {cliente.cnpj_cpf && (
                                  <p className="text-xs text-muted-foreground">{cliente.cnpj_cpf}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {cliente.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[150px]">{cliente.email}</span>
                                </div>
                              )}
                              {cliente.telefone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{cliente.telefone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(cliente.cidade || cliente.estado) && (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {cliente.cidade}{cliente.cidade && cliente.estado && ' - '}{cliente.estado}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <RankBadge
                                rank={getRankFromScore(cliente.score || 0, { gold: 800, silver: 600, bronze: 400 })}
                                size="sm"
                                label={getScoreLabel(cliente.score)}
                                value={cliente.score || '-'}
                                animate={true}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatCurrency(cliente.limite_credito || 0)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                cliente.ativo 
                                  ? "bg-success/10 text-success border-success/20" 
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {cliente.ativo ? 'Ativo' : 'Inativo'}
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
                                <DropdownMenuItem 
                                  className="gap-2"
                                  onClick={() => {
                                    setViewingCliente(cliente);
                                    setDetailOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="gap-2"
                                  onClick={() => {
                                    setEditingCliente(cliente);
                                    setFormOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="gap-2 text-destructive"
                                  onClick={() => {
                                    setDeletingCliente(cliente);
                                    setDeleteDialogOpen(true);
                                  }}
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
              </div>
            )}
            {filteredClientes.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalCount}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </Card>
        </motion.div>

        <ClienteForm 
          open={formOpen} 
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingCliente(null);
          }}
          cliente={editingCliente}
        />

        <ClienteDetailDialog
          cliente={viewingCliente}
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) setViewingCliente(null);
          }}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Confirmar exclusão"
          description={`Tem certeza que deseja excluir o cliente "${deletingCliente?.razao_social}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDelete}
        />
      </motion.div>
      </InteractivePageWrapper>
    </MainLayout>
  );
}
