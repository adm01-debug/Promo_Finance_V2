import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import { ClientesTableBody } from '@/pages/clientes/ClientesTableBody';
import { ClientesKPIs } from '@/pages/clientes/ClientesKPIs';
import { ClientesFiltersPanel } from '@/pages/clientes/ClientesFiltersPanel';
import { EmptyState } from '@/components/ui/micro-interactions';
import { useDebounce } from '@/hooks/useOptimizedQueries';
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
import { useClientes, useClientesPaginated, ExternalCliente } from '@/hooks/useFinancialData';
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
  if (score >= 400) return 'text-streak';
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
  const [editingCliente, setEditingCliente] = useState<ExternalCliente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCliente, setDeletingCliente] = useState<ExternalCliente | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingCliente, setViewingCliente] = useState<ExternalCliente | null>(null);
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
        <ClientesKPIs totalClientes={totalClientes} clientesAtivos={clientesAtivos} limiteTotal={limiteTotal} />

        {/* Filters */}
        <ClientesFiltersPanel
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          estadoFilter={estadoFilter}
          scoreFilter={scoreFilter}
          estados={estados}
          filteredCount={filteredClientes.length}
          totalCount={clientes.length}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onEstadoChange={setEstadoFilter}
          onScoreChange={setScoreFilter}
          onClearFilters={clearFilters}
        />

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
                      <ClientesTableBody
                        clientes={paginatedClientes}
                        onView={(c) => { setViewingCliente(c); setDetailOpen(true); }}
                        onEdit={(c) => { setEditingCliente(c); setFormOpen(true); }}
                        onDelete={(c) => { setDeletingCliente(c); setDeleteDialogOpen(true); }}
                      />
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
          cliente={editingCliente as any}
        />

        <ClienteDetailDialog
          cliente={viewingCliente as any}
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
    </MainLayout>
  );
}
