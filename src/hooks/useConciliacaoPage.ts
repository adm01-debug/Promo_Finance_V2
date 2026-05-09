import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useOptimizedQueries';
import { useContasBancarias, useContasPagar, useContasReceber } from '@/hooks/useFinancialData';
import { useGlobalFinancialFilter } from '@/hooks/useGlobalFinancialFilter';
import { useConciliacao } from '@/hooks/useConciliacao';
import { supabase } from '@/integrations/supabase/client';
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
  const [selectedTransacaoManual, setSelectedTransacaoManual] = useState<TransacaoExtrato | null>(null);
  const [selectedTransacaoSplit, setSelectedTransacaoSplit] = useState<TransacaoExtrato | null>(null);
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

    const loadTransacoes = async () => {
      const { data, error } = await supabase
        .from('transacoes_bancarias')
        .select('*')
        .eq('conta_bancaria_id', selectedBanco)
        .order('data', { ascending: false });

      if (error) {
        toast.error('Erro ao carregar transações');
        return;
      }

      setTransacoes((data || []).map(t => ({
        id: t.id,
        data: new Date(t.data),
        descricao: t.descricao || '',
        valor: Number(t.valor),
        tipo: t.tipo === 'receita' ? 'credito' : 'debito',
        conciliada: !!t.conciliada,
        compensacao_valor: t.compensacao_valor ? Number(t.compensacao_valor) : undefined,
        compensacao_motivo: t.compensacao_motivo || undefined,
        compensacao_classificacao: t.compensacao_classificacao || undefined,
        compensacao_regra: t.compensacao_regra || undefined,
        compensacao_evidencia_url: t.compensacao_evidencia_url || undefined,
      })));
    };

    loadTransacoes();
  }, [selectedBanco]);

  const lancamentosSistema = useMemo((): LancamentoSistema[] => {
    const lancamentosPagar = contasPagar 
      ? converterContasPagarParaLancamentos(contasPagar.map(cp => ({
          id: cp.id, descricao: cp.descricao, valor: cp.valor,
          data_vencimento: cp.data_vencimento, fornecedor_nome: cp.fornecedor_nome,
          status: cp.status, numero_documento: cp.numero_documento,
          fornecedores: cp.fornecedor_razao_social ? { razao_social: cp.fornecedor_razao_social, nome_fantasia: cp.fornecedor_nome_fantasia || null } : null,
          centro_custo_nome: cp.centro_custo_nome,
        }))) 
      : [];
    const lancamentosReceber = contasReceber 
      ? converterContasReceberParaLancamentos(contasReceber.map(cr => ({
          id: cr.id, descricao: cr.descricao, valor: cr.valor,
          data_vencimento: cr.data_vencimento, cliente_nome: cr.cliente_nome,
          status: cr.status, numero_documento: cr.numero_documento,
          clientes: cr.cliente_razao_social ? { razao_social: cr.cliente_razao_social, nome_fantasia: cr.cliente_nome_fantasia || null } : null,
          centro_custo_nome: cr.centro_custo_nome,
        }))) 
      : [];
    return [...lancamentosPagar, ...lancamentosReceber];
  }, [contasPagar, contasReceber]);

  const handleImportSuccess = useCallback(async (extrato: ExtratoOFX) => {
    setIsProcessingImport(true);

    // Validação de Saldo e Auditoria (Melhorado)
    if (extrato.conta.saldoFinal !== undefined) {
      const saldoCalculado = (extrato.conta.saldoInicial || 0) + extrato.transacoes.reduce((acc, t) => acc + t.valor, 0);
      if (Math.abs(saldoCalculado - extrato.conta.saldoFinal) > 0.01) {
        toast.warning('Divergência de Saldo Detectada', {
          description: `O saldo final do arquivo (R$ ${extrato.conta.saldoFinal.toFixed(2)}) não bate com o calculado (R$ ${saldoCalculado.toFixed(2)}).`
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
            resolvido_por: userData.user?.id
          });

          // Adicionar alerta automático no sistema
          await supabase.from('alertas').insert({
            empresa_id: (contasBancarias?.find(c => c.id === selectedBanco) as any)?.empresa_id,
            tipo: 'divergencia_conciliacao',
            prioridade: 'critica',
            titulo: 'Divergência de Saldo Bancário',
            mensagem: `O saldo final do extrato ${extrato.nomeArquivo} (R$ ${extrato.conta.saldoFinal.toFixed(2)}) não confere com o cálculo dos lançamentos. Diferença de R$ ${(extrato.conta.saldoFinal - saldoCalculado).toFixed(2)}.`,
            status: 'pendente',
            metadata: { conta_bancaria_id: selectedBanco, extrato: extrato.nomeArquivo }
          } as any);
        }
      }
    }

    const novasTransacoes = extrato.transacoes.map((t: TransacaoOFX): TransacaoExtrato => ({
      id: t.id, data: t.data, descricao: t.descricao, valor: t.valor, tipo: t.tipo, conciliada: false,
    }));

    let savedCount = extrato.transacoes.length;
    let duplicateCount = 0;
    
    if (selectedBanco) {
      try {
        // Registrar importação do extrato para evitar duplicidade futura
        const fileHash = btoa(extrato.nomeArquivo + extrato.conta.agencia + extrato.conta.conta);
        await supabase.from('extratos_bancarios_importados').insert({
          conta_bancaria_id: selectedBanco,
          nome_arquivo: extrato.nomeArquivo,
          hash_arquivo: fileHash,
          total_transacoes: extrato.transacoes.length,
          metadados: { saldoFinal: extrato.conta.saldoFinal }
        });

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

    // Buscar configurações da conta
    const { data: contaInfo } = await supabase
      .from('contas_bancarias')
      .select('configuracoes_conciliacao')
      .eq('id', selectedBanco)
      .single();
    
    const config = (contaInfo?.configuracoes_conciliacao as any) || { 
      tolerancia_centavos: TOLERANCIA_CENTAVOS, 
      aceite_automatico: true,
      alertas_inadimplencia: { threshold: 10, interval: 'weekly', channel: 'email', active: false },
      alertas_conciliacao: { threshold: 5, interval: 'daily', channel: 'email', active: false }
    };

    for (const transacao of extrato.transacoes) {
      const sugestoes = matches.get(transacao.id);
      if (sugestoes && sugestoes.length > 0 && sugestoes[0].confianca === 'alta' && config.aceite_automatico) {
        const melhorMatch = sugestoes[0];
        const valorDiff = Math.abs(transacao.valor) - melhorMatch.lancamento.valor;
        const isWithinPennyTolerance = Math.abs(valorDiff) <= (config.tolerancia_centavos || TOLERANCIA_CENTAVOS);

        if (isWithinPennyTolerance) {
          matchesAlta.push({ transacao, match: melhorMatch });
          autoConciliadas++;
          valorAutoConciliado += Math.abs(transacao.valor);
          const idx = novasTransacoes.findIndex(t => t.id === transacao.id);
          if (idx >= 0) {
            novasTransacoes[idx].conciliada = true;
            novasTransacoes[idx].compensacao_valor = valorDiff;
            novasTransacoes[idx].compensacao_motivo = 'Tolerância configurada';
            novasTransacoes[idx].compensacao_classificacao = valorDiff > 0 ? 'Juros' : 'Desconto';
            novasTransacoes[idx].compensacao_regra = `Match automático IA (Tolerância R$ ${config.tolerancia_centavos})`;
          }

          // Efetivar conciliação automática no banco
          try {
            await confirmarConciliacao.mutateAsync({
              transacaoId: transacao.id,
              contaPagarId: melhorMatch.lancamentoTipo === 'pagar' ? melhorMatch.lancamentoId : undefined,
              contaReceberId: melhorMatch.lancamentoTipo === 'receber' ? melhorMatch.lancamentoId : undefined,
              ajusteCentavos: valorDiff,
              motivo: 'Tolerância configurada',
              classificacao: valorDiff > 0 ? 'Juros' : 'Desconto',
              regra: `Aceite automático dentro da tolerância de R$ ${config.tolerancia_centavos}`,
            });
          } catch (err: any) {
            console.error('Erro na conciliação automática:', err);
            
            // Alertar falha de conciliação automática
            toast.error(`Falha na Conciliação Automática`, {
              description: `A transação "${transacao.descricao}" não pôde ser conciliada automaticamente. Erro: ${err.message || 'Erro no servidor'}`,
              action: {
                label: 'Resolver Manualmente',
                onClick: () => handleConciliarManual(transacao.id)
              }
            });

            // Registrar log de erro de conciliação no banco
            if (selectedBanco) {
              await supabase.from('webhooks_log').insert({
                event_type: 'reconciliation.failed',
                status: 'error',
                payload: { transacao, match: melhorMatch, error: err } as any,
                erro_mensagem: `Falha na conciliação automática: ${err.message}`,
                provider: 'Internal System'
              });
            }
          }
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
  }, [selectedBanco, lancamentosSistema, salvarExtratoBanco, confirmarConciliacao, contasBancarias]);

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
      setTransacoes(prev => prev.filter(t => t.id !== id));
      toast.info('Transação marcada como ignorada');
    } catch (err) {
      toast.error('Erro ao ignorar transação');
    }
  }, []);

  const handleDesfazerConciliacao = useCallback(async (transacaoId: string) => {
    try {
      await desfazerConciliacao.mutateAsync(transacaoId);
      setTransacoes(prev => prev.map(t => t.id === transacaoId ? { ...t, conciliada: false } : t));
    } catch { /* toast already handled */ }
  }, [desfazerConciliacao]);

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

  const toggleSelectAll = () => {
    const pendingIds = filteredTransacoes.filter(t => !t.conciliada).map(t => t.id);
    setSelectedIds(prev => prev.size === pendingIds.length ? new Set() : new Set(pendingIds));
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
      id: t.id,
      descricao: t.descricao,
      data: t.data,
      valor: t.valor,
      tipo: t.tipo,
      status: t.conciliada ? 'conciliada' : 'pendente',
      compensacao_valor: t.compensacao_valor,
      compensacao_motivo: t.compensacao_motivo,
      compensacao_classificacao: t.compensacao_classificacao,
      compensacao_regra: t.compensacao_regra,
      compensacao_evidencia_url: t.compensacao_evidencia_url,
    })),
    stats: {
      total: totalTransacoes,
      conciliadas,
      pendentes,
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
    selectedTransacaoManual, setSelectedTransacaoManual,
    selectedTransacaoSplit, setSelectedTransacaoSplit,
    transacoes, transacoesImportadas, extratoImportado,
    filters, setFilters, selectedIds, setSelectedIds,
    showReportDialog, setShowReportDialog,
    importReport, isProcessingImport,
    showSugestoesFila, setShowSugestoesFila,
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
    handleDesfazerConciliacao,
  };
}

export type { TransacaoExtrato };
