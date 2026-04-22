import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';
import { EmptyState } from '@/components/ui/micro-interactions';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { Plus, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExportMenu } from '@/components/ui/export-menu';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useFornecedores, useFornecedoresPaginated, ExternalCliente } from '@/hooks/useFinancialData';
import { fornecedoresColumns } from '@/lib/export-utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { FornecedorForm } from '@/components/fornecedores/FornecedorForm';
import { FornecedorDetailDialog } from '@/components/fornecedores/FornecedorDetailDialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { FornecedoresTableRow } from './fornecedores/FornecedoresTableRow';
import { FornecedoresKPIs } from '@/components/fornecedores/FornecedoresKPIs';
import { FornecedoresFiltersPanel } from '@/components/fornecedores/FornecedoresFiltersPanel';

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
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<ExternalCliente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFornecedor, setDeletingFornecedor] = useState<ExternalCliente | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingFornecedor, setViewingFornecedor] = useState<ExternalCliente | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  // Advanced filters — gerenciados via useManagedFilters
  const filtersController = useManagedFilters({
    entityType: 'fornecedores',
    defaults: { search: '', status: 'all', estado: 'all' },
    localStorageKey: 'fornecedores-filters',
  });
  const { values: filterValues, setField: setFilterField } = filtersController;
  const statusFilter = filterValues.status as string;
  const estadoFilter = filterValues.estado as string;
  const setStatusFilter = (v: string) => setFilterField('status', v);
  const setEstadoFilter = (v: string) => setFilterField('estado', v);

  useEffect(() => {
    setFilterField('search', searchTerm);
  }, [searchTerm, setFilterField]);
  useEffect(() => {
    if (filtersController.isHydrated && filterValues.search && !searchTerm) {
      setSearchTerm(filterValues.search as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersController.isHydrated]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const queryClient = useQueryClient();
  
  // Server-side paginated query with debounced search
  const { data: paginatedResult, isLoading } = useFornecedoresPaginated({
    page: currentPage,
    pageSize,
    search: debouncedSearch,
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
        <FornecedoresKPIs total={totalFornecedores} ativos={fornecedoresAtivos} />

        {/* Filters */}
        <FornecedoresFiltersPanel
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          estadoFilter={estadoFilter}
          onEstadoChange={setEstadoFilter}
          estados={estados}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filteredCount={filteredFornecedores.length}
          totalCount={fornecedores.length}
        />

        {/* Table */}
        <motion.div variants={itemVariants}>
          <Card className="card-elevated overflow-hidden">
            {isLoading ? (
              <TableShimmerSkeleton rows={8} columns={5} />
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
                        <FornecedoresTableRow
                          key={fornecedor.id}
                          fornecedor={fornecedor}
                          index={index}
                          onView={(f) => { setViewingFornecedor(f); setDetailOpen(true); }}
                          onEdit={(f) => { setEditingFornecedor(f); setFormOpen(true); }}
                          onDelete={(f) => { setDeletingFornecedor(f); setDeleteDialogOpen(true); }}
                        />
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
          fornecedor={editingFornecedor as any}
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
