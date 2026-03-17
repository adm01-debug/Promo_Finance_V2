import { useMemo } from 'react';
import { useEmpresas, useCentrosCusto, useContasBancarias, useContasPagar, useContasReceber, useClientes } from '@/hooks/useFinancialData';
import { useAprovacoesPendentesCount } from '@/hooks/useAprovacoesPendentesCount';

export interface DashboardFilters {
  empresaFilter: string;
  centroCustoFilter: string;
  periodoFluxo: string;
}

export function useDashboardMetrics(filters: DashboardFilters) {
  const { empresaFilter, centroCustoFilter, periodoFluxo } = filters;
  
  // Dados reais do Supabase
  const { data: empresas = [], isLoading: loadingEmpresas } = useEmpresas();
  const { data: centrosCusto = [], isLoading: loadingCC } = useCentrosCusto();
  const { data: contasBancarias = [], isLoading: loadingBancos } = useContasBancarias();
  const { data: contasPagar = [], isLoading: loadingPagar } = useContasPagar();
  const { data: contasReceber = [], isLoading: loadingReceber } = useContasReceber();
  const { data: clientes = [], isLoading: loadingClientes } = useClientes();
  const { count: aprovacoesPendentes } = useAprovacoesPendentesCount();

  const isLoading = loadingEmpresas || loadingCC || loadingBancos || loadingPagar || loadingReceber || loadingClientes;

  // Filtrar dados por empresa e centro de custo
  const contasPagarFiltradas = useMemo(() => {
    return contasPagar.filter(c => {
      const matchEmpresa = empresaFilter === 'all' || c.empresa_id === empresaFilter;
      const matchCC = centroCustoFilter === 'all' || c.centro_custo_id === centroCustoFilter;
      return matchEmpresa && matchCC;
    });
  }, [contasPagar, empresaFilter, centroCustoFilter]);

  const contasReceberFiltradas = useMemo(() => {
    return contasReceber.filter(c => {
      const matchEmpresa = empresaFilter === 'all' || c.empresa_id === empresaFilter;
      const matchCC = centroCustoFilter === 'all' || c.centro_custo_id === centroCustoFilter;
      return matchEmpresa && matchCC;
    });
  }, [contasReceber, empresaFilter, centroCustoFilter]);

  const contasBancariasFiltradas = useMemo(() => {
    return contasBancarias.filter(c => {
      return empresaFilter === 'all' || c.empresa_id === empresaFilter;
    });
  }, [contasBancarias, empresaFilter]);

  // Cálculos de KPIs
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const saldoTotal = contasBancariasFiltradas.reduce((sum, c) => sum + c.saldo_atual, 0);
  
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const receitasMes = contasReceberFiltradas
    .filter(c => {
      const dataRec = c.data_recebimento ? new Date(c.data_recebimento) : null;
      return dataRec && dataRec.getMonth() === mesAtual && dataRec.getFullYear() === anoAtual;
    })
    .reduce((sum, c) => sum + (c.valor_recebido || 0), 0);

  const despesasMes = contasPagarFiltradas
    .filter(c => {
      const dataPag = c.data_pagamento ? new Date(c.data_pagamento) : null;
      return dataPag && dataPag.getMonth() === mesAtual && dataPag.getFullYear() === anoAtual;
    })
    .reduce((sum, c) => sum + (c.valor_pago || 0), 0);

  const totalReceber = contasReceberFiltradas
    .filter(c => c.status !== 'pago' && c.status !== 'cancelado')
    .reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);

  const totalPagar = contasPagarFiltradas
    .filter(c => c.status !== 'pago' && c.status !== 'cancelado')
    .reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);

  const vencidasReceber = contasReceberFiltradas.filter(c => c.status === 'vencido');
  const vencidasPagar = contasPagarFiltradas.filter(c => c.status === 'vencido');
  
  const totalVencidasReceber = vencidasReceber.reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
  const totalVencidasPagar = vencidasPagar.reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);

  const inadimplencia = totalReceber > 0 ? (totalVencidasReceber / totalReceber) * 100 : 0;

  const venceHojeReceber = contasReceberFiltradas.filter(c => {
    const dataVenc = new Date(c.data_vencimento);
    dataVenc.setHours(0, 0, 0, 0);
    return dataVenc.getTime() === hoje.getTime() && c.status === 'pendente';
  });

  const venceHojePagar = contasPagarFiltradas.filter(c => {
    const dataVenc = new Date(c.data_vencimento);
    dataVenc.setHours(0, 0, 0, 0);
    return dataVenc.getTime() === hoje.getTime() && c.status === 'pendente';
  });

  // Status das contas para gráfico de pizza
  const COLORS = ['hsl(150, 70%, 42%)', 'hsl(42, 95%, 48%)', 'hsl(0, 78%, 55%)', 'hsl(215, 90%, 52%)', 'hsl(275, 75%, 48%)'];
  
  const statusContasPagar = useMemo(() => {
    const counts = { pago: 0, pendente: 0, vencido: 0, parcial: 0 };
    contasPagarFiltradas.forEach(c => {
      if (counts[c.status as keyof typeof counts] !== undefined) {
        counts[c.status as keyof typeof counts]++;
      }
    });
    return [
      { name: 'Pagas', value: counts.pago, fill: COLORS[0] },
      { name: 'Pendentes', value: counts.pendente, fill: COLORS[1] },
      { name: 'Vencidas', value: counts.vencido, fill: COLORS[2] },
      { name: 'Parciais', value: counts.parcial, fill: COLORS[3] },
    ].filter(s => s.value > 0);
  }, [contasPagarFiltradas]);

  // Dados por centro de custo
  const dadosPorCentroCusto = useMemo(() => {
    const map = new Map<string, { nome: string; pagar: number; receber: number; saldo: number }>();
    
    contasPagarFiltradas.forEach(c => {
      const ccId = c.centro_custo_id || 'sem-cc';
      const ccNome = (c as any).centro_custo || (c as any).centros_custo?.nome || 'Sem Centro de Custo';
      if (!map.has(ccId)) {
        map.set(ccId, { nome: ccNome, pagar: 0, receber: 0, saldo: 0 });
      }
      const current = map.get(ccId)!;
      if (c.status !== 'pago' && c.status !== 'cancelado') {
        current.pagar += c.valor - (c.valor_pago || 0);
      }
    });

    contasReceberFiltradas.forEach(c => {
      const ccId = c.centro_custo_id || 'sem-cc';
      const centroCusto = c.centros_custo as { nome?: string } | null;
      const ccNome = centroCusto?.nome || 'Sem Centro de Custo';
      if (!map.has(ccId)) {
        map.set(ccId, { nome: ccNome, pagar: 0, receber: 0, saldo: 0 });
      }
      const current = map.get(ccId)!;
      if (c.status !== 'pago' && c.status !== 'cancelado') {
        current.receber += c.valor - (c.valor_recebido || 0);
      }
    });

    return Array.from(map.values()).map(cc => ({
      ...cc,
      saldo: cc.receber - cc.pagar
    })).sort((a, b) => b.saldo - a.saldo);
  }, [contasPagarFiltradas, contasReceberFiltradas]);

  // Top 10 clientes por receita
  const topClientesReceita = useMemo(() => {
    const clienteReceitas = new Map<string, { 
      id: string;
      nome: string;
      nomeFantasia: string | null;
      receita: number;
      pagos: number;
      pendentes: number;
      score: number | null;
    }>();

    contasReceberFiltradas.forEach(conta => {
      const clienteId = conta.cliente_id || 'sem-cliente';
      const clienteNome = conta.cliente_nome || 'Cliente não identificado';
      const clienteData = clientes.find(c => c.id === clienteId);
      
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
        adimplencia: cliente.receita > 0 ? ((cliente.pagos / cliente.receita) * 100) : 0,
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
      const dataStr = data.toISOString().split('T')[0];

      const receitasDia = contasReceberFiltradas
        .filter(c => c.data_vencimento === dataStr && c.status !== 'pago' && c.status !== 'cancelado')
        .reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);

      const despesasDia = contasPagarFiltradas
        .filter(c => c.data_vencimento === dataStr && c.status !== 'pago' && c.status !== 'cancelado')
        .reduce((sum, c) => sum + c.valor - (c.valor_pago || 0), 0);

      saldoAcumulado = saldoAcumulado + receitasDia - despesasDia;

      result.push({
        data: dataStr,
        receitas: receitasDia,
        despesas: despesasDia,
        saldo: saldoAcumulado
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
  };
}
