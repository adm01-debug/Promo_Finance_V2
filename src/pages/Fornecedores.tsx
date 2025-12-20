import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import { EmptyState } from '@/components/ui/micro-interactions';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Truck,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Filter,
  X,
  Package,
} from 'lucide-react';
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
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useFornecedores, useFornecedoresPaginated, Fornecedor } from '@/hooks/useFinancialData';
import { fornecedoresColumns } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { FornecedorForm } from '@/components/fornecedores/FornecedorForm';
import { FornecedorDetailDialog } from '@/components/fornecedores/FornecedorDetailDialog';
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

export default function Fornecedores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFornecedor, setDeletingFornecedor] = useState<Fornecedor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingFornecedor, setViewingFornecedor] = useState<Fornecedor | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  // Advanced filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const queryClient = useQueryClient();
  
  // Server-side paginated query
  const { data: paginatedResult, isLoading } = useFornecedoresPaginated({
    page: currentPage,
    pageSize,
    search: searchTerm,
    status: statusFilter,
    estado: estadoFilter,
  });

  // Get all data for KPIs
  const { data: allFornecedores = [] } = useFornecedores();

  const fornecedores = paginatedResult?.data || [];
  const totalCount = paginatedResult?.totalCount || 0;
  const totalPages = paginatedResult?.totalPages || 1;

  // Get unique states for filter
  const estados = useMemo(() => {
    const unique = [...new Set(fornecedores.map(f => f.estado).filter(Boolean))];
    return unique.sort() as string[];
  }, [fornecedores]);

  const filteredFornecedores = useMemo(() => {
    return fornecedores.filter(f => {
      // Text search
      const matchesSearch = 
        f.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.cnpj_cpf?.includes(searchTerm)) ||
        (f.email?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'ativo' && f.ativo) ||
        (statusFilter === 'inativo' && !f.ativo);
      
      // Estado filter
      const matchesEstado = 
        estadoFilter === 'all' || 
        f.estado === estadoFilter;
      
      return matchesSearch && matchesStatus && matchesEstado;
    });
  }, [fornecedores, searchTerm, statusFilter, estadoFilter]);

  const hasActiveFilters = statusFilter !== 'all' || estadoFilter !== 'all';
  
  const clearFilters = () => {
    setStatusFilter('all');
    setEstadoFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Use server-side paginated data directly
  const paginatedFornecedores = fornecedores;

  // Reset to page 1 when filters change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const totalFornecedores = allFornecedores.length;
  const fornecedoresAtivos = allFornecedores.filter(f => f.ativo).length;

  const handleDelete = async () => {
    if (!deletingFornecedor) return;
    
    const fornecedorBackup = { ...deletingFornecedor };
    setDeleteDialogOpen(false);
    setDeletingFornecedor(null);
    
    toastDeleteWithUndo({
      item: fornecedorBackup,
      itemName: `Fornecedor "${fornecedorBackup.razao_social}"`,
      onDelete: async () => {
        const { error } = await supabase
          .from('fornecedores')
          .update({ ativo: false })
          .eq('id', fornecedorBackup.id);
        
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      },
      onRestore: async () => {
        await supabase
          .from('fornecedores')
          .update({ ativo: true })
          .eq('id', fornecedorBackup.id);
        queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      },
    });
  };
  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Fornecedores</h1>
            <p className="text-muted-foreground mt-1">Gerencie sua base de fornecedores</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportMenu
              data={filteredFornecedores}
              columns={fornecedoresColumns}
              filename="fornecedores"
              title="Relatório de Fornecedores"
            />
            <Button 
              size="sm" 
              className="gap-2 bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 shadow-lg shadow-warning/25 text-warning-foreground"
              onClick={() => {
                setEditingFornecedor(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Fornecedores</p>
                  <p className="text-2xl font-bold font-display mt-1">{totalFornecedores}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center transition-transform group-hover:scale-110">
                  <Truck className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fornecedores Ativos</p>
                  <p className="text-2xl font-bold font-display mt-1">{fornecedoresAtivos}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
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
                
                <div className="ml-auto text-sm text-muted-foreground">
                  {filteredFornecedores.length} de {fornecedores.length} fornecedores
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated overflow-hidden">
            {isLoading ? (
              <div className="p-4">
                <LoadingSkeleton variant="table" rows={8} columns={5} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[250px]">Fornecedor</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFornecedores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <EmptyState 
                            icon={<Package className="h-8 w-8 text-muted-foreground" />}
                            title={fornecedores.length === 0 ? 'Nenhum fornecedor cadastrado' : 'Nenhum fornecedor encontrado'}
                            description={fornecedores.length === 0 ? 'Comece adicionando seu primeiro fornecedor' : 'Tente ajustar os filtros de busca'}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedFornecedores.map((fornecedor, index) => (
                        <motion.tr
                          key={fornecedor.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="group hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <Truck className="h-5 w-5 text-warning" />
                              </div>
                              <div>
                                <p className="font-medium">{fornecedor.razao_social}</p>
                                {fornecedor.nome_fantasia && (
                                  <p className="text-xs text-muted-foreground">{fornecedor.nome_fantasia}</p>
                                )}
                                {fornecedor.cnpj_cpf && (
                                  <p className="text-xs text-muted-foreground">{fornecedor.cnpj_cpf}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {fornecedor.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate max-w-[150px]">{fornecedor.email}</span>
                                </div>
                              )}
                              {fornecedor.telefone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{fornecedor.telefone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(fornecedor.cidade || fornecedor.estado) && (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {fornecedor.cidade}{fornecedor.cidade && fornecedor.estado && ' - '}{fornecedor.estado}
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                fornecedor.ativo 
                                  ? "bg-success/10 text-success border-success/20" 
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {fornecedor.ativo ? 'Ativo' : 'Inativo'}
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
                                    setViewingFornecedor(fornecedor);
                                    setDetailOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                  Visualizar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="gap-2"
                                  onClick={() => {
                                    setEditingFornecedor(fornecedor);
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
                                    setDeletingFornecedor(fornecedor);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            {filteredFornecedores.length > 0 && (
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

        <FornecedorForm 
          open={formOpen} 
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingFornecedor(null);
          }}
          fornecedor={editingFornecedor}
        />

        <FornecedorDetailDialog
          fornecedor={viewingFornecedor}
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) setViewingFornecedor(null);
          }}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Confirmar exclusão"
          description={`Tem certeza que deseja excluir o fornecedor "${deletingFornecedor?.razao_social}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleDelete}
        />
      </motion.div>
    </MainLayout>
  );
}
