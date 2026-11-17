import { useState, useMemo, useCallback } from 'react';
import {
  CenarioTipo,
  detectarAlertasRuptura,
  calcularMetricasCenarios,
  AlertaRuptura,
} from '@/lib/cashflow-scenarios';
import {
  useFluxoCaixaKPIs,
  useFluxoCaixaProjetado,
  calcularProjecoesReais,
} from '@/hooks/useFluxoCaixa';
import { useQuickDateFilter } from '@/components/ui/quick-date-filters.hooks';
import { useAuth } from '@/hooks/useAuth';

const periodoDias: Record<string, number> = {
  '7d': 7,
  '15d': 15,
  '30d': 30,
  '90d': 90,
};

export function useFluxoCaixaPage() {
  const [periodo, setPeriodo] = useState('30d');
  const [cenarioAtivo, setCenarioAtivo] = useState<CenarioTipo>('realista');
  // Dispensas de alerta POR EMPRESA. detectarAlertasRuptura monta o id só com
  // tipo, cenário e data (cashflow-scenarios.ts:150), sem empresa. Enquanto a
  // projeção somava todas as empresas isso era consistente; agora que ela
  // respeita a empresa selecionada, uma lista global esconderia a ruptura da
  // empresa B por causa de uma dispensa feita na empresa A, na mesma data e
  // cenário — e, se todos coincidissem, a tela diria que o fluxo está saudável.
  const [alertasDismissed, setAlertasDismissed] = useState<Record<string, string[]>>({});

  const { filterType, handleFilterChange } = useQuickDateFilter();
  const { currentEmpresaId } = useAuth();
  const chaveEmpresa = currentEmpresaId ?? '__sem_empresa__';

  const dias = periodoDias[periodo] || 30;

  const { data: kpis, isLoading: loadingKpis, refetch: refetchKpis } = useFluxoCaixaKPIs();
  const {
    data: fluxoProjetado,
    isLoading: loadingFluxo,
    refetch: refetchFluxo,
  } = useFluxoCaixaProjetado(dias);

  const saldoInicial = kpis?.saldoTotal || 0;

  // Gerar projeções para todos os cenários baseado em dados reais
  const projecoes = useMemo(() => {
    if (!fluxoProjetado || fluxoProjetado.length === 0) {
      return {
        otimista: [],
        realista: [],
        pessimista: [],
      };
    }
    return calcularProjecoesReais(fluxoProjetado, saldoInicial, chaveEmpresa);
  }, [fluxoProjetado, saldoInicial, chaveEmpresa]);

  // Calcular métricas dos cenários
  const metricasCenarios = useMemo(() => {
    // Periodo sem movimento projetado NAO zera o caixa: o saldo de partida
    // continua valendo, aqui e na funcao pura (achado F07). Antes este
    // curto-circuito devolvia zeros fixos e a tela anunciava saldo zero.
    if (!projecoes.realista.length) {
      const vazio = {
        saldoMinimo: saldoInicial,
        saldoFinal: saldoInicial,
        diasCriticos: 0,
        diasRisco: 0,
      };
      return { otimista: { ...vazio }, realista: { ...vazio }, pessimista: { ...vazio } };
    }
    return calcularMetricasCenarios(projecoes, saldoInicial);
  }, [projecoes, saldoInicial]);

  // Detectar alertas de ruptura
  const alertas = useMemo(() => {
    if (!projecoes.realista.length) return [];
    const dispensados = alertasDismissed[chaveEmpresa] ?? [];
    const todosAlertas = detectarAlertasRuptura(projecoes, 0, 50000, 100000);
    return todosAlertas.filter((a) => !dispensados.includes(a.id));
  }, [projecoes, alertasDismissed, chaveEmpresa]);

  // Dados do cenário ativo
  const dadosCenarioAtivo = useMemo(() => projecoes[cenarioAtivo] || [], [projecoes, cenarioAtivo]);
  const metricaAtiva = metricasCenarios[cenarioAtivo];

  // Calcular totais do cenário ativo
  const totalReceitas = dadosCenarioAtivo.reduce((sum, f) => sum + f.receitas, 0);
  const totalDespesas = dadosCenarioAtivo.reduce((sum, f) => sum + f.despesas, 0);
  // `?? saldoInicial`, nao `|| saldoInicial`: saldo final legitimamente ZERO
  // era substituido pelo saldo inicial e a tela mostrava dinheiro que o
  // cenario tinha consumido (achado F07, item 3).
  const saldoFinal = metricaAtiva?.saldoFinal ?? saldoInicial;
  const variacao = saldoFinal - saldoInicial;

  // Dados para gráfico de barras
  const barData = useMemo(
    () =>
      dadosCenarioAtivo.map((f) => ({
        ...f,
        data: f.data.slice(5),
        liquido: f.receitas - f.despesas,
      })),
    [dadosCenarioAtivo]
  );

  // Handlers
  const handleDismissAlerta = useCallback(
    (id: string) => {
      setAlertasDismissed((prev) => ({
        ...prev,
        [chaveEmpresa]: [...(prev[chaveEmpresa] ?? []), id],
      }));
    },
    [chaveEmpresa]
  );

  const handleVerDetalhesAlerta = useCallback((alerta: AlertaRuptura) => {
    setCenarioAtivo(alerta.cenario);
  }, []);

  const handleRefresh = useCallback(() => {
    refetchKpis();
    refetchFluxo();
  }, [refetchKpis, refetchFluxo]);

  const isLoading = loadingKpis || loadingFluxo;

  return {
    // State
    periodo,
    setPeriodo,
    cenarioAtivo,
    setCenarioAtivo,
    filterType,
    handleFilterChange,

    // Data
    kpis,
    projecoes,
    metricasCenarios,
    alertas,
    dadosCenarioAtivo,
    metricaAtiva,
    totalReceitas,
    totalDespesas,
    saldoFinal,
    saldoInicial,
    variacao,
    barData,
    dias,

    // Loading
    isLoading,
    loadingKpis,
    loadingFluxo,

    // Handlers
    handleDismissAlerta,
    handleVerDetalhesAlerta,
    handleRefresh,
  };
}
