import { motion } from 'framer-motion';
import { Plus, Inbox, CheckCircle2, XCircle, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExportMenu } from '@/components/ui/export-menu';
import { SortableHeader } from '@/components/ui/sortable-header';
import { TablePagination } from '@/components/ui/table-pagination';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { QuickDateFilters } from '@/components/ui/quick-date-filters';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { EmptyState } from '@/components/ui/micro-interactions';
import { MainLayout } from '@/components/layout/MainLayout';
import { ContaReceberForm } from '@/components/contas-receber/ContaReceberForm';
import { RegistrarRecebimentoDialog } from '@/components/contas-receber/RegistrarRecebimentoDialog';
import { ContaReceberDetailDrawer } from '@/components/contas-receber/ContaReceberDetailDrawer';
import { EnviarCobrancaDialog } from '@/components/contas-receber/EnviarCobrancaDialog';
import { AplicarDescontoDialog } from '@/components/contas-receber/AplicarDescontoDialog';
import { ContasReceberKanban } from '@/components/contas-receber/ContasReceberKanban';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ContasReceberKPIs } from '@/components/contas-receber/ContasReceberKPIs';
import { ContasReceberFilters } from '@/components/contas-receber/ContasReceberFilters';
import { ContasReceberTableRow } from '@/components/contas-receber/ContasReceberTableRow';
import { useContasReceberLogic } from '@/hooks/useContasReceberLogic';
import { useHighlightFromUrl } from '@/hooks/useHighlightFromUrl';
import { contasReceberColumns } from '@/lib/export-utils';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

export default function ContasReceber() {
  const {
    searchTerm, statusFilter, centroCustoFilter, empresaFilter, formaFilter,
    formOpen, recebimentoDialogOpen, selectedConta, editingConta, advancedFilters,
    currentPage, pageSize, deleteDialogOpen, deletingConta, isDeleting, isLoading, filterType,
    viewMode, detailDrawerOpen, detailConta, cobrancaDialogOpen, cobrancaConta,
    descontoDialogOpen, descontoConta,
    contas, sortedContas, centrosCusto, empresas, totalCount, totalPages, kpis, sortKey, sortDirection,
    handleSearchChange, handleStatusChange, handleCentroCustoChange, handleEmpresaChange,
    handleFormaChange, handlePageSizeChange, handleSort, handleOpenDeleteDialog, handleDeleteConta,
    handleFilterChange, handleBulkMarkAsReceived, handleBulkCancel, handleViewConta,
    handleEnviarCobranca, handleKpiClick, handleAplicarDesconto,
    setFormOpen, setRecebimentoDialogOpen, setSelectedConta, setEditingConta,
    setAdvancedFilters, setCurrentPage, setDeleteDialogOpen, setViewMode,
    setDetailDrawerOpen, setCobrancaDialogOpen, setDescontoDialogOpen,
    selectedIds, selectedCount, isProcessing, progress, isSelected, isAllSelected,
    selectAll, toggleSelect, clearSelection,
  } = useContasReceberLogic();

  useHighlightFromUrl('highlight', (sortedContas?.length ?? 0) > 0);

  const bulkActions = [
    { id: 'mark-received', label: 'Marcar como Recebido', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'default' as const, onClick: handleBulkMarkAsReceived },
    { id: 'cancel', label: 'Cancelar', icon: <XCircle className="h-4 w-4" />, variant: 'destructive' as const, onClick: handleBulkCancel },
  ];

  const colCount = 9 + (empresas.length > 1 ? 1 : 0) + 1; // +1 for dias atraso

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        {/* Premium Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] rounded-full bg-purple-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 space-y-10 pb-20">
          {/* Hero Header Section */}
          <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-fade-in">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Receivables Governance
              </div>
              <h1 className="text-5xl font-black tracking-tighter md:text-6xl lg:text-7xl">
                Contas a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600">Receber</span>
              </h1>
              <p className="text-xl text-muted-foreground/70 max-w-2xl leading-relaxed font-medium italic">
                Monitore ativos financeiros e maximize a eficiência do capital de giro.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-background/40 p-2.5 rounded-[2rem] border border-white/10 backdrop-blur-2xl shadow-2xl ring-1 ring-white/10">
              <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 shadow-inner">
                <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('table')} className={cn("h-10 w-10 rounded-lg transition-all", viewMode === 'table' ? "bg-white text-primary shadow-lg" : "text-muted-foreground")}>
                  <TableIcon className="h-5 w-5" />
                </Button>
                <Button variant={viewMode === 'kanban' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('kanban')} className={cn("h-10 w-10 rounded-lg transition-all", viewMode === 'kanban' ? "bg-white text-primary shadow-lg" : "text-muted-foreground")}>
                  <LayoutGrid className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="w-px h-8 bg-white/10 mx-2" />

              <div className="flex items-center gap-3">
                <ExportMenu data={sortedContas} columns={contasReceberColumns} filename="contas_receber" title="Relatório de Contas a Receber" />
                <Button size="lg" className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px]" onClick={() => setFormOpen(true)}>
                  <Plus className="h-5 w-5" /> Novo Comando
                </Button>
              </div>
            </div>
          </motion.div>

          {/* KPIs Section */}
          <motion.div variants={itemVariants}>
            <ContasReceberKPIs {...kpis} onKpiClick={handleKpiClick} />
          </motion.div>

          {/* Filter Intelligence Section */}
          <div className="space-y-6">
            <motion.div variants={itemVariants}>
              <QuickDateFilters value={filterType} onChange={handleFilterChange} showOverdue />
            </motion.div>

            <motion.div variants={itemVariants}>
              <ContasReceberFilters
                searchTerm={searchTerm} onSearchChange={handleSearchChange}
                statusFilter={statusFilter} onStatusChange={handleStatusChange}
                centroCustoFilter={centroCustoFilter} onCentroCustoChange={handleCentroCustoChange}
                centrosCusto={centrosCusto}
                empresaFilter={empresaFilter} onEmpresaChange={handleEmpresaChange} empresas={empresas}
                formaFilter={formaFilter} onFormaChange={handleFormaChange}
                advancedFilters={advancedFilters} onAdvancedFiltersChange={setAdvancedFilters}
              />
            </motion.div>
          </div>

          {/* Core Content: Table or Kanban */}
          <motion.div variants={itemVariants} className="min-h-[600px]">
            {viewMode === 'kanban' ? (
              <ContasReceberKanban contas={sortedContas} onSelectConta={handleViewConta} />
            ) : (
              <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10">
                {isLoading ? (
                  <TableShimmerSkeleton rows={pageSize} columns={8} showCheckbox showAvatar />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <tr className="bg-white/[0.02] border-b border-white/5">
                          <th className="w-16 p-6 text-center"><Checkbox checked={isAllSelected} onChange={selectAll} /></th>
                          <th className="w-[300px] p-6"><SortableHeader label="Entity / Client" sortKey="cliente_nome" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} /></th>
                          <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Reference Description</th>
                          <th className="p-6"><SortableHeader label="Nominal Value" sortKey="valor" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} /></th>
                          <th className="p-6"><SortableHeader label="Maturity Date" sortKey="data_vencimento" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} /></th>
                          <th className="w-24 p-6 text-center"><SortableHeader label="Delay" sortKey="data_vencimento" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} /></th>
                          <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Status</th>
                          {empresas.length > 1 && <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Corporate</th>}
                          <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Credit Score</th>
                          <th className="w-20 p-6"></th>
                        </tr>
                      </TableHeader>
                      <TableBody className="divide-y divide-white/5">
                        {sortedContas.length === 0 ? (
                          <TableRow><TableCell colSpan={colCount} className="p-0 h-[400px]">
                            <EmptyState
                              icon={<Inbox className="h-12 w-12 text-muted-foreground/30" />}
                              title={contas.length === 0 ? 'Repositório Vazio' : 'Nenhuma Correspondência'}
                              description={contas.length === 0 ? 'Inicie a governança de ativos adicionando seu primeiro título.' : 'Ajuste os algoritmos de busca para encontrar o registro.'}
                              action={contas.length === 0 ? (
                                <Button size="lg" className="h-12 rounded-xl bg-primary text-primary-foreground font-black mt-6" onClick={() => setFormOpen(true)}>
                                  <Plus className="h-5 w-5" /> Adicionar Título Alpha
                                </Button>
                              ) : undefined}
                            />
                          </TableCell></TableRow>
                        ) : sortedContas.map((conta, index) => (
                          <ContasReceberTableRow
                            key={conta.id}
                            conta={conta}
                            index={index}
                            isSelected={isSelected(conta.id)}
                            onToggleSelect={toggleSelect}
                            onEdit={(c) => { setEditingConta(c); setFormOpen(true); }}
                            onDelete={handleOpenDeleteDialog}
                            onRegistrarRecebimento={(c) => { setSelectedConta(c); setRecebimentoDialogOpen(true); }}
                            onView={handleViewConta}
                            onEnviarCobranca={handleEnviarCobranca}
                            onAplicarDesconto={handleAplicarDesconto}
                            showEmpresa={empresas.length > 1}
                            showDiasAtraso
                          />
                        ))}
                      </TableBody>
                    </Table>
                    <div className="p-6 border-t border-white/5 bg-black/20">
                      <TablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={totalCount} onPageChange={setCurrentPage} onPageSizeChange={handlePageSizeChange} />
                    </div>
                  </div>
                )}
              </Card>
            )}
          </motion.div>

          {/* Dialogs & Drawers */}
          <ContaReceberForm open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingConta(null); }} conta={editingConta} />
          <RegistrarRecebimentoDialog conta={selectedConta} open={recebimentoDialogOpen} onOpenChange={setRecebimentoDialogOpen} />
          <ContaReceberDetailDrawer
            conta={detailConta} open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}
            onEdit={(c) => { setEditingConta(c); setFormOpen(true); }}
            onRegistrarRecebimento={(c) => { setSelectedConta(c); setRecebimentoDialogOpen(true); }}
            onEnviarCobranca={handleEnviarCobranca}
          />
          <EnviarCobrancaDialog conta={cobrancaConta} open={cobrancaDialogOpen} onOpenChange={setCobrancaDialogOpen} />
          <AplicarDescontoDialog conta={descontoConta} open={descontoDialogOpen} onOpenChange={setDescontoDialogOpen} />
          <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Exclusão Irreversível"
            description={`Confirmar a remoção definitiva do título "${deletingConta?.descricao}" (${deletingConta?.valor ? formatCurrency(deletingConta.valor) : ''}) do repositório?`}
            confirmLabel="Confirmar Exclusão" variant="danger" isLoading={isDeleting} onConfirm={handleDeleteConta} />
          <BulkActionsBar selectedCount={selectedCount} isProcessing={isProcessing} progress={progress} actions={bulkActions} onClear={clearSelection} />
        </motion.div>
      </div>
    </MainLayout>
  );
}
