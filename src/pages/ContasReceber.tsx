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

  const bulkActions = [
    { id: 'mark-received', label: 'Marcar como Recebido', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'default' as const, onClick: handleBulkMarkAsReceived },
    { id: 'cancel', label: 'Cancelar', icon: <XCircle className="h-4 w-4" />, variant: 'destructive' as const, onClick: handleBulkCancel },
  ];

  const colCount = 9 + (empresas.length > 1 ? 1 : 0) + 1; // +1 for dias atraso

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Contas a Receber</h1>
            <p className="text-muted-foreground mt-1">Gerencie todos os títulos a receber e acompanhe a inadimplência</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon-sm" onClick={() => setViewMode('table')} className="h-8 w-8">
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'kanban' ? 'default' : 'ghost'} size="icon-sm" onClick={() => setViewMode('kanban')} className="h-8 w-8">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <ExportMenu data={sortedContas} columns={contasReceberColumns} filename="contas_receber" title="Relatório de Contas a Receber" />
            <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/80" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Nova Conta
            </Button>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={itemVariants}>
          <ContasReceberKPIs {...kpis} onKpiClick={handleKpiClick} />
        </motion.div>

        {/* Quick Date Filters */}
        <motion.div variants={itemVariants}>
          <QuickDateFilters value={filterType} onChange={handleFilterChange} showOverdue />
        </motion.div>

        {/* Filters */}
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

        {/* Content */}
        <motion.div variants={itemVariants}>
          {viewMode === 'kanban' ? (
            <ContasReceberKanban contas={sortedContas} onSelectConta={handleViewConta} />
          ) : (
            <Card className="card-elevated overflow-hidden">
              {isLoading ? (
                <TableShimmerSkeleton rows={pageSize} columns={8} showCheckbox showAvatar />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[40px]"><Checkbox checked={isAllSelected} onChange={selectAll} /></TableHead>
                        <TableHead className="w-[250px]"><SortableHeader label="Cliente" sortKey="cliente_nome" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} /></TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead><SortableHeader label="Valor" sortKey="valor" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} /></TableHead>
                        <TableHead><SortableHeader label="Vencimento" sortKey="data_vencimento" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} /></TableHead>
                        {/* Dias em Atraso sortável (#15) */}
                        <TableHead className="w-[80px]"><SortableHeader label="Dias" sortKey="data_vencimento" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} /></TableHead>
                        <TableHead>Status</TableHead>
                        {empresas.length > 1 && <TableHead>Empresa</TableHead>}
                        <TableHead>Score</TableHead>
                        <TableHead className="w-[120px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedContas.length === 0 ? (
                        <TableRow><TableCell colSpan={colCount} className="p-0">
                          <EmptyState
                            icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
                            title={contas.length === 0 ? 'Nenhuma conta cadastrada' : 'Nenhuma conta encontrada'}
                            description={contas.length === 0 ? 'Comece adicionando sua primeira conta a receber clicando em "Nova Conta"' : 'Tente ajustar os filtros para encontrar o que procura'}
                            action={contas.length === 0 ? (
                              <Button size="sm" className="gap-2 mt-3" onClick={() => setFormOpen(true)}>
                                <Plus className="h-4 w-4" /> Criar primeira conta
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
                  <TablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={totalCount} onPageChange={setCurrentPage} onPageSizeChange={handlePageSizeChange} />
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
        <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Confirmar exclusão"
          description={`Tem certeza que deseja excluir "${deletingConta?.descricao}" (${deletingConta?.valor ? formatCurrency(deletingConta.valor) : ''})?`}
          confirmLabel="Excluir" variant="danger" isLoading={isDeleting} onConfirm={handleDeleteConta} />
        <BulkActionsBar selectedCount={selectedCount} isProcessing={isProcessing} progress={progress} actions={bulkActions} onClear={clearSelection} />
      </motion.div>
    </MainLayout>
  );
}
