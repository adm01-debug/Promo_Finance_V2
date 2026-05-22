// @ts-nocheck
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toastDeleteWithUndo } from '@/lib/toast-with-undo';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';
import { EmptyState } from '@/components/ui/micro-interactions';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { Plus, Package } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useFornecedores, useFornecedoresPaginated, ExternalCliente } from '@/hooks/useFinancialData';
import { fornecedoresColumns } from '@/lib/export-utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { StandardTableCard } from '@/components/shared/StandardTableCard';
import { FornecedorForm } from '@/components/fornecedores/FornecedorForm';
import { FornecedorDetailDialog } from '@/components/fornecedores/FornecedorDetailDialog';
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
        <PageBackground />
        
        <PageHeader 
          title="Fornecedores" 
          subtitle="Gerencie sua base de fornecedores e otimize a cadeia de suprimentos."
          badge="Supply Chain Management"
          icon={Package}
          gradientFrom="from-warning"
          gradientVia="via-orange-500"
          gradientTo="to-red-500"
          actions={
            <div className="flex items-center gap-3">
              <ExportMenu
                data={filteredFornecedores}
                columns={fornecedoresColumns}
                filename="fornecedores"
                title="Relatório de Fornecedores"
              />
              <Button 
                size="lg" 
                className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px]"
                onClick={() => {
                  setEditingFornecedor(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-5 w-5" /> Novo Fornecedor
              </Button>
            </div>
          }
        />

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
          clearSlot={
            <ClearFiltersButton
              controller={filtersController}
              entityLabel="fornecedores"
              describeFilters={(v) => [
                { label: 'Busca', value: v.search, isActive: !!v.search },
                { label: 'Status', value: v.status, isActive: v.status !== 'all' },
                { label: 'Estado', value: v.estado, isActive: v.estado !== 'all' },
              ]}
              className="h-9 px-2 text-muted-foreground hover:text-foreground"
            />
          }
        />

        {/* Table */}
        <motion.div variants={itemVariants}>
          <StandardTableCard
            isLoading={isLoading}
            pageSize={pageSize}
            pagination={filteredFornecedores.length > 0 ? {
              currentPage,
              totalPages,
              pageSize,
              totalItems: totalCount,
              onPageChange: setCurrentPage,
              onPageSizeChange: handlePageSizeChange
            } : undefined}
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-white/5">
                  <TableHead className="w-[250px] font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 p-6">Fornecedor</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 p-6">Contato</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 p-6">Localização</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 p-6">Status</TableHead>
                  <TableHead className="w-[80px] p-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-white/5">
                {fornecedores.length === 0 ? (
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
                  fornecedores.map((fornecedor, index) => (
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
          </StandardTableCard>
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
