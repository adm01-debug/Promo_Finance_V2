import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Link2,
  BarChart3,
  Zap,
  History,
  Keyboard,
  Database,
  Clock,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DivergenciasConciliacaoPanel } from '@/components/conciliacao/DivergenciasConciliacaoPanel';
import { ConciliacaoRetroativaPanel } from '@/components/conciliacao/ConciliacaoRetroativaPanel';
import { ConciliacaoAuditPanel } from '@/components/conciliacao/ConciliacaoAuditPanel';
import { ConfiguracaoConciliacaoPanel } from '@/components/conciliacao/ConfiguracaoConciliacaoPanel';
import { MainLayout } from '@/components/layout/MainLayout';
import { ConciliacaoManualDialog } from '@/components/conciliacao/ConciliacaoManualDialog';
import { ConciliacaoSplitDialog } from '@/components/conciliacao/ConciliacaoSplitDialog';
import { RelatorioImportacaoDialog } from '@/components/conciliacao/RelatorioImportacaoDialog';
import { ConciliacaoDashboard } from '@/components/conciliacao/ConciliacaoDashboard';
import { RegrasConciliacaoPanel } from '@/components/conciliacao/RegrasConciliacaoPanel';
import {
  CONCILIACAO_COLUMNS,
  CONCILIACAO_DEFAULT_SORT,
  CONCILIACAO_DEFAULT_VISIBLE,
  type ConciliacaoSort,
} from '@/components/conciliacao/conciliacao-toolbar.constants';
import { mergeLockedColumns } from '@/components/shared/ColumnVisibilityMenu.utils';
import { useSavedFilters, type SavedFilterPayload } from '@/hooks/useSavedFilters';
import { useSavedFilterAlertsConciliacao } from '@/hooks/useSavedFilterAlerts';
import type { ConciliacaoFilterState } from '@/components/conciliacao/ConciliacaoFilters';
import { useEffect, useMemo, useState } from 'react';
import { ExtratoBancarioPanel } from '@/components/conciliacao/ExtratoBancarioPanel';
import { SessoesConciliacaoPanel } from '@/components/conciliacao/SessoesConciliacaoPanel';
import { useConciliacaoPage } from '@/hooks/useConciliacaoPage';
import { useHighlightFromUrl } from '@/hooks/useHighlightFromUrl';
import { containerVariants, itemVariants } from './conciliacao-variants';
import { ConciliacaoIgnorarDialogs } from './ConciliacaoIgnorarDialogs';
import { ConciliacaoPageHeader } from './ConciliacaoPageHeader';
import { ConciliacaoConteudo } from './ConciliacaoConteudo';
import { ConciliacaoBulkActionsBar } from './ConciliacaoBulkActionsBar';
import { ConciliacaoPendentes } from './ConciliacaoPendentes';

export default function Conciliacao() {
  const {
    mainTab,
    setMainTab,
    statusTab,
    setStatusTab,
    selectedBanco,
    searchTerm,
    setSearchTerm,
    showImportDialog,
    setShowImportDialog,
    showManualDialog,
    setShowManualDialog,
    showSplitDialog,
    setShowSplitDialog,
    selectedTransacaoManual,
    setSelectedTransacaoManual,
    selectedTransacaoSplit,
    setSelectedTransacaoSplit,
    transacoesQuery,
    transacoesImportadas,
    filters,
    setFilters,
    selectedIds,
    setSelectedIds,
    showReportDialog,
    setShowReportDialog,
    importReport,
    lancamentosSistema,
    filteredTransacoes,
    exportData,
    totalTransacoes,
    conciliadas,
    pendentes,
    percentualConciliado,
    showSugestoesFila,
    setShowSugestoesFila,
    handleImportSuccess,
    handleConfirmarMatch,
    handleRejeitarMatch,
    handleConciliarManual,
    handleManualSuccess,
    handleSplitSuccess,
    handleConciliar,
    handleIgnorar,
    confirmarIgnorar,
    ignorarDialogOpen,
    setIgnorarDialogOpen,
    isIgnorando,
    handleBulkConciliar,
    handleBulkIgnorar,
    confirmarBulkIgnorar,
    bulkIgnorarDialogOpen,
    setBulkIgnorarDialogOpen,
    isBulkIgnorando,
    toggleSelect,
    toggleSelectAll,
    handleDesfazerConciliacao,
  } = useConciliacaoPage();

  // Saved filter presets / sort / column visibility
  const { defaultFilter } = useSavedFilters<ConciliacaoFilterState>('conciliacao_transacoes');
  // Notifica em tempo real quando uma nova transação cai dentro de um preset assinado
  useSavedFilterAlertsConciliacao();
  const [sort, setSort] = useState<ConciliacaoSort>(CONCILIACAO_DEFAULT_SORT);
  const [visibleCols, setVisibleCols] = useState<string[]>(CONCILIACAO_DEFAULT_VISIBLE);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (bootstrapped || !defaultFilter) return;
    const p = defaultFilter.filters;
    if (p?.filters) setFilters(p.filters);
    if (p?.sort) setSort(p.sort as ConciliacaoSort);
    if (p?.columns) setVisibleCols(mergeLockedColumns(p.columns, CONCILIACAO_COLUMNS));
    setActivePresetId(defaultFilter.id);
    setBootstrapped(true);
  }, [defaultFilter, bootstrapped, setFilters]);

  const handleLoadPreset = (preset: {
    id: string;
    payload: SavedFilterPayload<ConciliacaoFilterState>;
  }) => {
    if (preset.payload.filters) setFilters(preset.payload.filters);
    if (preset.payload.sort) setSort(preset.payload.sort as ConciliacaoSort);
    if (preset.payload.columns)
      setVisibleCols(mergeLockedColumns(preset.payload.columns, CONCILIACAO_COLUMNS));
    setActivePresetId(preset.id);
  };
  const handleClearPreset = () => setActivePresetId(null);

  const sortedTransacoes = useMemo(() => {
    const arr = [...filteredTransacoes];
    const dir = sort.dir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sort.key) {
        case 'data':
          return (new Date(a.data).getTime() - new Date(b.data).getTime()) * dir;
        case 'valor':
          return (a.valor - b.valor) * dir;
        case 'descricao':
          return a.descricao.localeCompare(b.descricao, 'pt-BR') * dir;
        case 'tipo':
          return a.tipo.localeCompare(b.tipo) * dir;
        default:
          return 0;
      }
    });
    return arr;
  }, [filteredTransacoes, sort]);

  const showCol = (key: string) => visibleCols.includes(key);

  useHighlightFromUrl('txId', sortedTransacoes.length > 0);

  return (
    <MainLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Page Header */}
        <ConciliacaoPageHeader
          setShowSugestoesFila={setShowSugestoesFila}
          showSugestoesFila={showSugestoesFila}
          transacoesImportadas={transacoesImportadas}
          exportData={exportData}
          filters={filters}
          setShowImportDialog={setShowImportDialog}
          showImportDialog={showImportDialog}
          handleImportSuccess={handleImportSuccess}
          selectedBanco={selectedBanco}
        />

        {/* Global Progress Bar */}
        {totalTransacoes > 0 && (
          <ConciliacaoConteudo
            percentualConciliado={percentualConciliado}
            conciliadas={conciliadas}
            totalTransacoes={totalTransacoes}
            pendentes={pendentes}
          />
        )}

        {/* Main Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={mainTab} onValueChange={setMainTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="conciliacao" className="gap-2">
                <Link2 className="h-4 w-4" />
                Conciliação
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="regras" className="gap-2 relative">
                <Zap className="h-4 w-4" />
                Regras
                <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-primary text-[8px]">
                  New
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="extrato" className="gap-2">
                <Database className="h-4 w-4" />
                Extrato
              </TabsTrigger>
              <TabsTrigger value="sessoes" className="gap-2">
                <History className="h-4 w-4" />
                Sessões
              </TabsTrigger>
              <TabsTrigger value="divergencias" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Divergências
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="gap-2">
                <Shield className="h-4 w-4" />
                Auditoria
              </TabsTrigger>
              <TabsTrigger value="retroativo" className="gap-2">
                <Clock className="h-4 w-4" />
                Retroativo
              </TabsTrigger>
              <TabsTrigger value="configuracoes" className="gap-2">
                <Keyboard className="h-4 w-4" />
                Ajustes
              </TabsTrigger>
            </TabsList>

            <ConciliacaoPendentes
              statusTab={statusTab}
              setStatusTab={setStatusTab}
              pendentes={pendentes}
              conciliadas={conciliadas}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filters={filters}
              setFilters={setFilters}
              sort={sort}
              setSort={setSort}
              visibleCols={visibleCols}
              setVisibleCols={setVisibleCols}
              activePresetId={activePresetId}
              handleLoadPreset={handleLoadPreset}
              handleClearPreset={handleClearPreset}
              showSugestoesFila={showSugestoesFila}
              transacoesImportadas={transacoesImportadas}
              lancamentosSistema={lancamentosSistema}
              handleConfirmarMatch={handleConfirmarMatch}
              handleRejeitarMatch={handleRejeitarMatch}
              handleConciliarManual={handleConciliarManual}
              selectedIds={selectedIds}
              filteredTransacoes={filteredTransacoes}
              toggleSelectAll={toggleSelectAll}
              sortedTransacoes={sortedTransacoes}
              toggleSelect={toggleSelect}
              showCol={showCol}
              handleConciliar={handleConciliar}
              setSelectedTransacaoManual={setSelectedTransacaoManual}
              setShowManualDialog={setShowManualDialog}
              setSelectedTransacaoSplit={setSelectedTransacaoSplit}
              setShowSplitDialog={setShowSplitDialog}
              handleIgnorar={handleIgnorar}
              handleDesfazerConciliacao={handleDesfazerConciliacao}
              transacoesQuery={transacoesQuery}
            />

            <TabsContent value="dashboard" className="mt-4">
              <ConciliacaoDashboard />
            </TabsContent>
            <TabsContent value="regras" className="mt-4">
              <RegrasConciliacaoPanel />
            </TabsContent>
            <TabsContent value="extrato" className="mt-4">
              <ExtratoBancarioPanel contaBancariaId={selectedBanco} />
            </TabsContent>
            <TabsContent value="sessoes" className="mt-4">
              <SessoesConciliacaoPanel />
            </TabsContent>
            <TabsContent value="divergencias" className="mt-4">
              <DivergenciasConciliacaoPanel />
            </TabsContent>
            <TabsContent value="auditoria" className="mt-4">
              <ConciliacaoAuditPanel />
            </TabsContent>
            <TabsContent value="retroativo" className="mt-4">
              <ConciliacaoRetroativaPanel />
            </TabsContent>
            <TabsContent value="configuracoes" className="mt-4">
              <ConfiguracaoConciliacaoPanel />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      {/* Bulk Actions Bar */}
      <ConciliacaoBulkActionsBar
        selectedIds={selectedIds}
        handleBulkConciliar={handleBulkConciliar}
        handleBulkIgnorar={handleBulkIgnorar}
        setSelectedIds={setSelectedIds}
      />

      {/* Dialogs */}
      <ConciliacaoManualDialog
        open={showManualDialog}
        onOpenChange={setShowManualDialog}
        transacao={selectedTransacaoManual}
        lancamentos={lancamentosSistema}
        onSuccess={handleManualSuccess}
      />
      <ConciliacaoSplitDialog
        open={showSplitDialog}
        onOpenChange={setShowSplitDialog}
        transacao={selectedTransacaoSplit}
        lancamentos={lancamentosSistema}
        onSuccess={() => {
          if (selectedTransacaoSplit) handleSplitSuccess(selectedTransacaoSplit.id);
        }}
      />
      <RelatorioImportacaoDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        report={importReport}
        onIrParaConciliacao={() => {
          setShowReportDialog(false);
          setMainTab('conciliacao');
          setStatusTab('pendentes');
        }}
      />
      <ConciliacaoIgnorarDialogs
        ignorarDialogOpen={ignorarDialogOpen}
        setIgnorarDialogOpen={setIgnorarDialogOpen}
        isIgnorando={isIgnorando}
        confirmarIgnorar={confirmarIgnorar}
        bulkIgnorarDialogOpen={bulkIgnorarDialogOpen}
        setBulkIgnorarDialogOpen={setBulkIgnorarDialogOpen}
        isBulkIgnorando={isBulkIgnorando}
        confirmarBulkIgnorar={confirmarBulkIgnorar}
        selectedCount={selectedIds.size}
      />
    </MainLayout>
  );
}
