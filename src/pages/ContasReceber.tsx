import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  Zap,
  Settings,
  RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportMenu } from '@/components/ui/export-menu';
import { MainLayout } from '@/components/layout/MainLayout';
import { useContasReceberLogic } from '@/hooks/useContasReceberLogic';
import { useHighlightFromUrl } from '@/hooks/useHighlightFromUrl';
import { contasReceberColumns } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import { BankAccountSwitcher } from '@/components/financeiro/BankAccountSwitcher';
import { deveAbrirNovoRegistro } from '@/lib/navigation-intent';
import { ContasReceberConteudo } from './ContasReceberConteudo';

export default function ContasReceber() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    searchTerm,
    statusFilter,
    centroCustoFilter,
    empresaFilter,
    formaFilter,
    contaBancariaFilter,
    handleContaBancariaChange,
    formOpen,
    recebimentoDialogOpen,
    selectedConta,
    editingConta,
    advancedFilters,
    currentPage,
    pageSize,
    deleteDialogOpen,
    deletingConta,
    isDeleting,
    isLoading,
    filterType,
    viewMode,
    detailDrawerOpen,
    detailConta,
    cobrancaDialogOpen,
    cobrancaConta,
    descontoDialogOpen,
    descontoConta,
    contas,
    sortedContas,
    centrosCusto,
    empresas,
    contasBancarias,
    totalCount,
    totalPages,
    kpis,
    sortKey,
    sortDirection,
    handleSearchChange,
    handleStatusChange,
    handleCentroCustoChange,
    handleEmpresaChange,
    handleFormaChange,
    handlePageSizeChange,
    handleSort,
    handleOpenDeleteDialog,
    handleDeleteConta,
    handleFilterChange,
    handleBulkMarkAsReceived,
    handleBulkCancel,
    handleViewConta,
    handleEnviarCobranca,
    handleKpiClick,
    handleAplicarDesconto,
    handleSyncStages,
    setFormOpen,
    setRecebimentoDialogOpen,
    setSelectedConta,
    setEditingConta,
    setAdvancedFilters,
    setCurrentPage,
    setDeleteDialogOpen,
    setViewMode,
    setDetailDrawerOpen,
    setCobrancaDialogOpen,
    setDescontoDialogOpen,
    selectedCount,
    isProcessing,
    progress,
    isSelected,
    isAllSelected,
    selectAll,
    toggleSelect,
    clearSelection,
    baixaDialogOpen,
    setBaixaDialogOpen,
    webhookDialogOpen,
    setWebhookDialogOpen,
  } = useContasReceberLogic();

  useHighlightFromUrl('highlight', (sortedContas?.length ?? 0) > 0);

  useEffect(() => {
    if (!deveAbrirNovoRegistro(location.state)) return;

    setEditingConta(null);
    setFormOpen(true);
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null }
    );
  }, [
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigate,
    setEditingConta,
    setFormOpen,
  ]);

  const bulkActions = [
    {
      id: 'mark-received',
      label: 'Marcar como Recebido',
      icon: <CheckCircle2 className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: handleBulkMarkAsReceived,
    },
    {
      id: 'cancel',
      label: 'Cancelar',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: handleBulkCancel,
      confirm: {
        title: `Cancelar ${selectedCount} conta(s) a receber`,
        description: `Esta ação marca ${selectedCount} conta(s) selecionada(s) como cancelada(s) e não pode ser desfeita automaticamente.`,
        confirmLabel: 'Cancelar contas',
      },
    },
  ];

  const colCount = 9 + (empresas.length > 1 ? 1 : 0) + 1;

  const headerActions = (
    <>
      <div className="hidden lg:flex items-center gap-3 pr-3 border-r border-white/10">
        <BankAccountSwitcher />
      </div>
      <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 shadow-inner">
        <Button
          variant={viewMode === 'table' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setViewMode('table')}
          className={cn(
            'h-10 w-10 rounded-lg transition-all',
            viewMode === 'table' ? 'bg-card text-primary shadow-lg' : 'text-muted-foreground'
          )}
        >
          <TableIcon className="h-5 w-5" />
        </Button>
        <Button
          variant={viewMode === 'kanban' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setViewMode('kanban')}
          className={cn(
            'h-10 w-10 rounded-lg transition-all',
            viewMode === 'kanban' ? 'bg-card text-primary shadow-lg' : 'text-muted-foreground'
          )}
        >
          <LayoutGrid className="h-5 w-5" />
        </Button>
      </div>

      <div className="w-px h-8 bg-card/10 mx-2" />

      <div className="flex items-center gap-3">
        <ExportMenu
          data={sortedContas}
          columns={contasReceberColumns}
          filename="contas_receber"
          title="Relatório de Contas a Receber"
          empresa={empresas.find((e) => e.id === empresaFilter)}
          kpis={kpis}
        />
        <Button
          variant="outline"
          size="lg"
          className="premium-button bg-transparent border-blue-500/20 text-blue-500"
          onClick={handleSyncStages}
        >
          <RefreshCcw className="h-5 w-5" /> Sincronizar Régua
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="premium-button bg-transparent border-primary/20 text-primary"
          onClick={() => setBaixaDialogOpen(true)}
        >
          <Zap className="h-5 w-5" /> Baixa Automática
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="premium-button bg-transparent border-white/5 w-12 h-12"
          onClick={() => setWebhookDialogOpen(true)}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button size="lg" className="premium-button" onClick={() => setFormOpen(true)}>
          <Plus className="h-5 w-5" /> Novo Comando
        </Button>
      </div>
    </>
  );

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px] animate-pulse"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute top-[30%] right-[10%] w-[35%] h-[35%] rounded-full bg-purple-500/5 blur-[120px] animate-pulse"
            style={{ animationDelay: '4s' }}
          />
        </div>

        <ContasReceberConteudo
          headerActions={headerActions}
          kpis={kpis}
          handleKpiClick={handleKpiClick}
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
          formOpen={formOpen}
          editingConta={editingConta}
          selectedConta={selectedConta}
          recebimentoDialogOpen={recebimentoDialogOpen}
          detailConta={detailConta}
          detailDrawerOpen={detailDrawerOpen}
          setDetailDrawerOpen={setDetailDrawerOpen}
          cobrancaConta={cobrancaConta}
          cobrancaDialogOpen={cobrancaDialogOpen}
          setCobrancaDialogOpen={setCobrancaDialogOpen}
          descontoConta={descontoConta}
          descontoDialogOpen={descontoDialogOpen}
          setDescontoDialogOpen={setDescontoDialogOpen}
          deleteDialogOpen={deleteDialogOpen}
          setDeleteDialogOpen={setDeleteDialogOpen}
          deletingConta={deletingConta}
          isDeleting={isDeleting}
          handleDeleteConta={handleDeleteConta}
          baixaDialogOpen={baixaDialogOpen}
          setBaixaDialogOpen={setBaixaDialogOpen}
          webhookDialogOpen={webhookDialogOpen}
          setWebhookDialogOpen={setWebhookDialogOpen}
          selectedCount={selectedCount}
          isProcessing={isProcessing}
          progress={progress}
          bulkActions={bulkActions}
          clearSelection={clearSelection}
        />
      </div>
    </MainLayout>
  );
}
