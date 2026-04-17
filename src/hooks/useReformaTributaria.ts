// ============================================
// HOOK: useReformaTributaria
// Gestão completa do módulo contábil da Reforma
// Dados 100% reais (operacoes_tributaveis + apuracoes_tributarias)
// ============================================

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  RegimeEspecial,
  CategoriaIS,
  ALIQUOTAS_TRANSICAO,
  REGIMES_ESPECIAIS,
  CONFIGURACOES_IS,
  MetricasReformaTributaria,
  SaldoCreditosTributarios,
} from '@/types/reforma-tributaria';
import {
  calcularTributosReforma,
  calcularCreditos,
  simularComparativo,
  determinarFaseTransicao,
  obterAliquotasTransicao,
  DadosOperacao,
  ResultadoCalculo,
  DadosSimulacao,
  ResultadoSimulacao,
} from '@/lib/reforma-tributaria-calculator';

// ========================
// CONSTANTES
// ========================

const ANO_STORAGE_KEY = 'reforma-tributaria:ano-referencia';
const EMPRESA_TODAS = 'all';

// Normaliza o filtro de empresa: 'all' / '' / undefined => sem filtro
export function normalizarEmpresaId(value?: string | null): string | undefined {
  if (!value || value === EMPRESA_TODAS) return undefined;
  return value;
}

// ========================
// HOOK PRINCIPAL
// ========================

export function useReformaTributaria(empresaIdFiltro?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const empresaId = normalizarEmpresaId(empresaIdFiltro);

  // Persistência do ano de referência
  const [anoReferencia, setAnoReferenciaState] = useState<number>(() => {
    if (typeof window === 'undefined') return new Date().getFullYear();
    const saved = window.localStorage.getItem(ANO_STORAGE_KEY);
    const parsed = saved ? Number(saved) : NaN;
    return Number.isFinite(parsed) && parsed >= 2024 && parsed <= 2033
      ? parsed
      : new Date().getFullYear();
  });

  const setAnoReferencia = useCallback((ano: number) => {
    setAnoReferenciaState(ano);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ANO_STORAGE_KEY, String(ano));
    }
  }, []);

  // ========================
  // DADOS DERIVADOS
  // ========================

  const faseAtual = useMemo(() => determinarFaseTransicao(anoReferencia), [anoReferencia]);
  const aliquotasAtuais = useMemo(() => obterAliquotasTransicao(anoReferencia), [anoReferencia]);

  // ========================
  // CÁLCULOS EM TEMPO REAL
  // ========================

  const calcularTributos = useCallback(
    (dados: DadosOperacao): ResultadoCalculo => calcularTributosReforma(dados, anoReferencia),
    [anoReferencia],
  );

  const simularCenario = useCallback(
    (dados: DadosSimulacao, ano?: number): ResultadoSimulacao =>
      simularComparativo(dados, ano || anoReferencia),
    [anoReferencia],
  );

  // ========================
  // MÉTRICAS DO DASHBOARD (DADOS REAIS)
  // ========================

  const queryKey = ['reforma-tributaria-metricas', anoReferencia, empresaId ?? 'all'] as const;

  const { data: metricas, isLoading: isLoadingMetricas } = useQuery({
    queryKey,
    queryFn: async (): Promise<MetricasReformaTributaria> => {
      const inicioAno = `${anoReferencia}-01-01`;
      const fimAno = `${anoReferencia}-12-31`;

      // 1) Buscar operações tributáveis do ano (fonte primária)
      let opsQuery = supabase
        .from('operacoes_tributaveis')
        .select(
          'tipo_operacao, valor_operacao, base_calculo, cbs_valor, cbs_credito, ibs_valor, ibs_credito, is_valor, data_operacao',
        )
        .gte('data_operacao', inicioAno)
        .lte('data_operacao', fimAno);
      if (empresaId) opsQuery = opsQuery.eq('empresa_id', empresaId);
      const { data: operacoes, error: errOps } = await opsQuery;
      if (errOps) throw errOps;

      // 2) Buscar apurações do ano (para tributos residuais consolidados)
      let apQuery = supabase
        .from('apuracoes_tributarias')
        .select(
          'cbs_a_pagar, ibs_a_pagar, is_a_pagar, icms_residual, iss_residual, pis_residual, cofins_residual',
        )
        .eq('ano', anoReferencia);
      if (empresaId) apQuery = apQuery.eq('empresa_id', empresaId);
      const { data: apuracoes, error: errAp } = await apQuery;
      if (errAp) throw errAp;

      const ops = operacoes || [];
      const isVendaOuServPrest = (t: string | null) =>
        t === 'venda' || t === 'servico_prestado' || t === 'exportacao';
      const isCompraOuServTom = (t: string | null) =>
        t === 'compra' || t === 'servico_tomado' || t === 'importacao';

      // Agregações de operações
      const faturamentoTotal = ops
        .filter((o) => isVendaOuServPrest(o.tipo_operacao))
        .reduce((acc, o) => acc + Number(o.valor_operacao || 0), 0);

      const comprasTotal = ops
        .filter((o) => isCompraOuServTom(o.tipo_operacao))
        .reduce((acc, o) => acc + Number(o.valor_operacao || 0), 0);

      const cbsDebitosTotal = ops
        .filter((o) => isVendaOuServPrest(o.tipo_operacao))
        .reduce((acc, o) => acc + Number(o.cbs_valor || 0), 0);
      const ibsDebitosTotal = ops
        .filter((o) => isVendaOuServPrest(o.tipo_operacao))
        .reduce((acc, o) => acc + Number(o.ibs_valor || 0), 0);
      const isTotal = ops.reduce((acc, o) => acc + Number(o.is_valor || 0), 0);

      const cbsCreditosTotal = ops.reduce((acc, o) => acc + Number(o.cbs_credito || 0), 0);
      const ibsCreditosTotal = ops.reduce((acc, o) => acc + Number(o.ibs_credito || 0), 0);

      // Agregações de apurações (preferir o consolidado quando existir)
      const aps = apuracoes || [];
      const cbsAPagarApuracao = aps.reduce((acc, a) => acc + Number(a.cbs_a_pagar || 0), 0);
      const ibsAPagarApuracao = aps.reduce((acc, a) => acc + Number(a.ibs_a_pagar || 0), 0);
      const isAPagarApuracao = aps.reduce((acc, a) => acc + Number(a.is_a_pagar || 0), 0);
      const tributosAntigosResidual = aps.reduce(
        (acc, a) =>
          acc +
          Number(a.icms_residual || 0) +
          Number(a.iss_residual || 0) +
          Number(a.pis_residual || 0) +
          Number(a.cofins_residual || 0),
        0,
      );

      // Saldo a pagar: prefere o cálculo da apuração; usa estimativa caso não haja apurações
      const cbsSaldoAPagar =
        cbsAPagarApuracao > 0
          ? cbsAPagarApuracao
          : Math.max(0, cbsDebitosTotal - cbsCreditosTotal);
      const ibsSaldoAPagar =
        ibsAPagarApuracao > 0
          ? ibsAPagarApuracao
          : Math.max(0, ibsDebitosTotal - ibsCreditosTotal);
      const impostoSeletivoTotal = isAPagarApuracao > 0 ? isAPagarApuracao : isTotal;

      const totalTributosNovos = cbsSaldoAPagar + ibsSaldoAPagar + impostoSeletivoTotal;
      const cargaTributariaEfetiva =
        faturamentoTotal > 0 ? (totalTributosNovos / faturamentoTotal) * 100 : 0;

      const aliquotas = obterAliquotasTransicao(anoReferencia);

      return {
        empresaId: empresaId ?? '',
        competencia: `${anoReferencia}`,
        faturamentoTotal,
        comprasTotal,
        cargaTributariaEfetiva,
        cbsDebitosTotal,
        cbsCreditosTotal,
        cbsSaldoAPagar,
        cbsTaxaEfetiva:
          faturamentoTotal > 0 ? (cbsSaldoAPagar / faturamentoTotal) * 100 : 0,
        ibsDebitosTotal,
        ibsCreditosTotal,
        ibsSaldoAPagar,
        ibsTaxaEfetiva:
          faturamentoTotal > 0 ? (ibsSaldoAPagar / faturamentoTotal) * 100 : 0,
        impostoSeletivoTotal,
        valorRetidoSplitPayment: cbsSaldoAPagar + ibsSaldoAPagar,
        valorPagoPosSplit: 0,
        variacaoCargaTributaria: 0,
        economiaGerada: 0,
        creditosAcumulados: cbsCreditosTotal + ibsCreditosTotal,
        creditosUtilizados:
          Math.min(cbsCreditosTotal, cbsDebitosTotal) +
          Math.min(ibsCreditosTotal, ibsDebitosTotal),
        creditosDisponiveis:
          Math.max(0, cbsCreditosTotal - cbsDebitosTotal) +
          Math.max(0, ibsCreditosTotal - ibsDebitosTotal),
        tributosAntigosResidual,
        percentualMigracao: 100 - aliquotas.icmsResidual,
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // ========================
  // REALTIME — invalida métricas quando dados mudarem
  // ========================

  useEffect(() => {
    const channel = supabase
      .channel(`reforma-tributaria-realtime-${empresaId ?? 'all'}-${anoReferencia}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'operacoes_tributaveis' },
        () => queryClient.invalidateQueries({ queryKey: ['reforma-tributaria-metricas'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'apuracoes_tributarias' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['reforma-tributaria-metricas'] });
          queryClient.invalidateQueries({ queryKey: ['apuracoes_tributarias'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [empresaId, anoReferencia, queryClient]);

  // ========================
  // CRONOGRAMA DE TRANSIÇÃO
  // ========================

  const cronogramaTransicao = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    return ALIQUOTAS_TRANSICAO.map((aliquota) => ({
      ...aliquota,
      status:
        aliquota.ano < anoAtual
          ? 'concluido'
          : aliquota.ano === anoAtual
            ? 'em_andamento'
            : 'futuro',
      faseTransicao: determinarFaseTransicao(aliquota.ano),
    }));
  }, []);

  // ========================
  // SIMULAÇÃO EM LOTE
  // ========================

  const { mutateAsync: executarSimulacao, isPending: isSimulando } = useMutation({
    mutationFn: async (dados: DadosSimulacao) => {
      const resultados: { ano: number; resultado: ResultadoSimulacao }[] = [];
      for (let ano = 2026; ano <= 2033; ano++) {
        resultados.push({ ano, resultado: simularComparativo(dados, ano) });
      }
      return resultados;
    },
    onSuccess: () => {
      toast({
        title: 'Simulação concluída',
        description: 'Comparativo tributário gerado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na simulação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ========================
  // SALDO DE CRÉDITOS
  // ========================

  const calcularSaldoCreditos = useCallback(
    (
      creditosCBS: number,
      creditosIBS: number,
      debitosCBS: number,
      debitosIBS: number,
    ): SaldoCreditosTributarios => {
      const cbsUtilizado = Math.min(creditosCBS, debitosCBS);
      const ibsUtilizado = Math.min(creditosIBS, debitosIBS);
      return {
        cbsDisponivel: Math.max(0, creditosCBS - debitosCBS),
        cbsUtilizado,
        cbsTotal: creditosCBS,
        ibsDisponivel: Math.max(0, creditosIBS - debitosIBS),
        ibsUtilizado,
        ibsTotal: creditosIBS,
        creditosAVencer30Dias: 0,
        creditosAVencer60Dias: 0,
        creditosAVencer90Dias: 0,
      };
    },
    [],
  );

  // ========================
  // INFORMAÇÕES DE REGIME ESPECIAL
  // ========================

  const getRegimeEspecialInfo = useCallback(
    (regime: RegimeEspecial) => REGIMES_ESPECIAIS.find((r) => r.regime === regime),
    [],
  );

  const getImpostoSeletivoInfo = useCallback(
    (categoria: CategoriaIS) => CONFIGURACOES_IS.find((c) => c.categoria === categoria),
    [],
  );

  return {
    // Estado
    anoReferencia,
    setAnoReferencia,
    faseAtual,
    aliquotasAtuais,
    empresaId,

    // Dados
    metricas,
    isLoadingMetricas,
    cronogramaTransicao,
    regimesEspeciais: REGIMES_ESPECIAIS,
    impostosSeletivos: CONFIGURACOES_IS,

    // Funções de cálculo
    calcularTributos,
    calcularCreditos,
    simularCenario,
    calcularSaldoCreditos,

    // Simulação
    executarSimulacao,
    isSimulando,

    // Utilitários
    getRegimeEspecialInfo,
    getImpostoSeletivoInfo,
    determinarFaseTransicao,
    obterAliquotasTransicao,
  };
}

export default useReformaTributaria;
