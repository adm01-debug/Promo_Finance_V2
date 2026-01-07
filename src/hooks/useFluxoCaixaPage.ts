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
  calcularProjecoesReais 
} from '@/hooks/useFluxoCaixa';
import { useQuickDateFilter } from '@/components/ui/quick-date-filters';

const periodoDias: Record<string, number> = {
  '7d': 7,
  '15d': 15,
  '30d': 30,
  '90d': 90,
};

export function useFluxoCaixaPage() {
  const [periodo, setPeriodo] = useState('30d');
  const [cenarioAtivo, setCenarioAtivo] = useState<CenarioTipo>('realista');
  const [alertasDismissed, setAlertasDismissed] = useState<string[]>([]);
  
  const { filterType, handleFilterChange, filterByDate } = useQuickDateFilter();
  
  const dias = periodoDias[periodo] || 30;
  
  const { data: kpis, isLoading: loadingKpis, refetch: refetchKpis } = useFluxoCaixaKPIs();
  const { data: fluxoProjetado, isLoading: loadingFluxo, refetch: refetchFluxo } = useFluxoCaixaProjetado(dias);

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
    return calcularProjecoesReais(fluxoProjetado, saldoInicial);
  }, [fluxoProjetado, saldoInicial]);

  // Calcular métricas dos cenários
  const metricasCenarios = useMemo(() => {
    if (!projecoes.realista.length) {
      return {
        otimista: { saldoMinimo: 0, saldoFinal: 0, diasCriticos: 0, diasRisco: 0 },
        realista: { saldoMinimo: 0, saldoFinal: 0, diasCriticos: 0, diasRisco: 0 },
        pessimista: { saldoMinimo: 0, saldoFinal: 0, diasCriticos: 0, diasRisco: 0 },
      };
    }
    return calcularMetricasCenarios(projecoes);
  }, [projecoes]);

  // Detectar alertas de ruptura
  const alertas = useMemo(() => {
    if (!projecoes.realista.length) return [];
    const todosAlertas = detectarAlertasRuptura(projecoes, 0, 50000, 100000);
    return todosAlertas.filter(a => !alertasDismissed.includes(a.id));
  }, [projecoes, alertasDismissed]);

  // Dados do cenário ativo
  const dadosCenarioAtivo = projecoes[cenarioAtivo] || [];
  const metricaAtiva = metricasCenarios[cenarioAtivo];

  // Calcular totais do cenário ativo
  const totalReceitas = dadosCenarioAtivo.reduce((sum, f) => sum + f.receitas, 0);
  const totalDespesas = dadosCenarioAtivo.reduce((sum, f) => sum + f.despesas, 0);
  const saldoFinal = metricaAtiva?.saldoFinal || saldoInicial;
  const variacao = saldoFinal - saldoInicial;

  // Dados para gráfico de barras
  const barData = useMemo(() => 
    dadosCenarioAtivo.map(f => ({
      ...f,
      data: f.data.slice(5),
      liquido: f.receitas - f.despesas,
    })), [dadosCenarioAtivo]
  );

  // Handlers
  const handleDismissAlerta = useCallback((id: string) => {
    setAlertasDismissed(prev => [...prev, id]);
  }, []);

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
