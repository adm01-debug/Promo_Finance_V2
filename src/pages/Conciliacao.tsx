import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, CheckCircle2, AlertTriangle, Search,
  SplitSquareHorizontal, Link2, Unlink, Calendar,
  TrendingUp, TrendingDown, Check, MoreHorizontal,
  BarChart3, Zap, History, Keyboard, Database, Clock,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DivergenciasConciliacaoPanel } from '@/components/conciliacao/DivergenciasConciliacaoPanel';
import { ConciliacaoRetroativaPanel } from '@/components/conciliacao/ConciliacaoRetroativaPanel';
import { ConciliacaoAuditPanel } from '@/components/conciliacao/ConciliacaoAuditPanel';
import { ConfiguracaoConciliacaoPanel } from '@/components/conciliacao/ConfiguracaoConciliacaoPanel';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { ImportarExtratoDialog } from '@/components/conciliacao/ImportarExtratoDialog';
import { SugestoesMatchIA } from '@/components/conciliacao/SugestoesMatchIA';
import { ConciliacaoManualDialog } from '@/components/conciliacao/ConciliacaoManualDialog';
import { ConciliacaoSplitDialog } from '@/components/conciliacao/ConciliacaoSplitDialog';
import { RelatorioImportacaoDialog } from '@/components/conciliacao/RelatorioImportacaoDialog';
import { ConciliacaoDashboard } from '@/components/conciliacao/ConciliacaoDashboard';
import { RegrasConciliacaoPanel } from '@/components/conciliacao/RegrasConciliacaoPanel';
import { ConciliacaoFilters } from '@/components/conciliacao/ConciliacaoFilters';
import { ConciliacaoToolbar, CONCILIACAO_COLUMNS, CONCILIACAO_DEFAULT_SORT, CONCILIACAO_DEFAULT_VISIBLE, type ConciliacaoSort } from '@/components/conciliacao/ConciliacaoToolbar';
import { mergeLockedColumns } from '@/components/shared/ColumnVisibilityMenu';
import { useSavedFilters, type SavedFilterPayload } from '@/hooks/useSavedFilters';
import { useSavedFilterAlertsConciliacao } from '@/hooks/useSavedFilterAlerts';
import type { ConciliacaoFilterState } from '@/components/conciliacao/ConciliacaoFilters';
import { useEffect, useMemo, useState } from 'react';
import { ConciliacaoExport } from '@/components/conciliacao/ConciliacaoExport';
import { ExtratoBancarioPanel } from '@/components/conciliacao/ExtratoBancarioPanel';
import { SessoesConciliacaoPanel } from '@/components/conciliacao/SessoesConciliacaoPanel';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { useConciliacaoPage } from '@/hooks/useConciliacaoPage';
import { useHighlightFromUrl } from '@/hooks/useHighlightFromUrl';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } } as const;
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } } as const;

function ConciliacaoToolbarHost({
  searchTerm, setSearchTerm, filters, setFilters, sort, setSort, visibleCols, setVisibleCols,
  activePresetId, onLoadPreset, onClearPreset,
}: {
  searchTerm: string; setSearchTerm: (v: string) => void;
  filters: ConciliacaoFilterState; setFilters: (f: ConciliacaoFilterState) => void;
  sort: ConciliacaoSort; setSort: (s: ConciliacaoSort) => void;
  visibleCols: string[]; setVisibleCols: (c: string[]) => void;
  activePresetId: string | null;
  onLoadPreset: (p: { id: string; payload: SavedFilterPayload<ConciliacaoFilterState> }) => void;
  onClearPreset: () => void;
}) {
  return (
    <ConciliacaoToolbar
      searchTerm={searchTerm} onSearchChange={setSearchTerm}
      filters={filters} onFiltersChange={setFilters}
      sort={sort} onSortChange={setSort}
      visibleCols={visibleCols} onVisibleColsChange={setVisibleCols}
      activePresetId={activePresetId} onLoadPreset={onLoadPreset} onClearPreset={onClearPreset}
    />
  );
}

export default function Conciliacao() {
  const {
    mainTab, setMainTab, statusTab, setStatusTab,
    selectedBanco, setSelectedBanco, searchTerm, setSearchTerm,
    showImportDialog, setShowImportDialog,
    showManualDialog, setShowManualDialog,
    showSplitDialog, setShowSplitDialog,
    selectedTransacaoManual, selectedTransacaoSplit,
    transacoesImportadas,
    filters, setFilters, selectedIds,
    showReportDialog, setShowReportDialog,
    importReport,
    contasBancarias, lancamentosSistema,
    filteredTransacoes, exportData,
    totalTransacoes, conciliadas, pendentes, percentualConciliado,
    handleImportSuccess, handleConfirmarMatch, handleRejeitarMatch,
    handleConciliarManual, handleConciliarSplit, handleManualSuccess,
    handleConciliar, handleIgnorar,
    handleBulkConciliar, handleBulkIgnorar,
    toggleSelect, toggleSelectAll,
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

  const handleLoadPreset = (preset: { id: string; payload: SavedFilterPayload<ConciliacaoFilterState> }) => {
    if (preset.payload.filters) setFilters(preset.payload.filters);
    if (preset.payload.sort) setSort(preset.payload.sort as ConciliacaoSort);
    if (preset.payload.columns) setVisibleCols(mergeLockedColumns(preset.payload.columns, CONCILIACAO_COLUMNS));
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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-display-md text-foreground">Conciliação Bancária</h1>
            <p className="text-muted-foreground mt-1">Reconcilie transações bancárias com lançamentos do sistema</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedBanco} onValueChange={setSelectedBanco}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
              <SelectContent>
                {(contasBancarias || []).map(conta => (
                  <SelectItem key={conta.id} value={conta.id}>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: conta.cor || '#3B82F6' }} />
                      {conta.banco} - {conta.conta}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ConciliacaoExport transacoes={exportData.transacoes} stats={exportData.stats} filters={filters} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={() => setShowImportDialog(true)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25">
                  <Upload className="h-4 w-4" />Importar Extrato
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="flex items-center gap-1"><Keyboard className="h-3 w-3" /> Ctrl+I</p></TooltipContent>
            </Tooltip>
            <ImportarExtratoDialog open={showImportDialog} onOpenChange={setShowImportDialog} onImportSuccess={handleImportSuccess} />
          </div>
        </motion.div>

        {/* Global Progress Bar */}
        {totalTransacoes > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="card-base border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Progresso da Conciliação</span>
                  <div className="flex items-center gap-3">
                    <Badge variant={percentualConciliado === 100 ? 'default' : 'secondary'} className={cn(percentualConciliado === 100 && "bg-success text-success-foreground")}>{percentualConciliado.toFixed(1)}%</Badge>
                    <span className="text-xs text-muted-foreground">{conciliadas}/{totalTransacoes} transações · {pendentes} pendentes</span>
                  </div>
                </div>
                <Progress value={percentualConciliado} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={mainTab} onValueChange={setMainTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="conciliacao" className="gap-2"><Link2 className="h-4 w-4" />Conciliação</TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-2"><BarChart3 className="h-4 w-4" />Dashboard</TabsTrigger>
              <TabsTrigger value="regras" className="gap-2"><Zap className="h-4 w-4" />Regras</TabsTrigger>
              <TabsTrigger value="extrato" className="gap-2"><Database className="h-4 w-4" />Extrato</TabsTrigger>
              <TabsTrigger value="sessoes" className="gap-2"><History className="h-4 w-4" />Sessões</TabsTrigger>
              <TabsTrigger value="divergencias" className="gap-2"><AlertTriangle className="h-4 w-4" />Divergências</TabsTrigger>
              <TabsTrigger value="auditoria" className="gap-2"><Shield className="h-4 w-4" />Auditoria</TabsTrigger>
              <TabsTrigger value="retroativo" className="gap-2"><Clock className="h-4 w-4" />Retroativo</TabsTrigger>
              <TabsTrigger value="configuracoes" className="gap-2"><Keyboard className="h-4 w-4" />Ajustes</TabsTrigger>
            </TabsList>

            <TabsContent value="conciliacao" className="space-y-4 mt-4">
              <Card className="card-base">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <Tabs value={statusTab} onValueChange={setStatusTab}>
                      <TabsList>
                        <TabsTrigger value="pendentes" className="gap-2"><AlertTriangle className="h-4 w-4" />Pendentes<Badge variant="secondary" className="ml-1">{pendentes}</Badge></TabsTrigger>
                        <TabsTrigger value="conciliadas" className="gap-2"><CheckCircle2 className="h-4 w-4" />Conciliadas<Badge variant="secondary" className="ml-1">{conciliadas}</Badge></TabsTrigger>
                        <TabsTrigger value="todas">Todas</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <ConciliacaoToolbarHost
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      filters={filters}
                      setFilters={setFilters}
                      sort={sort}
                      setSort={setSort}
                      visibleCols={visibleCols}
                      setVisibleCols={setVisibleCols}
                      activePresetId={activePresetId}
                      onLoadPreset={handleLoadPreset}
                      onClearPreset={handleClearPreset}
                    />
                  </div>
                </CardContent>
              </Card>

              {transacoesImportadas.length > 0 && lancamentosSistema.length > 0 && (
                <SugestoesMatchIA transacoes={transacoesImportadas} lancamentos={lancamentosSistema} onConfirmarMatch={handleConfirmarMatch} onRejeitarMatch={handleRejeitarMatch} onConciliarManual={handleConciliarManual} />
              )}

              {statusTab === 'pendentes' && filteredTransacoes.length > 0 && (
                <div className="flex items-center gap-3 px-1">
                  <Checkbox checked={selectedIds.size > 0 && selectedIds.size === filteredTransacoes.filter(t => !t.conciliada).length} onChange={toggleSelectAll} />
                  <span className="text-sm text-muted-foreground">{selectedIds.size > 0 ? `${selectedIds.size} selecionadas` : 'Selecionar todas'}</span>
                </div>
              )}

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {sortedTransacoes.map((transacao, index) => {
                    const isCredito = transacao.tipo === 'credito';
                    const isSelected = selectedIds.has(transacao.id);
                    return (
                      <motion.div key={transacao.id} data-highlight-id={transacao.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ delay: Math.min(index * 0.02, 0.3) }}>
                        <Card className={cn("card-base transition-all hover:shadow-md", transacao.conciliada && "opacity-70", isSelected && "ring-2 ring-primary/50 bg-primary/5")}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              {!transacao.conciliada && <Checkbox checked={isSelected} onChange={() => toggleSelect(transacao.id)} className="flex-shrink-0" />}
                              {showCol('tipo') && (
                                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", isCredito ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                                  {isCredito ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{transacao.descricao}</p>
                                {showCol('data') && (
                                  <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">{formatDate(transacao.data)}</span>
                                    </div>
                                    {transacao.compensacao_valor !== undefined && transacao.compensacao_valor !== 0 && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1 text-[10px] bg-primary/5 text-primary border border-primary/10 rounded px-1.5 py-0.5 w-fit cursor-help">
                                            <Zap className="h-3 w-3" />
                                            <span>Compensação: {formatCurrency(transacao.compensacao_valor)} ({transacao.compensacao_classificacao})</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="text-xs space-y-1">
                                            <p><strong>Regra:</strong> {transacao.compensacao_regra}</p>
                                            <p><strong>Motivo:</strong> {transacao.compensacao_motivo}</p>
                                            {transacao.compensacao_evidencia_url && (
                                              <a href={transacao.compensacao_evidencia_url} target="_blank" rel="noopener noreferrer" className="text-primary underline flex items-center gap-1 mt-1">
                                                Ver evidência <Link2 className="h-3 w-3" />
                                              </a>
                                            )}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                )}
                              </div>
                              <p className={cn("font-bold text-base whitespace-nowrap", isCredito ? "text-success" : "text-destructive")}>{isCredito ? '+' : ''}{formatCurrency(transacao.valor)}</p>
                              {transacao.conciliada && <Badge className="bg-success/10 text-success border-success/20 gap-1 flex-shrink-0"><CheckCircle2 className="h-3 w-3" />Conciliada</Badge>}
                              {!transacao.conciliada && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => handleConciliar(transacao.id)}><Check className="h-3.5 w-3.5" />Conciliar</Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem className="gap-2" onClick={() => handleConciliarManual(transacao.id)}><Link2 className="h-4 w-4" /> Vincular manualmente</DropdownMenuItem>
                                      <DropdownMenuItem className="gap-2" onClick={() => handleConciliarSplit(transacao.id)}><SplitSquareHorizontal className="h-4 w-4" /> Conciliação parcial</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleIgnorar(transacao.id)}><Unlink className="h-4 w-4" /> Ignorar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredTransacoes.length === 0 && (
                  <Card className="card-base">
                    <CardContent className="p-12 text-center">
                      {totalTransacoes === 0 ? (
                        <div className="space-y-4">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><Upload className="h-8 w-8 text-primary" /></div>
                          <div><h3 className="font-semibold text-lg">Comece importando um extrato</h3><p className="text-muted-foreground mt-1 max-w-md mx-auto">1. Selecione o banco acima → 2. Clique em "Importar Extrato" → 3. A IA analisa e sugere matches automaticamente</p></div>
                          <Button onClick={() => setShowImportDialog(true)} className="gap-2"><Upload className="h-4 w-4" /> Importar Extrato</Button>
                        </div>
                      ) : (
                        <div>
                          <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="h-8 w-8 text-success" /></div>
                          <h3 className="font-semibold text-lg">{statusTab === 'pendentes' ? 'Todas as transações foram conciliadas! 🎉' : 'Nenhuma transação encontrada'}</h3>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-6 mt-4">
              <ConciliacaoDashboard />
              {totalTransacoes > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="stat-card group"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted-foreground">Importação Atual</p><p className="text-2xl font-bold font-display mt-1">{totalTransacoes}</p><p className="text-xs text-muted-foreground mt-1">transações no lote</p></div><div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><FileText className="h-6 w-6" /></div></div></CardContent></Card>
                  <Card className="stat-card group"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted-foreground">Conciliadas (Lote)</p><p className="text-2xl font-bold font-display mt-1 text-success">{conciliadas}</p><Progress value={percentualConciliado} className="h-1.5 mt-2 w-24" /></div><div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center"><CheckCircle2 className="h-6 w-6" /></div></div></CardContent></Card>
                  <Card className="stat-card group border-warning/50"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted-foreground">Pendentes (Lote)</p><p className="text-2xl font-bold font-display mt-1 text-warning">{pendentes}</p><p className="text-xs text-muted-foreground mt-1">Aguardando</p></div><div className="h-12 w-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center"><AlertTriangle className="h-6 w-6" /></div></div></CardContent></Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="regras" className="mt-4"><RegrasConciliacaoPanel /></TabsContent>
            <TabsContent value="extrato" className="mt-4"><ExtratoBancarioPanel contaBancariaId={selectedBanco || undefined} /></TabsContent>
            <TabsContent value="sessoes" className="mt-4"><SessoesConciliacaoPanel /></TabsContent>
            <TabsContent value="divergencias" className="mt-4"><DivergenciasConciliacaoPanel /></TabsContent>
            <TabsContent value="auditoria" className="mt-4"><ConciliacaoAuditPanel /></TabsContent>
            <TabsContent value="retroativo" className="mt-4"><ConciliacaoRetroativaPanel contaBancariaId={selectedBanco || undefined} /></TabsContent>
            <TabsContent value="configuracoes" className="mt-4"><ConfiguracaoConciliacaoPanel contaId={selectedBanco || undefined} /></TabsContent>
          </Tabs>
        </motion.div>

        {selectedIds.size > 0 && (
          <BulkActionsBar selectedCount={selectedIds.size} onClear={() => {}} actions={[
            { id: 'conciliar', label: `Conciliar (${selectedIds.size})`, icon: <Check className="h-4 w-4" />, onClick: handleBulkConciliar },
            { id: 'ignorar', label: 'Ignorar', icon: <Unlink className="h-4 w-4" />, variant: 'destructive' as const, onClick: handleBulkIgnorar },
          ]} />
        )}

        <ConciliacaoManualDialog open={showManualDialog} onOpenChange={setShowManualDialog} transacao={selectedTransacaoManual} lancamentos={lancamentosSistema} onSuccess={handleManualSuccess} />
        <ConciliacaoSplitDialog open={showSplitDialog} onOpenChange={setShowSplitDialog} transacao={selectedTransacaoSplit} lancamentos={lancamentosSistema} onSuccess={() => {}} />
        <RelatorioImportacaoDialog open={showReportDialog} onOpenChange={setShowReportDialog} report={importReport} onIrParaConciliacao={() => { setShowReportDialog(false); setMainTab('conciliacao'); setStatusTab('pendentes'); }} />
      </motion.div>
    </MainLayout>
  );
}
