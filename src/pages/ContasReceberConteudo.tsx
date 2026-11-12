import { motion } from 'framer-motion';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContaReceberForm } from '@/components/contas-receber/ContaReceberForm';
import { RegistrarRecebimentoDialog } from '@/components/contas-receber/RegistrarRecebimentoDialog';
import { EnviarCobrancaDialog } from '@/components/contas-receber/EnviarCobrancaDialog';
import { AplicarDescontoDialog } from '@/components/contas-receber/AplicarDescontoDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ContasReceberKPIs } from '@/components/contas-receber/ContasReceberKPIs';
import { formatCurrency } from '@/lib/formatters';
import { BaixaAutomaticaDialog } from '@/components/contas-receber/BaixaAutomaticaDialog';
import { WebhookConfigDialog } from '@/components/contas-receber/WebhookConfigDialog';
import { containerVariants, itemVariants } from './ContasReceber.helpers';
import { ContasReceberConteudoConteudo } from './ContasReceberConteudoConteudo';
import { ContasReceberConteudoConteudo2 } from './ContasReceberConteudoConteudo2';
import { ContasReceberConteudoConteudo3 } from './ContasReceberConteudoConteudo3';
import type { ContasReceberConteudoProps } from './ContasReceberConteudo.types';

export function ContasReceberConteudo({
  headerActions,
  kpis,
  handleKpiClick,
  filterType,
  handleFilterChange,
  searchTerm,
  handleSearchChange,
  statusFilter,
  handleStatusChange,
  centroCustoFilter,
  handleCentroCustoChange,
  centrosCusto,
  empresaFilter,
  handleEmpresaChange,
  empresas,
  formaFilter,
  handleFormaChange,
  contaBancariaFilter,
  handleContaBancariaChange,
  contasBancarias,
  advancedFilters,
  setAdvancedFilters,
  viewMode,
  sortedContas,
  handleViewConta,
  isLoading,
  pageSize,
  currentPage,
  totalPages,
  totalCount,
  setCurrentPage,
  handlePageSizeChange,
  isAllSelected,
  selectAll,
  sortKey,
  sortDirection,
  handleSort,
  colCount,
  contas,
  setFormOpen,
  isSelected,
  toggleSelect,
  setEditingConta,
  handleOpenDeleteDialog,
  setSelectedConta,
  setRecebimentoDialogOpen,
  handleEnviarCobranca,
  handleAplicarDesconto,
  formOpen,
  editingConta,
  selectedConta,
  recebimentoDialogOpen,
  detailConta,
  detailDrawerOpen,
  setDetailDrawerOpen,
  cobrancaConta,
  cobrancaDialogOpen,
  setCobrancaDialogOpen,
  descontoConta,
  descontoDialogOpen,
  setDescontoDialogOpen,
  deleteDialogOpen,
  setDeleteDialogOpen,
  deletingConta,
  isDeleting,
  handleDeleteConta,
  baixaDialogOpen,
  setBaixaDialogOpen,
  webhookDialogOpen,
  setWebhookDialogOpen,
  selectedCount,
  isProcessing,
  progress,
  bulkActions,
  clearSelection,
}: ContasReceberConteudoProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative z-10 space-y-12 pb-32"
    >
      <PageHeader
        title="Contas a Receber"
        subtitle="Monitore ativos financeiros e maximize a eficiência do capital de giro."
        badge="Receivables Governance"
        showEmpresaSwitcher
        actions={headerActions}
        showUxValidator
      />

      <motion.div variants={itemVariants}>
        <ContasReceberKPIs {...kpis} onKpiClick={handleKpiClick} />
      </motion.div>

      <ContasReceberConteudoConteudo2
        filterType={filterType}
        handleFilterChange={handleFilterChange}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        handleStatusChange={handleStatusChange}
        centroCustoFilter={centroCustoFilter}
        handleCentroCustoChange={handleCentroCustoChange}
        centrosCusto={centrosCusto}
        empresaFilter={empresaFilter}
        handleEmpresaChange={handleEmpresaChange}
        empresas={empresas}
        formaFilter={formaFilter}
        handleFormaChange={handleFormaChange}
        contaBancariaFilter={contaBancariaFilter}
        handleContaBancariaChange={handleContaBancariaChange}
        contasBancarias={contasBancarias}
        advancedFilters={advancedFilters}
        setAdvancedFilters={setAdvancedFilters}
      />

      <ContasReceberConteudoConteudo
        viewMode={viewMode}
        sortedContas={sortedContas}
        handleViewConta={handleViewConta}
        isLoading={isLoading}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        setCurrentPage={setCurrentPage}
        handlePageSizeChange={handlePageSizeChange}
        isAllSelected={isAllSelected}
        selectAll={selectAll}
        sortKey={sortKey}
        sortDirection={sortDirection}
        handleSort={handleSort}
        empresas={empresas}
        colCount={colCount}
        contas={contas}
        setFormOpen={setFormOpen}
        isSelected={isSelected}
        toggleSelect={toggleSelect}
        setEditingConta={setEditingConta}
        handleOpenDeleteDialog={handleOpenDeleteDialog}
        setSelectedConta={setSelectedConta}
        setRecebimentoDialogOpen={setRecebimentoDialogOpen}
        handleEnviarCobranca={handleEnviarCobranca}
        handleAplicarDesconto={handleAplicarDesconto}
      />

      <ContaReceberForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingConta(null);
        }}
        conta={editingConta as unknown as React.ComponentProps<typeof ContaReceberForm>['conta']}
      />
      <RegistrarRecebimentoDialog
        conta={
          selectedConta && {
            ...selectedConta,
            cliente_nome: selectedConta.cliente_nome ?? '',
            status: selectedConta.status ?? '',
          }
        }
        open={recebimentoDialogOpen}
        onOpenChange={setRecebimentoDialogOpen}
      />
      <ContasReceberConteudoConteudo3
        detailConta={detailConta}
        detailDrawerOpen={detailDrawerOpen}
        setDetailDrawerOpen={setDetailDrawerOpen}
        setEditingConta={setEditingConta}
        setFormOpen={setFormOpen}
        setSelectedConta={setSelectedConta}
        setRecebimentoDialogOpen={setRecebimentoDialogOpen}
        handleEnviarCobranca={handleEnviarCobranca}
      />
      <EnviarCobrancaDialog
        conta={
          cobrancaConta && {
            ...cobrancaConta,
            cliente_nome: cobrancaConta.cliente_nome ?? '',
            status: cobrancaConta.status ?? '',
          }
        }
        open={cobrancaDialogOpen}
        onOpenChange={setCobrancaDialogOpen}
      />
      <AplicarDescontoDialog
        conta={
          descontoConta && { ...descontoConta, cliente_nome: descontoConta.cliente_nome ?? '' }
        }
        open={descontoDialogOpen}
        onOpenChange={setDescontoDialogOpen}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Exclusão Irreversível"
        description={`Confirmar a remoção definitiva do título "${deletingConta?.descricao}" (${deletingConta?.valor ? formatCurrency(deletingConta.valor) : ''}) do repositório?`}
        confirmLabel="Confirmar Exclusão"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConta}
      />
      <BaixaAutomaticaDialog
        open={baixaDialogOpen}
        onOpenChange={setBaixaDialogOpen}
        empresaId={empresaFilter !== 'all' ? empresaFilter : ''}
      />
      <WebhookConfigDialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen} />
      <BulkActionsBar
        selectedCount={selectedCount}
        isProcessing={isProcessing}
        progress={progress}
        actions={bulkActions}
        onClear={clearSelection}
      />
    </motion.div>
  );
}
