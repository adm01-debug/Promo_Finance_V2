import { motion } from 'framer-motion';
import { Plus, Inbox, CheckCircle2, XCircle } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ContasReceberKPIs } from '@/components/contas-receber/ContasReceberKPIs';
import { ContasReceberFilters } from '@/components/contas-receber/ContasReceberFilters';
import { ContasReceberTableRow } from '@/components/contas-receber/ContasReceberTableRow';
import { useContasReceberLogic } from '@/hooks/useContasReceberLogic';
import { contasReceberColumns } from '@/lib/export-utils';
import { formatCurrency } from '@/lib/formatters';

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
    searchTerm, statusFilter, centroCustoFilter, formOpen, recebimentoDialogOpen,
    selectedConta, editingConta, advancedFilters, currentPage, pageSize,
    deleteDialogOpen, deletingConta, isDeleting, isLoading, filterType,
    contas, sortedContas, centrosCusto, totalCount, totalPages, kpis,
    sortKey, sortDirection,
    handleSearchChange, handleStatusChange, handleCentroCustoChange, handlePageSizeChange,
    handleSort, handleOpenDeleteDialog, handleDeleteConta, handleFilterChange,
    handleBulkMarkAsReceived, handleBulkCancel,
    setFormOpen, setRecebimentoDialogOpen, setSelectedConta, setEditingConta,
    setAdvancedFilters, setCurrentPage, setDeleteDialogOpen,
    selectedIds, selectedCount, isProcessing, progress, isSelected, isAllSelected,
    selectAll, toggleSelect, clearSelection,
  } = useContasReceberLogic();

  const bulkActions = [
    { id: 'mark-received', label: 'Marcar como Recebido', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'default' as const, onClick: handleBulkMarkAsReceived },
    { id: 'cancel', label: 'Cancelar', icon: <XCircle className="h-4 w-4" />, variant: 'destructive' as const, onClick: handleBulkCancel },
  ];

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
            <ExportMenu data={sortedContas} columns={contasReceberColumns} filename="contas_receber" title="Relatório de Contas a Receber" />
            <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/80" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Nova Conta
            </Button>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={itemVariants}>
          <ContasReceberKPIs {...kpis} />
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
            centrosCusto={centrosCusto} advancedFilters={advancedFilters} onAdvancedFiltersChange={setAdvancedFilters}
          />
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
                      <TableHead className="w-[40px]"><Checkbox checked={isAllSelected} onChange={selectAll} /></TableHead>
                      <TableHead className="w-[250px]"><SortableHeader label="Cliente" sortKey="cliente_nome" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} /></TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead><SortableHeader label="Valor" sortKey="valor" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} /></TableHead>
                      <TableHead><SortableHeader label="Vencimento" sortKey="data_vencimento" currentSort={sortKey} currentDirection={sortDirection} onSort={handleSort} /></TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedContas.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="p-0">
                        <EmptyState icon={<Inbox className="h-8 w-8 text-muted-foreground" />} title={contas.length === 0 ? 'Nenhuma conta cadastrada' : 'Nenhuma conta encontrada'} description={contas.length === 0 ? 'Comece adicionando sua primeira conta a receber' : 'Tente ajustar os filtros'} />
                      </TableCell></TableRow>
                    ) : sortedContas.map((conta, index) => (
                      <ContasReceberTableRow key={conta.id} conta={conta} index={index} isSelected={isSelected(conta.id)} onToggleSelect={toggleSelect} onEdit={(c) => { setEditingConta(c); setFormOpen(true); }} onDelete={handleOpenDeleteDialog} onRegistrarRecebimento={(c) => { setSelectedConta(c); setRecebimentoDialogOpen(true); }} />
                    ))}
                  </TableBody>
                </Table>
                <TablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={totalCount} onPageChange={setCurrentPage} onPageSizeChange={handlePageSizeChange} />
              </div>
            )}
          </Card>
        </motion.div>

        <ContaReceberForm open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingConta(null); }} conta={editingConta} />
        <RegistrarRecebimentoDialog conta={selectedConta} open={recebimentoDialogOpen} onOpenChange={setRecebimentoDialogOpen} />
        <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Confirmar exclusão" description={`Tem certeza que deseja excluir "${deletingConta?.descricao}" (${deletingConta?.valor ? formatCurrency(deletingConta.valor) : ''})?`} confirmLabel="Excluir" variant="danger" isLoading={isDeleting} onConfirm={handleDeleteConta} />
        <BulkActionsBar selectedCount={selectedCount} isProcessing={isProcessing} progress={progress} actions={bulkActions} onClear={clearSelection} />
      </motion.div>
    </MainLayout>
  );
}
