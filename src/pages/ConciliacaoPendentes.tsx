import { CheckCircle2, AlertTriangle, Search, Brain, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { SugestoesMatchIA } from '@/components/conciliacao/SugestoesMatchIA';
import type { ConciliacaoSort } from '@/components/conciliacao/conciliacao-toolbar.constants';
import type { SavedFilterPayload } from '@/hooks/useSavedFilters';
import type { ConciliacaoFilterState } from '@/components/conciliacao/ConciliacaoFilters';
import { ConciliacaoToolbarHost } from './ConciliacaoToolbarHost';
import { ConciliacaoPendentesConteudo } from './ConciliacaoPendentesConteudo';

import type { Dispatch, SetStateAction } from 'react';
import type { TransacaoExtrato } from '@/hooks/conciliacaoPage.types';
import type { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';
interface ConciliacaoPendentesProps {
  statusTab: string;
  setStatusTab: import('react').Dispatch<import('react').SetStateAction<string>>;
  pendentes: number;
  conciliadas: number;
  searchTerm: string;
  setSearchTerm: import('react').Dispatch<import('react').SetStateAction<string>>;
  filters: ConciliacaoFilterState;
  setFilters: import('react').Dispatch<import('react').SetStateAction<ConciliacaoFilterState>>;
  sort: ConciliacaoSort;
  setSort: import('react').Dispatch<import('react').SetStateAction<ConciliacaoSort>>;
  visibleCols: string[];
  setVisibleCols: import('react').Dispatch<import('react').SetStateAction<string[]>>;
  activePresetId: string | null;
  handleLoadPreset: (preset: {
    id: string;
    payload: SavedFilterPayload<ConciliacaoFilterState>;
  }) => void;
  handleClearPreset: () => void;
  showSugestoesFila: boolean;
  transacoesImportadas: import('@/lib/ofx-parser').TransacaoOFX[];
  lancamentosSistema: import('@/lib/transaction-matcher').LancamentoSistema[];
  handleConfirmarMatch: (
    transacaoId: string,
    lancamentoId: string,
    tipo: 'pagar' | 'receber'
  ) => Promise<void>;
  handleRejeitarMatch: (transacaoId: string, _lancamentoId: string) => void;
  handleConciliarManual: (transacaoId: string) => void;
  selectedIds: Set<string>;
  filteredTransacoes: import('@/lib/conciliacao-page-helpers').TransacaoImportada[];
  toggleSelectAll: () => void;
  sortedTransacoes: import('@/lib/conciliacao-page-helpers').TransacaoImportada[];
  toggleSelect: (id: string) => void;
  showCol: (key: string) => boolean;
  handleConciliar: (transacao: import('@/hooks/conciliacaoPage.types').TransacaoExtrato) => void;
  setSelectedTransacaoManual: Dispatch<SetStateAction<TransacaoExtrato | null>>;
  setShowManualDialog: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  setSelectedTransacaoSplit: Dispatch<SetStateAction<TransacaoExtrato | null>>;
  setShowSplitDialog: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  handleIgnorar: (id: string) => void;
  handleDesfazerConciliacao: (transacaoId: string) => Promise<void>;
  transacoesQuery: {
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: Error | null;
    refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TransacaoExtrato[], Error>>;
  };
}

export function ConciliacaoPendentes({
  statusTab,
  setStatusTab,
  pendentes,
  conciliadas,
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  sort,
  setSort,
  visibleCols,
  setVisibleCols,
  activePresetId,
  handleLoadPreset,
  handleClearPreset,
  showSugestoesFila,
  transacoesImportadas,
  lancamentosSistema,
  handleConfirmarMatch,
  handleRejeitarMatch,
  handleConciliarManual,
  selectedIds,
  filteredTransacoes,
  toggleSelectAll,
  sortedTransacoes,
  toggleSelect,
  showCol,
  handleConciliar,
  setSelectedTransacaoManual,
  setShowManualDialog,
  setSelectedTransacaoSplit,
  setShowSplitDialog,
  handleIgnorar,
  handleDesfazerConciliacao,
  transacoesQuery,
}: ConciliacaoPendentesProps) {
  return (
    <TabsContent value="conciliacao" className="space-y-4 mt-4">
      <Card className="card-base">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <Tabs value={statusTab} onValueChange={setStatusTab}>
              <TabsList>
                <TabsTrigger value="pendentes" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Pendentes
                  <Badge variant="secondary" className="ml-1">
                    {pendentes}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="conciliadas" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Conciliadas
                  <Badge variant="secondary" className="ml-1">
                    {conciliadas}
                  </Badge>
                </TabsTrigger>
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

      {showSugestoesFila && transacoesImportadas.length > 0 && lancamentosSistema.length > 0 && (
        <SugestoesMatchIA
          transacoes={transacoesImportadas}
          lancamentos={lancamentosSistema}
          onConfirmarMatch={handleConfirmarMatch}
          onRejeitarMatch={handleRejeitarMatch}
          onConciliarManual={handleConciliarManual}
        />
      )}

      {statusTab === 'pendentes' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={
                selectedIds.size > 0 &&
                selectedIds.size === filteredTransacoes.filter((t) => !t.conciliada).length
              }
              onChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0 ? `${selectedIds.size} selecionadas` : 'Selecionar todas'}
            </span>
          </div>

          <div className="flex items-center gap-3 bg-accent/5 px-3 py-1.5 rounded-full border border-accent/20">
            <div className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-accent" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                Confiança Alpha IA
              </span>
            </div>
            <div className="h-2 w-24 bg-accent/20 rounded-full overflow-hidden">
              <div className="h-full bg-accent animate-pulse" style={{ width: '94%' }} />
            </div>
            <span className="text-[10px] font-bold text-accent">94%</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <ConciliacaoPendentesConteudo
          sortedTransacoes={sortedTransacoes}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          showCol={showCol}
          handleConciliar={handleConciliar}
          setSelectedTransacaoManual={setSelectedTransacaoManual}
          setShowManualDialog={setShowManualDialog}
          setSelectedTransacaoSplit={setSelectedTransacaoSplit}
          setShowSplitDialog={setShowSplitDialog}
          handleIgnorar={handleIgnorar}
          handleDesfazerConciliacao={handleDesfazerConciliacao}
        />

        {transacoesQuery.isLoading && (
          <div className="space-y-2" role="status" aria-live="polite">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-3xl" />
            ))}
          </div>
        )}

        {!transacoesQuery.isLoading && transacoesQuery.isError && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-background/40 rounded-3xl border border-dashed border-destructive/30">
            <AlertTriangle className="h-12 w-12 mb-4 text-destructive/60" />
            <p className="text-lg font-medium text-destructive">
              Erro ao carregar transações bancárias
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Verifique sua conexão e tente novamente.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => transacoesQuery.refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        )}

        {!transacoesQuery.isLoading &&
          !transacoesQuery.isError &&
          sortedTransacoes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background/40 rounded-3xl border border-dashed border-white/10">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhuma transação encontrada</p>
              <p className="text-sm">Ajuste os filtros ou importe um novo extrato</p>
            </div>
          )}
      </div>
    </TabsContent>
  );
}
