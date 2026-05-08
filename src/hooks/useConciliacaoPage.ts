import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { useContasBancarias, useContasPagar, useContasReceber } from '@/hooks/useFinancialData';
import { useConciliacao } from '@/hooks/useConciliacao';
import { ConciliacaoFilterState, INITIAL_FILTERS } from '@/components/conciliacao/ConciliacaoFilters';
import { ExtratoOFX, TransacaoOFX } from '@/lib/ofx-parser';
import { 
  LancamentoSistema, converterContasPagarParaLancamentos, 
  converterContasReceberParaLancamentos, encontrarTodosMatches, calcularEstatisticasMatch,
  TOLERANCIA_CENTAVOS,
} from '@/lib/transaction-matcher';
import { type ImportReport } from '@/components/conciliacao/RelatorioImportacaoDialog';
import { toast } from 'sonner';

interface TransacaoExtrato {
  id: string;
  data: Date;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
  conciliada: boolean;
}

export function useConciliacaoPage() {
  const [mainTab, setMainTab] = useState('conciliacao');
  const [statusTab, setStatusTab] = useState('pendentes');
  const [selectedBanco, setSelectedBanco] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [selectedTransacaoManual, setSelectedTransacaoManual] = useState<TransacaoExtrato | null>(null);
  const [selectedTransacaoSplit, setSelectedTransacaoSplit] = useState<TransacaoExtrato | null>(null);
  const [transacoes, setTransacoes] = useState<TransacaoExtrato[]>([]);
  const [extratoImportado, setExtratoImportado] = useState<ExtratoOFX | null>(null);
  const [transacoesImportadas, setTransacoesImportadas] = useState<TransacaoOFX[]>([]);
  const [filters, setFilters] = useState<ConciliacaoFilterState>(INITIAL_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const { data: contasBancarias } = useContasBancarias();
  const { data: contasPagar } = useContasPagar();
  const { data: contasReceber } = useContasReceber();
  const { confirmarConciliacao, salvarExtratoBanco } = useConciliacao();

  const lancamentosSistema = useMemo((): LancamentoSistema[] => {
    const lancamentosPagar = contasPagar 
      ? converterContasPagarParaLancamentos(contasPagar.map(cp => ({
          id: cp.id, descricao: cp.descricao, valor: cp.valor,
          data_vencimento: cp.data_vencimento, fornecedor_nome: cp.fornecedor_nome,
          status: cp.status, numero_documento: cp.numero_documento,
          fornecedores: cp.fornecedor ? { razao_social: cp.fornecedor, nome_fantasia: null } : null,
        }))) 
      : [];
    const lancamentosReceber = contasReceber 
      ? converterContasReceberParaLancamentos(contasReceber.map(cr => ({
          id: cr.id, descricao: cr.descricao, valor: cr.valor,
          data_vencimento: cr.data_vencimento, cliente_nome: cr.cliente_nome,
          status: cr.status, numero_documento: cr.numero_documento,
          clientes: cr.cliente ? { razao_social: cr.cliente, nome_fantasia: null } : null,
        }))) 
      : [];
    return [...lancamentosPagar, ...lancamentosReceber];
  }, [contasPagar, contasReceber]);

  const handleImportSuccess = useCallback(async (extrato: ExtratoOFX) => {
    setIsProcessingImport(true);
    const novasTransacoes = extrato.transacoes.map((t: TransacaoOFX) => ({
      id: t.id, data: t.data, descricao: t.descricao, valor: t.valor, tipo: t.tipo, conciliada: false,
    }));

    let savedCount = extrato.transacoes.length;
    let duplicateCount = 0;
    
    if (selectedBanco) {
      try {
        const result = await salvarExtratoBanco.mutateAsync({ extrato, contaBancariaId: selectedBanco });
        savedCount = result.saved;
        duplicateCount = result.duplicates;
      } catch (err) { console.error('Failed to persist extrato:', err); }
    }

    const matches = encontrarTodosMatches(extrato.transacoes, lancamentosSistema);
    const estatisticas = calcularEstatisticasMatch(extrato.transacoes, matches);
    
    const matchesAlta: ImportReport['matchesAlta'] = [];
    let autoConciliadas = 0;
    let valorAutoConciliado = 0;

    for (const transacao of extrato.transacoes) {
      const sugestoes = matches.get(transacao.id);
      if (sugestoes && sugestoes.length > 0 && sugestoes[0].confianca === 'alta') {
        const melhorMatch = sugestoes[0];
        const valorDiff = Math.abs(transacao.valor) - melhorMatch.lancamento.valor;
        const isWithinPennyTolerance = Math.abs(valorDiff) <= TOLERANCIA_CENTAVOS;

        matchesAlta.push({ transacao, match: melhorMatch });
        autoConciliadas++;
        valorAutoConciliado += Math.abs(transacao.valor);
        const idx = novasTransacoes.findIndex(t => t.id === transacao.id);
        if (idx >= 0) novasTransacoes[idx].conciliada = true;

        // Efetivar conciliação automática no banco
        try {
          await confirmarConciliacao.mutateAsync({
            transacaoId: transacao.id,
            contaPagarId: melhorMatch.lancamentoTipo === 'pagar' ? melhorMatch.lancamentoId : undefined,
            contaReceberId: melhorMatch.lancamentoTipo === 'receber' ? melhorMatch.lancamentoId : undefined,
            ajusteCentavos: isWithinPennyTolerance ? valorDiff : 0,
          });
        } catch (err) {
          console.error('Erro na conciliação automática:', err);
        }
      }
    }

    setTransacoes(prev => [...novasTransacoes, ...prev]);
    setTransacoesImportadas(prev => [
      ...extrato.transacoes.filter(t => {
        const s = matches.get(t.id);
        return !s || s.length === 0 || s[0].confianca !== 'alta';
      }),
      ...prev,
    ]);
    setExtratoImportado(extrato);

    const pendentesRevisao = extrato.transacoes.length - autoConciliadas - duplicateCount;
    const valorPendente = extrato.transacoes
      .filter(t => { const s = matches.get(t.id); return !s || s.length === 0 || s[0].confianca !== 'alta'; })
      .reduce((sum, t) => sum + Math.abs(t.valor), 0);

    setImportReport({
      totalImportadas: extrato.transacoes.length, totalSalvas: savedCount,
      totalDuplicadas: duplicateCount, autoConciliadas,
      pendentesRevisao: Math.max(0, pendentesRevisao), valorAutoConciliado, valorPendente,
      estatisticas, matchesAlta,
    });
    setShowReportDialog(true);
    setIsProcessingImport(false);
  }, [selectedBanco, lancamentosSistema, salvarExtratoBanco]);

  const handleConfirmarMatch = useCallback(async (transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => {
    try {
      await confirmarConciliacao.mutateAsync({
        transacaoId,
        contaPagarId: tipo === 'pagar' ? lancamentoId : undefined,
        contaReceberId: tipo === 'receber' ? lancamentoId : undefined,
      });
    } catch { /* update local state anyway */ }
    setTransacoes(prev => prev.map(t => t.id === transacaoId ? { ...t, conciliada: true } : t));
    setTransacoesImportadas(prev => prev.filter(t => t.id !== transacaoId));
  }, [confirmarConciliacao]);

  const handleRejeitarMatch = useCallback((transacaoId: string, _lancamentoId: string) => {
    // Remove a transação da fila de sugestões IA — feedback já foi gravado em
    // historico_conciliacao_ia + feedback_conciliacao_ia pelo SugestoesMatchIA.
    setTransacoesImportadas(prev => prev.filter(t => t.id !== transacaoId));
    toast.info('Sugestão rejeitada — feedback registrado');
  }, []);

  const handleConciliarManual = useCallback((transacaoId: string) => {
    const transacao = transacoes.find(t => t.id === transacaoId);
    if (transacao) { setSelectedTransacaoManual(transacao); setShowManualDialog(true); }
  }, [transacoes]);

  const handleConciliarSplit = useCallback((transacaoId: string) => {
    const transacao = transacoes.find(t => t.id === transacaoId);
    if (transacao) { setSelectedTransacaoSplit(transacao); setShowSplitDialog(true); }
  }, [transacoes]);

  const handleManualSuccess = useCallback(async (transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => {
    try {
      await confirmarConciliacao.mutateAsync({
        transacaoId,
        contaPagarId: tipo === 'pagar' ? lancamentoId : undefined,
        contaReceberId: tipo === 'receber' ? lancamentoId : undefined,
      });
    } catch { /* fallback */ }
    setTransacoes(prev => prev.map(t => t.id === transacaoId ? { ...t, conciliada: true } : t));
    setTransacoesImportadas(prev => prev.filter(t => t.id !== transacaoId));
  }, [confirmarConciliacao]);

  const handleConciliar = (id: string) => {
    setTransacoes(prev => prev.map(t => t.id === id ? { ...t, conciliada: true } : t));
  };

  const handleIgnorar = (id: string) => {
    setTransacoes(prev => prev.filter(t => t.id !== id));
  };

  const handleBulkConciliar = useCallback(() => {
    setTransacoes(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, conciliada: true } : t));
    toast.success(`${selectedIds.size} transações conciliadas`);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleBulkIgnorar = useCallback(() => {
    setTransacoes(prev => prev.filter(t => !selectedIds.has(t.id)));
    toast.success(`${selectedIds.size} transações ignoradas`);
    setSelectedIds(new Set());
  }, [selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // KPIs
  const totalTransacoes = transacoes.length;
  const conciliadas = transacoes.filter(t => t.conciliada).length;
  const pendentes = transacoes.filter(t => !t.conciliada).length;
  const percentualConciliado = totalTransacoes > 0 ? (conciliadas / totalTransacoes) * 100 : 0;

  const filteredTransacoes = useMemo(() => transacoes.filter(t => {
    const matchesSearch = t.descricao.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesTab = statusTab === 'todas' || 
      (statusTab === 'pendentes' && !t.conciliada) ||
      (statusTab === 'conciliadas' && t.conciliada);
    if (filters.tipo !== 'todos' && t.tipo !== filters.tipo) return false;
    if (filters.periodoInicio) { if (t.data < new Date(filters.periodoInicio)) return false; }
    if (filters.periodoFim) { const end = new Date(filters.periodoFim); end.setHours(23, 59, 59); if (t.data > end) return false; }
    if (filters.valorMin && t.valor < parseFloat(filters.valorMin)) return false;
    if (filters.valorMax && t.valor > parseFloat(filters.valorMax)) return false;
    return matchesSearch && matchesTab;
  }), [transacoes, debouncedSearch, statusTab, filters]);

  const toggleSelectAll = () => {
    const pendingIds = filteredTransacoes.filter(t => !t.conciliada).map(t => t.id);
    setSelectedIds(prev => prev.size === pendingIds.length ? new Set() : new Set(pendingIds));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'i' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setShowImportDialog(true); }
      if (e.key === 'Escape') setSelectedIds(new Set());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const exportData = useMemo(() => ({
    transacoes: transacoes.map(t => ({
      descricao: t.descricao, data: t.data, valor: t.valor,
      tipo: t.tipo, status: t.conciliada ? 'conciliada' : 'pendente',
    })),
    stats: {
      total: totalTransacoes, conciliadas, pendentes,
      percentual: percentualConciliado,
      valorConciliado: transacoes.filter(t => t.conciliada).reduce((s, t) => s + t.valor, 0),
      valorPendente: transacoes.filter(t => !t.conciliada).reduce((s, t) => s + t.valor, 0),
    },
  }), [transacoes, totalTransacoes, conciliadas, pendentes, percentualConciliado]);

  return {
    // State
    mainTab, setMainTab, statusTab, setStatusTab,
    selectedBanco, setSelectedBanco, searchTerm, setSearchTerm,
    showImportDialog, setShowImportDialog,
    showManualDialog, setShowManualDialog,
    showSplitDialog, setShowSplitDialog,
    selectedTransacaoManual, selectedTransacaoSplit,
    transacoes, transacoesImportadas, extratoImportado,
    filters, setFilters, selectedIds,
    showReportDialog, setShowReportDialog,
    importReport, isProcessingImport,
    // Data
    contasBancarias, lancamentosSistema,
    filteredTransacoes, exportData,
    // KPIs
    totalTransacoes, conciliadas, pendentes, percentualConciliado,
    // Handlers
    handleImportSuccess, handleConfirmarMatch, handleRejeitarMatch,
    handleConciliarManual, handleConciliarSplit, handleManualSuccess,
    handleConciliar, handleIgnorar,
    handleBulkConciliar, handleBulkIgnorar,
    toggleSelect, toggleSelectAll,
  };
}

export type { TransacaoExtrato };
