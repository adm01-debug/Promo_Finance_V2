import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { useContasBancarias, useContasPagar, useContasReceber } from '@/hooks/useFinancialData';
import { useGlobalFinancialFilter } from '@/hooks/useGlobalFinancialFilter';
import { useConciliacao } from '@/hooks/useConciliacao';
import { supabase } from '@/integrations/supabase/client';
import {
  ConciliacaoFilterState,
  INITIAL_FILTERS,
} from '@/components/conciliacao/ConciliacaoFilters';
import { ExtratoOFX, TransacaoOFX } from '@/lib/ofx-parser';
import { encontrarTodosMatches, calcularEstatisticasMatch } from '@/lib/transaction-matcher';
import { type ImportReport } from '@/components/conciliacao/RelatorioImportacaoDialog';
import { toast } from 'sonner';
import {
  montarLancamentosSistema,
  carregarTransacoesBanco,
  buscarConfigConciliacao,
  aplicarConciliacoesAutomaticas,
  filtrarTransacoes,
  montarExportData,
} from '@/lib/conciliacao-page-helpers';

interface TransacaoExtrato {
  id: string;
  data: Date;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
  conciliada: boolean;
  compensacao_valor?: number;
  compensacao_motivo?: string;
  compensacao_classificacao?: string;
  compensacao_regra?: string;
  compensacao_evidencia_url?: string;
}

export function useConciliacaoPage() {
  const { currentBankAccountId } = useGlobalFinancialFilter();
  const [mainTab, setMainTab] = useState('conciliacao');
  const [statusTab, setStatusTab] = useState('pendentes');
  const [selectedBanco, setSelectedBanco] = useState<string>(currentBankAccountId || '');

  useEffect(() => {
    if (currentBankAccountId && selectedBanco !== currentBankAccountId) {
      setSelectedBanco(currentBankAccountId);
    }
  }, [currentBankAccountId, selectedBanco]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showSugestoesFila, setShowSugestoesFila] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [selectedTransacaoManual, setSelectedTransacaoManual] = useState<TransacaoExtrato | null>(
    null
  );
  const [selectedTransacaoSplit, setSelectedTransacaoSplit] = useState<TransacaoExtrato | null>(
    null
  );
  const [transacoes, setTransacoes] = useState<TransacaoExtrato[]>([]);
  const [extratoImportado, setExtratoImportado] = useState<ExtratoOFX | null>(null);
  const [transacoesImportadas, setTransacoesImportadas] = useState<TransacaoOFX[]>([]);
  const [filters, setFilters] = useState<ConciliacaoFilterState>(() => {
    const saved = localStorage.getItem('conciliacao_filters');
    return saved ? JSON.parse(saved) : INITIAL_FILTERS;
  });

  useEffect(() => {
    localStorage.setItem('conciliacao_filters', JSON.stringify(filters));
  }, [filters]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const { data: contasBancarias } = useContasBancarias();
  const { data: contasPagar } = useContasPagar();
  const { data: contasReceber } = useContasReceber();
  const { confirmarConciliacao, salvarExtratoBanco, desfazerConciliacao } = useConciliacao();

  // Carregar transações do banco ao selecionar conta
  useEffect(() => {
    if (!selectedBanco) {
      setTransacoes([]);
      return;
    }

    carregarTransacoesBanco(selectedBanco).then((rows) => {
      if (rows) setTransacoes(rows);
    });
  }, [selectedBanco]);

  const lancamentosSistema = useMemo(
    () => montarLancamentosSistema(contasPagar, contasReceber),
    [contasPagar, contasReceber]
  );

  const handleConciliarManual = useCallback(
    (transacaoId: string) => {
      const transacao = transacoes.find((t) => t.id === transacaoId);
      if (transacao) {
        setSelectedTransacaoManual(transacao);
        setShowManualDialog(true);
      }
    },
    [transacoes]
  );

  const handleImportSuccess = useCallback(
    async (extrato: ExtratoOFX) => {
      setIsProcessingImport(true);

      // Validação de Saldo e Auditoria (Melhorado)
      if (extrato.conta.saldoFinal !== undefined) {
        const saldoCalculado =
          (extrato.conta.saldoInicial || 0) +
          extrato.transacoes.reduce((acc, t) => acc + t.valor, 0);
        if (Math.abs(saldoCalculado - extrato.conta.saldoFinal) > 0.01) {
          toast.warning('Divergência de Saldo Detectada', {
            description: `O saldo final do arquivo (R$ ${extrato.conta.saldoFinal.toFixed(2)}) não bate com o calculado (R$ ${saldoCalculado.toFixed(2)}).`,
          });

          // Registrar divergência no banco para o painel de auditoria
          if (selectedBanco) {
            const { data: userData } = await supabase.auth.getUser();
            await supabase.from('divergencias_conciliacao').insert({
              conta_bancaria_id: selectedBanco,
              tipo_divergencia: 'saldo_final',
              descricao: `Divergência no extrato ${extrato.nomeArquivo} (Saldo OFX: ${extrato.conta.saldoFinal} vs Calculado: ${saldoCalculado})`,
              valor_divergencia: extrato.conta.saldoFinal - saldoCalculado,
              recomendacao: 'Revisar lançamentos faltantes no período ou saldo inicial informado.',
              resolvido_por: userData.user?.id,
            });

            // Adicionar alerta automático no sistema
            // TODO(2026-08-14): status/metadata removidos — não existem em alertas (types.ts canônico);
            // cast `as never` removido (anti-padrão)
            await supabase.from('alertas').insert({
              empresa_id: contasBancarias?.find((c) => c.id === selectedBanco)?.empresa_id,
              tipo: 'divergencia_conciliacao',
              prioridade: 'critica',
              titulo: 'Divergência de Saldo Bancário',
              mensagem: `O saldo final do extrato ${extrato.nomeArquivo} (R$ ${extrato.conta.saldoFinal.toFixed(2)}) não confere com o cálculo dos lançamentos. Diferença de R$ ${(extrato.conta.saldoFinal - saldoCalculado).toFixed(2)}.`,
            });
          }
        }
      }

      const novasTransacoes = extrato.transacoes.map((t: TransacaoOFX): TransacaoExtrato => ({
        id: t.id,
        data: t.data,
        descricao: t.descricao,
        valor: t.valor,
        tipo: t.tipo,
        conciliada: false,
      }));

      let savedCount = extrato.transacoes.length;
      let duplicateCount = 0;

      if (selectedBanco) {
        try {
          // TODO(2026-08-14): insert em extratos_bancarios_importados removido — colunas usadas
          // (nome_arquivo/hash_arquivo/total_transacoes/metadados) não existem no schema canônico;
          // a tabela existe no types.ts com outro schema (arquivo_origem/hash_transacao/importado_em),
          // então o insert original falharia com PGRST205 em runtime.

          const result = await salvarExtratoBanco.mutateAsync({
            extrato,
            contaBancariaId: selectedBanco,
          });
          savedCount = result.saved;
          duplicateCount = result.duplicates;
        } catch (err) {
          console.error('Failed to persist extrato:', err);
        }
      }

      const matches = encontrarTodosMatches(extrato.transacoes, lancamentosSistema);
      const estatisticas = calcularEstatisticasMatch(extrato.transacoes, matches);

      // Buscar configurações da conta
      const config = await buscarConfigConciliacao(selectedBanco);

      const { autoConciliadas, valorAutoConciliado, matchesAlta } =
        await aplicarConciliacoesAutomaticas({
          transacoes: extrato.transacoes,
          matches,
          config,
          novasTransacoes,
          confirmarConciliacao,
          selectedBanco,
          onResolverManual: handleConciliarManual,
        });

      setTransacoes((prev) => [...novasTransacoes, ...prev]);
      setTransacoesImportadas((prev) => [
        ...extrato.transacoes.filter((t) => {
          const s = matches.get(t.id);
          return !s || s.length === 0 || s[0].confianca !== 'alta';
        }),
        ...prev,
      ]);
      setExtratoImportado(extrato);

      const pendentesRevisao = extrato.transacoes.length - autoConciliadas - duplicateCount;
      const valorPendente = extrato.transacoes
        .filter((t) => {
          const s = matches.get(t.id);
          return !s || s.length === 0 || s[0].confianca !== 'alta';
        })
        .reduce((sum, t) => sum + Math.abs(t.valor), 0);

      setImportReport({
        totalImportadas: extrato.transacoes.length,
        totalSalvas: savedCount,
        totalDuplicadas: duplicateCount,
        autoConciliadas,
        pendentesRevisao: Math.max(0, pendentesRevisao),
        valorAutoConciliado,
        valorPendente,
        estatisticas,
        matchesAlta,
      });
      setShowReportDialog(true);
      setIsProcessingImport(false);
    },
    [
      selectedBanco,
      lancamentosSistema,
      salvarExtratoBanco,
      confirmarConciliacao,
      contasBancarias,
      handleConciliarManual,
    ]
  );

  const handleConfirmarMatch = useCallback(
    async (transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => {
      // Invariante de integridade: só atualiza estado local se a persistência confirmar.
      // Se a mutação falhar, mantém a transação em `transacoesImportadas` para nova tentativa.
      try {
        await confirmarConciliacao.mutateAsync({
          transacaoId,
          contaPagarId: tipo === 'pagar' ? lancamentoId : undefined,
          contaReceberId: tipo === 'receber' ? lancamentoId : undefined,
        });
        setTransacoes((prev) =>
          prev.map((t) => (t.id === transacaoId ? { ...t, conciliada: true } : t))
        );
        setTransacoesImportadas((prev) => prev.filter((t) => t.id !== transacaoId));
      } catch {
        // Toast já é exibido pelo onError da mutation em useConciliacao; não corrompemos o estado local.
      }
    },
    [confirmarConciliacao]
  );

  const handleRejeitarMatch = useCallback((transacaoId: string, _lancamentoId: string) => {
    setTransacoesImportadas((prev) => prev.filter((t) => t.id !== transacaoId));
    toast.info('Sugestão rejeitada — feedback registrado');
  }, []);

  const handleConciliarSplit = useCallback(
    (transacaoId: string) => {
      const transacao = transacoes.find((t) => t.id === transacaoId);
      if (transacao) {
        setSelectedTransacaoSplit(transacao);
        setShowSplitDialog(true);
      }
    },
    [transacoes]
  );

  const handleManualSuccess = useCallback(
    async (transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => {
      // Invariante de integridade: idêntica a `handleConfirmarMatch`.
      try {
        await confirmarConciliacao.mutateAsync({
          transacaoId,
          contaPagarId: tipo === 'pagar' ? lancamentoId : undefined,
          contaReceberId: tipo === 'receber' ? lancamentoId : undefined,
        });
        setTransacoes((prev) =>
          prev.map((t) => (t.id === transacaoId ? { ...t, conciliada: true } : t))
        );
        setTransacoesImportadas((prev) => prev.filter((t) => t.id !== transacaoId));
      } catch {
        // Estado local preservado: transação continua pendente para reprocessamento.
      }
    },
    [confirmarConciliacao]
  );

  const handleConciliar = useCallback((transacao: TransacaoExtrato) => {
    if (transacao.conciliada) {
      toast.warning('Esta transação já foi conciliada. Desfaça a conciliação primeiro.');
      return;
    }
    setSelectedTransacaoManual(transacao);
    setShowManualDialog(true);
  }, []);

  const handleIgnorar = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('transacoes_bancarias')
        .update({ conciliada: true, compensacao_motivo: 'Ignorado pelo usuário' })
        .eq('id', id);

      if (error) throw error;
      setTransacoes((prev) => prev.filter((t) => t.id !== id));
      toast.info('Transação marcada como ignorada');
    } catch {
      toast.error('Erro ao ignorar transação');
    }
  }, []);

  const handleDesfazerConciliacao = useCallback(
    async (transacaoId: string) => {
      try {
        await desfazerConciliacao.mutateAsync(transacaoId);
        setTransacoes((prev) =>
          prev.map((t) => (t.id === transacaoId ? { ...t, conciliada: false } : t))
        );
      } catch {
        /* toast already handled */
      }
    },
    [desfazerConciliacao]
  );

  const handleBulkConciliar = useCallback(() => {
    setTransacoes((prev) =>
      prev.map((t) => (selectedIds.has(t.id) ? { ...t, conciliada: true } : t))
    );
    toast.success(`${selectedIds.size} transações conciliadas`);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleBulkIgnorar = useCallback(() => {
    setTransacoes((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    toast.success(`${selectedIds.size} transações ignoradas`);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = filteredTransacoes.filter((t) => !t.conciliada).map((t) => t.id);
    setSelectedIds((prev) => (prev.size === pendingIds.length ? new Set() : new Set(pendingIds)));
  };

  // KPIs
  const totalTransacoes = transacoes.length;
  const conciliadas = transacoes.filter((t) => t.conciliada).length;
  const pendentes = transacoes.filter((t) => !t.conciliada).length;
  const percentualConciliado = totalTransacoes > 0 ? (conciliadas / totalTransacoes) * 100 : 0;

  const filteredTransacoes = useMemo(
    () => filtrarTransacoes({ transacoes, search: debouncedSearch, statusTab, filters }),
    [transacoes, debouncedSearch, statusTab, filters]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowImportDialog(true);
      }
      if (e.key === 'Escape') setSelectedIds(new Set());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const exportData = useMemo(
    () =>
      montarExportData({
        transacoes,
        totalTransacoes,
        conciliadas,
        pendentes,
        percentualConciliado,
      }),
    [transacoes, totalTransacoes, conciliadas, pendentes, percentualConciliado]
  );

  return {
    // State
    mainTab,
    setMainTab,
    statusTab,
    setStatusTab,
    selectedBanco,
    setSelectedBanco,
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
    transacoes,
    transacoesImportadas,
    extratoImportado,
    filters,
    setFilters,
    selectedIds,
    setSelectedIds,
    showReportDialog,
    setShowReportDialog,
    importReport,
    isProcessingImport,
    showSugestoesFila,
    setShowSugestoesFila,
    // Data
    contasBancarias,
    lancamentosSistema,
    filteredTransacoes,
    exportData,
    // KPIs
    totalTransacoes,
    conciliadas,
    pendentes,
    percentualConciliado,
    // Handlers
    handleImportSuccess,
    handleConfirmarMatch,
    handleRejeitarMatch,
    handleConciliarManual,
    handleConciliarSplit,
    handleManualSuccess,
    handleConciliar,
    handleIgnorar,
    handleBulkConciliar,
    handleBulkIgnorar,
    toggleSelect,
    toggleSelectAll,
    handleDesfazerConciliacao,
  };
}

export type { TransacaoExtrato };
