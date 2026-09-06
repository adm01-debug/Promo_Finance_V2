import { useMemo } from 'react';
import {
  useEmpresas,
  useCentrosCusto,
  useContasBancarias,
  useContasPagar,
  useContasReceber,
  useClientes,
} from '@/hooks/useFinancialData';
import {
  useTotaisContasPagar,
  useTotaisContasReceber,
} from '@/hooks/financial/useTotaisFinanceiros';
import { useAprovacoesPendentesCount } from '@/hooks/useAprovacoesPendentesCount';
import { useDivergenciasConciliacao } from '@/hooks/useDivergenciasConciliacao';
import { useBoletos } from '@/hooks/useBoletos';
import { useCobrancaKPIs } from '@/hooks/useCobrancas';
import { useAuth } from '@/hooks/useAuth';
import { toISOLocal } from '@/lib/formatters';

export interface DashboardFilters {
  empresaFilter: string;
  centroCustoFilter: string;
  periodoFluxo: string;
}

function normalizeFilterSentinel(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'all' || normalized === 'todas' || normalized === 'default') {
    return undefined;
  }
  return value;
}

export function useDashboardMetrics(filters: DashboardFilters) {
  const { empresaFilter, centroCustoFilter, periodoFluxo } = filters;
  const { currentEmpresaId } = useAuth();
  const empresaSelecionada = normalizeFilterSentinel(empresaFilter);
  const centroCustoSelecionado = normalizeFilterSentinel(centroCustoFilter);

  // Dados reais do Supabase
  const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresas();
  const { data: centrosCusto = [], isLoading: loadingCC } = useCentrosCusto();
  const { data: contasBancarias = [], isLoading: loadingBancos } = useContasBancarias();
  const { data: contasPagar = [], isLoading: loadingPagar } = useContasPagar();
  const { data: contasReceber = [], isLoading: loadingReceber } = useContasReceber();
  const { data: clientes = [], isLoading: loadingClientes } = useClientes();
  const { count: aprovacoesPendentes } = useAprovacoesPendentesCount();
  const { divergencias } = useDivergenciasConciliacao();
  const { stats: boletosStats, isLoading: loadingBoletos } = useBoletos();
  const { data: cobrancaKpis, isLoading: loadingCobranca } = useCobrancaKPIs();

  // Empresa efetiva para os totais agregados no banco: mesma precedência usada
  // no filtro client-side abaixo (seleção explícita > empresa atual > todas).
  const empresaIdParaTotais = empresaSelecionada || currentEmpresaId || null;

  // Totais agregados via RPC (SUM() no banco, sem o cap de 1000 linhas que
  // afeta contasPagarFiltradas/contasReceberFiltradas abaixo — ver B2 em
  // docs/VALIDACAO_EXAUSTIVA_R2_2026-09-03.md). Os demais derivados desta
  // hook (breakdown por centro de custo, top clientes, fluxo projetado,
  // status pie) continuam sobre a lista limitada e herdam o mesmo gap para
  // empresas com >1000 lançamentos abertos — não cobertos por este fix.
  const { data: totaisPagar, isLoading: loadingTotaisPagar } = useTotaisContasPagar(
    empresaIdParaTotais,
    centroCustoSelecionado
  );
  const { data: totaisReceber, isLoading: loadingTotaisReceber } = useTotaisContasReceber(
    empresaIdParaTotais,
    centroCustoSelecionado
  );

  const isLoading =
    loadingEmpresas ||
    loadingCC ||
    loadingBancos ||
    loadingPagar ||
    loadingReceber ||
    loadingClientes ||
    loadingBoletos ||
    loadingCobranca ||
    loadingTotaisPagar ||
    loadingTotaisReceber;

  const contasBancariasFiltradas = useMemo(() => {
    return (contasBancarias || []).filter((c) => {
      return empresaSelecionada
        ? c.empresa_id === empresaSelecionada
        : c.empresa_id === currentEmpresaId || !currentEmpresaId;
    });
  }, [contasBancarias, empresaSelecionada, currentEmpresaId]);

  const contaBancariaIdsFiltradas = useMemo(
    () => new Set(contasBancariasFiltradas.map((conta) => conta.id)),
    [contasBancariasFiltradas]
  );

  const totalDivergencias = useMemo(() => {
    return (divergencias || []).filter((d) => {
      if (!d) return false;
      return d.status === 'pendente' && contaBancariaIdsFiltradas.has(d.conta_bancaria_id);
    }).length;
  }, [divergencias, contaBancariaIdsFiltradas]);

  // Filtrar dados por empresa e centro de custo
  const contasPagarFiltradas = useMemo(() => {
    return (contasPagar || []).filter((c) => {
      const matchEmpresa = empresaSelecionada
        ? c.empresa_id === empresaSelecionada
        : c.empresa_id === currentEmpresaId || !currentEmpresaId;
      const matchCC = !centroCustoSelecionado || c.centro_custo_id === centroCustoSelecionado;
      return matchEmpresa && matchCC;
    });
  }, [contasPagar, empresaSelecionada, centroCustoSelecionado, currentEmpresaId]);

  const contasReceberFiltradas = useMemo(() => {
    return (contasReceber || []).filter((c) => {
      const matchEmpresa = empresaSelecionada
        ? c.empresa_id === empresaSelecionada
        : c.empresa_id === currentEmpresaId || !currentEmpresaId;
      const matchCC = !centroCustoSelecionado || c.centro_custo_id === centroCustoSelecionado;
      return matchEmpresa && matchCC;
    });
  }, [contasReceber, empresaSelecionada, centroCustoSelecionado, currentEmpresaId]);

  // Cálculos de KPIs
  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const saldoTotal = contasBancariasFiltradas.reduce((sum, c) => sum + c.saldo_atual, 0);

  const receitasMes = Number(totaisReceber?.receitas_mes ?? 0);
  const despesasMes = Number(totaisPagar?.despesas_mes ?? 0);
  const totalReceber = Number(totaisReceber?.total_receber ?? 0);
  const totalPagar = Number(totaisPagar?.total_pagar ?? 0);
  const totalVencidasReceber = Number(totaisReceber?.total_vencidas_receber ?? 0);
  const totalVencidasPagar = Number(totaisPagar?.total_vencidas_pagar ?? 0);

  // vencidasReceber/vencidasPagar (as listas, não os totais) alimentam
  // venceHojeReceber/Pagar e o pie chart abaixo — continuam sobre a lista
  // limitada a 1000 linhas, mesmo gap residual descrito acima.
  const vencidasReceber = contasReceberFiltradas.filter((c) => c.status === 'vencido');
  const vencidasPagar = contasPagarFiltradas.filter((c) => c.status === 'vencido');

  const inadimplencia = totalReceber > 0 ? (totalVencidasReceber / totalReceber) * 100 : 0;

  const venceHojeReceber = contasReceberFiltradas.filter((c) => {
    const dataVenc = new Date(c.data_vencimento);
    dataVenc.setHours(0, 0, 0, 0);
    return dataVenc.getTime() === hoje.getTime() && c.status === 'pendente';
  });

  const venceHojePagar = contasPagarFiltradas.filter((c) => {
    const dataVenc = new Date(c.data_vencimento);
    dataVenc.setHours(0, 0, 0, 0);
    return dataVenc.getTime() === hoje.getTime() && c.status === 'pendente';
  });

  // Status das contas para gráfico de pizza
  const COLORS = useMemo(
    () => [
      'hsl(150, 70%, 42%)',
      'hsl(42, 95%, 48%)',
      'hsl(0, 78%, 55%)',
      'hsl(215, 90%, 52%)',
      'hsl(275, 75%, 48%)',
    ],
    []
  );

  const statusContasPagar = useMemo(() => {
    const counts = { pago: 0, pendente: 0, vencido: 0, parcial: 0 };
    contasPagarFiltradas.forEach((c) => {
      if (counts[c.status as keyof typeof counts] !== undefined) {
        counts[c.status as keyof typeof counts]++;
      }
    });
    return [
      { name: 'Pagas', value: counts.pago, fill: COLORS[0] },
      { name: 'Pendentes', value: counts.pendente, fill: COLORS[1] },
      { name: 'Vencidas', value: counts.vencido, fill: COLORS[2] },
      { name: 'Parciais', value: counts.parcial, fill: COLORS[3] },
    ].filter((s) => s.value > 0);
  }, [contasPagarFiltradas, COLORS]);

  // Dados por centro de custo
  const dadosPorCentroCusto = useMemo(() => {
    const map = new Map<string, { nome: string; pagar: number; receber: number; saldo: number }>();

    contasPagarFiltradas.forEach((c) => {
      const ccId = c.centro_custo_id || 'sem-cc';
      const ccNome =
        (c as { centro_custo?: string; centros_custo?: { nome?: string } }).centro_custo ||
        (c as { centros_custo?: { nome?: string } }).centros_custo?.nome ||
        'Sem Centro de Custo';
      if (!map.has(ccId)) {
        map.set(ccId, { nome: ccNome, pagar: 0, receber: 0, saldo: 0 });
      }
      const current = map.get(ccId)!;
      if (c.status !== 'pago' && c.status !== 'cancelado') {
        current.pagar += c.valor - (c.valor_pago || 0);
      }
    });

    contasReceberFiltradas.forEach((c) => {
      const ccId = c.centro_custo_id || 'sem-cc';
      const ccNome =
        (c as { centro_custo?: string; centros_custo?: { nome?: string } }).centro_custo ||
        (c as { centros_custo?: { nome?: string } }).centros_custo?.nome ||
        'Sem Centro de Custo';
      if (!map.has(ccId)) {
        map.set(ccId, { nome: ccNome, pagar: 0, receber: 0, saldo: 0 });
      }
      const current = map.get(ccId)!;
      if (c.status !== 'pago' && c.status !== 'cancelado') {
        current.receber += c.valor - (c.valor_recebido || 0);
      }
    });

    return Array.from(map.values())
      .map((cc) => ({
        ...cc,
        saldo: cc.receber - cc.pagar,
      }))
      .sort((a, b) => b.saldo - a.saldo);
  }, [contasPagarFiltradas, contasReceberFiltradas]);

  // Top 10 clientes por receita
  const topClientesReceita = useMemo(() => {
    const clienteReceitas = new Map<
      string,
      {
        id: string;
        nome: string;
        nomeFantasia: string | null;
        receita: number;
        pagos: number;
        pendentes: number;
        score: number | null;
      }
    >();

    contasReceberFiltradas.forEach((conta) => {
      const clienteId = conta.cliente_id || 'sem-cliente';
      const clienteNome = conta.cliente_nome || 'Cliente não identificado';
      const clienteData = clientes.find((c) => c.id === clienteId);

      if (!clienteReceitas.has(clienteId)) {
        clienteReceitas.set(clienteId, {
          id: clienteId,
          nome: clienteNome,
          nomeFantasia: clienteData?.nome_fantasia || null,
          receita: 0,
          pagos: 0,
          pendentes: 0,
          score: clienteData?.score || null,
        });
      }

      const current = clienteReceitas.get(clienteId)!;
      current.receita += conta.valor;

      if (conta.status === 'pago') {
        current.pagos += conta.valor_recebido || conta.valor;
      } else if (conta.status !== 'cancelado') {
        current.pendentes += conta.valor - (conta.valor_recebido || 0);
      }
    });

    return Array.from(clienteReceitas.values())
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10)
      .map((cliente, index) => ({
        ...cliente,
        posicao: index + 1,
        adimplencia: cliente.receita > 0 ? (cliente.pagos / cliente.receita) * 100 : 0,
      }));
  }, [contasReceberFiltradas, clientes]);

  // Fluxo de caixa projetado
  const fluxoCaixaProjetado = useMemo(() => {
    const dias = parseInt(periodoFluxo);
    const result = [];
    let saldoAcumulado = saldoTotal;

    for (let i = 0; i < dias; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() + i);
      const dataStr = toISOLocal(data);

      const receitasDia = contasReceberFiltradas
        .filter(
          (c) => c.data_vencimento === dataStr && c.status !== 'pago' && c.status !== 'cancelado'
        )
        .reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);

      const despesasDia = contasPagarFiltradas
        .filter(
          (c) => c.data_vencimento === dataStr && c.status !== 'pago' && c.status !== 'cancelado'
        )
        .reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);

      saldoAcumulado = saldoAcumulado + receitasDia - despesasDia;

      result.push({
        data: dataStr,
        receitas: receitasDia,
        despesas: despesasDia,
        saldo: saldoAcumulado,
      });
    }

    return result;
  }, [contasPagarFiltradas, contasReceberFiltradas, saldoTotal, periodoFluxo, hoje]);

  return {
    // Loading
    isLoading,
    // Data sources
    empresas,
    centrosCusto,
    contasBancarias,
    contasBancariasFiltradas,
    contasPagarFiltradas,
    contasReceberFiltradas,
    clientes,
    aprovacoesPendentes,
    // KPIs
    saldoTotal,
    receitasMes,
    despesasMes,
    totalReceber,
    totalPagar,
    totalVencidasReceber,
    totalVencidasPagar,
    inadimplencia,
    venceHojeReceber,
    venceHojePagar,
    vencidasReceber,
    vencidasPagar,
    // Computed
    statusContasPagar,
    dadosPorCentroCusto,
    topClientesReceita,
    fluxoCaixaProjetado,
    totalDivergencias,
    boletosStats,
    cobrancaKpis,
  };
}
