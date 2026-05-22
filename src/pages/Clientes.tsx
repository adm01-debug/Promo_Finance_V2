import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { ClientesTableBody } from '@/pages/clientes/ClientesTableBody';
import { ClientesKPIs } from '@/pages/clientes/ClientesKPIs';
import { ClientesFiltersPanel } from '@/pages/clientes/ClientesFiltersPanel';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';
import { EmptyState } from '@/components/ui/micro-interactions';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import {
  Plus,
  Users,
  Trophy,
} from 'lucide-react';
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
import { useClientes, useClientesPaginated, ExternalCliente } from '@/hooks/useFinancialData';
import { clientesColumns } from '@/lib/export-utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { StandardTableCard } from '@/components/shared/StandardTableCard';
import { ClienteForm } from '@/components/clientes/ClienteForm';
import { ClienteDetailDialog } from '@/components/clientes/ClienteDetailDialog';
import { ScoringClientesPanel } from '@/components/clientes/ScoringClientesPanel';
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

  const filtersController = useManagedFilters({
    entityType: 'clientes',
    defaults: { search: '', status: 'all', estado: 'all', score: 'all' },
    localStorageKey: 'clientes-filters',
  });
  const { values: filterValues, setField: setFilterField } = filtersController;
  const statusFilter = filterValues.status as string;
  const estadoFilter = filterValues.estado as string;
  const scoreFilter = filterValues.score as string;

  const setStatusFilter = (v: string) => setFilterField('status', v);
  const setEstadoFilter = (v: string) => setFilterField('estado', v);
  const setScoreFilter = (v: string) => setFilterField('score', v);

  useEffect(() => {
    setFilterField('search', searchTerm);
  }, [searchTerm, setFilterField]);

  useEffect(() => {
    if (filtersController.isHydrated && filterValues.search && !searchTerm) {
      setSearchTerm(filterValues.search as string);
    }
  }, [filtersController.isHydrated]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();
  
  const { data: paginatedResult, isLoading } = useClientesPaginated({
    page: currentPage,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    estado: estadoFilter,
    scoreRange: scoreFilter !== 'all' ? scoreFilter : undefined,
  });

  const { data: allClientes = [] } = useClientes();
  const clientes = paginatedResult?.data || [];
  const totalCount = paginatedResult?.totalCount || 0;
  const totalPages = paginatedResult?.totalPages || 1;

  const estados = useMemo(() => {
    const unique = [...new Set(clientes.map(c => c.estado).filter(Boolean))];
    return unique.sort() as string[];
  }, [clientes]);

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => {
      const matchesSearch = 
        c.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.cnpj_cpf?.includes(searchTerm)) ||
        (c.email?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'ativo' && c.ativo) || (statusFilter === 'inativo' && !c.ativo);
      const matchesEstado = estadoFilter === 'all' || c.estado === estadoFilter;
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
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const totalClientes = allClientes.length;
  const clientesAtivos = allClientes.filter(c => c.ativo).length;
  const limiteTotal = allClientes.reduce((sum, c) => sum + (c.limite_credito || 0), 0);

  const handleDelete = async () => {
    if (!deletingCliente) return;
    setIsDeleting(true);
    const { error } = await supabase.from('clientes').update({ ativo: false }).eq('id', deletingCliente.id);
    if (error) {
      setIsDeleting(false);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['clientes'] });
    setDeleteDialogOpen(false);
    setDeletingCliente(null);
    setIsDeleting(false);
  };

  return (
    <MainLayout>
      <Tabs defaultValue={window.location.hash === '#scoring' ? 'scoring' : 'lista'} className="w-full">
        <div className="relative min-h-screen">
          <PageBackground />
          
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="container mx-auto p-6 relative z-10 space-y-8">
            <PageHeader 
              title="Gestão de Clientes" 
              subtitle="Análise de perfil, scoring de crédito e automação de cobranças neurais."
              badge="Customer Intelligence"
              icon={Users}
              gradientFrom="from-blue-600"
              gradientVia="via-primary"
              gradientTo="to-indigo-500"
              actions={
                <div className="flex items-center gap-3">
                  <TabsList className="bg-primary/10 border-primary/20 h-10 px-1 rounded-xl">
                    <TabsTrigger value="lista" className="rounded-lg font-bold px-4" onClick={() => window.history.replaceState(null, '', '/clientes')}>Lista Geral</TabsTrigger>
                    <TabsTrigger value="scoring" className="rounded-lg font-bold px-4" onClick={() => window.history.replaceState(null, '', '/clientes#scoring')}>Scoring & Risco</TabsTrigger>
                  </TabsList>
                  <div className="h-8 w-px bg-white/10 mx-1" />
                  <ExportMenu
                    data={filteredClientes}
                    columns={clientesColumns}
                    filename="clientes"
                    title="Relatório de Clientes"
                  />
                  <Button 
                    size="lg" 
                    className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px]"
                    onClick={() => {
                      setEditingCliente(null);
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="h-5 w-5" /> Novo Cliente
                  </Button>
                </div>
              }
            />

            <TabsContent value="lista" className="space-y-6 m-0 border-none p-0">
              <ClientesKPIs totalClientes={totalClientes} clientesAtivos={clientesAtivos} limiteTotal={limiteTotal} />
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
                clearSlot={
                  <ClearFiltersButton
                    controller={filtersController}
                    entityLabel="clientes"
                    describeFilters={(v) => [
                      { label: 'Busca', value: v.search, isActive: !!v.search },
                      { label: 'Status', value: v.status, isActive: v.status !== 'all' },
                      { label: 'Estado', value: v.estado, isActive: v.estado !== 'all' },
                      { label: 'Score', value: v.score, isActive: v.score !== 'all' },
                    ]}
                    className="h-9 px-2 text-muted-foreground hover:text-foreground"
                  />
                }
              />
              <motion.div variants={itemVariants}>
                <StandardTableCard
                  isLoading={isLoading}
                  pageSize={pageSize}
                  pagination={totalCount > 0 ? {
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
                        <TableHead className="w-[250px] font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 p-6">Cliente</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 p-6">Contato</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 p-6">Localização</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 p-6">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            Score / Rank
                          </div>
                        </TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 p-6">Limite</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 p-6">Status</TableHead>
                        <TableHead className="w-[80px] p-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-white/5">
                      {clientes.length === 0 ? (
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
                          clientes={clientes}
                          onView={(c) => { setViewingCliente(c); setDetailOpen(true); }}
                          onEdit={(c) => { setEditingCliente(c); setFormOpen(true); }}
                          onDelete={(c) => { setDeletingCliente(c); setDeleteDialogOpen(true); }}
                        />
                      )}
                    </TableBody>
                  </Table>
                </StandardTableCard>
              </motion.div>
            </TabsContent>

            <TabsContent value="scoring" className="m-0 border-none p-0">
              <motion.div variants={itemVariants}>
                <ScoringClientesPanel />
              </motion.div>
            </TabsContent>
          </motion.div>
        </div>
      </Tabs>

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
    </MainLayout>
  );
}
