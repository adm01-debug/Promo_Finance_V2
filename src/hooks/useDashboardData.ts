import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from 'date-fns';

export interface DashboardKPIs {
  saldoTotal: number;
  saldoTotalVariacao: number;
  receitasMes: number;
  receitasMesVariacao: number;
  despesasMes: number;
  despesasMesVariacao: number;
  inadimplencia: number;
  inadimplenciaVariacao: number;
  contasReceberHoje: number;
  contasPagarHoje: number;
  contasReceberVencidas: number;
  contasPagarVencidas: number;
  totalEmpresas: number;
  totalContasBancarias: number;
  totalAlertas: number;
}

export interface ContaBancariaSaldo {
  id: string;
  banco: string;
  saldo: number;
  disponivel: number;
  cor: string;
}

export interface FluxoProjetado {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface StatusConta {
  name: string;
  value: number;
  fill: string;
}

export interface EvolucaoMensal {
  mes: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async (): Promise<DashboardKPIs> => {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje);
      const fimMes = endOfMonth(hoje);
      const inicioMesAnterior = startOfMonth(subMonths(hoje, 1));
      const fimMesAnterior = endOfMonth(subMonths(hoje, 1));
      const inicioHoje = startOfDay(hoje);
      const fimHoje = endOfDay(hoje);

      // Fetch all data in parallel
      const [
        contasBancarias,
        contasReceberMes,
        contasReceberMesAnterior,
        contasPagarMes,
        contasPagarMesAnterior,
        contasReceberVencidas,
        contasPagarVencidas,
        contasReceberHoje,
        contasPagarHoje,
        empresas,
        alertasNaoLidos,
      ] = await Promise.all([
        supabase.from('contas_bancarias').select('saldo_atual').eq('ativo', true),
        supabase.from('contas_receber').select('valor, valor_recebido, status')
          .gte('data_recebimento', inicioMes.toISOString())
          .lte('data_recebimento', fimMes.toISOString())
          .eq('status', 'pago'),
        supabase.from('contas_receber').select('valor_recebido')
          .gte('data_recebimento', inicioMesAnterior.toISOString())
          .lte('data_recebimento', fimMesAnterior.toISOString())
          .eq('status', 'pago'),
        supabase.from('contas_pagar').select('valor, valor_pago, status')
          .gte('data_pagamento', inicioMes.toISOString())
          .lte('data_pagamento', fimMes.toISOString())
          .eq('status', 'pago'),
        supabase.from('contas_pagar').select('valor_pago')
          .gte('data_pagamento', inicioMesAnterior.toISOString())
          .lte('data_pagamento', fimMesAnterior.toISOString())
          .eq('status', 'pago'),
        supabase.from('contas_receber').select('id').eq('status', 'vencido'),
        supabase.from('contas_pagar').select('id').eq('status', 'vencido'),
        supabase.from('contas_receber').select('id')
          .eq('data_vencimento', format(hoje, 'yyyy-MM-dd'))
          .neq('status', 'pago'),
        supabase.from('contas_pagar').select('id')
          .eq('data_vencimento', format(hoje, 'yyyy-MM-dd'))
          .neq('status', 'pago'),
        supabase.from('empresas').select('id').eq('ativo', true),
        supabase.from('alertas').select('id').eq('lido', false),
      ]);

      // Calculate saldo total
      const saldoTotal = contasBancarias.data?.reduce((sum, c) => sum + (c.saldo_atual || 0), 0) || 0;

      // Calculate receitas
      const receitasMes = contasReceberMes.data?.reduce((sum, c) => sum + (c.valor_recebido || 0), 0) || 0;
      const receitasMesAnterior = contasReceberMesAnterior.data?.reduce((sum, c) => sum + (c.valor_recebido || 0), 0) || 0;
      const receitasMesVariacao = receitasMesAnterior > 0 
        ? ((receitasMes - receitasMesAnterior) / receitasMesAnterior) * 100 
        : 0;

      // Calculate despesas
      const despesasMes = contasPagarMes.data?.reduce((sum, c) => sum + (c.valor_pago || 0), 0) || 0;
      const despesasMesAnterior = contasPagarMesAnterior.data?.reduce((sum, c) => sum + (c.valor_pago || 0), 0) || 0;
      const despesasMesVariacao = despesasMesAnterior > 0 
        ? ((despesasMes - despesasMesAnterior) / despesasMesAnterior) * 100 
        : 0;

      // Calculate inadimplência
      const totalReceber = receitasMes + (contasReceberVencidas.data?.length || 0);
      const inadimplencia = totalReceber > 0 
        ? ((contasReceberVencidas.data?.length || 0) / totalReceber) * 100 
        : 0;

      return {
        saldoTotal,
        saldoTotalVariacao: 0, // Would need historical data
        receitasMes,
        receitasMesVariacao,
        despesasMes,
        despesasMesVariacao,
        inadimplencia,
        inadimplenciaVariacao: 0,
        contasReceberHoje: contasReceberHoje.data?.length || 0,
        contasPagarHoje: contasPagarHoje.data?.length || 0,
        contasReceberVencidas: contasReceberVencidas.data?.length || 0,
        contasPagarVencidas: contasPagarVencidas.data?.length || 0,
        totalEmpresas: empresas.data?.length || 0,
        totalContasBancarias: contasBancarias.data?.length || 0,
        totalAlertas: alertasNaoLidos.data?.length || 0,
      };
    },
    staleTime: 60000, // 1 minute
  });
}

export function useSaldosPorBanco() {
  return useQuery({
    queryKey: ['saldos-por-banco'],
    queryFn: async (): Promise<ContaBancariaSaldo[]> => {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('id, banco, saldo_atual, saldo_disponivel, cor')
        .eq('ativo', true)
        .order('saldo_atual', { ascending: false });

      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        banco: c.banco,
        saldo: c.saldo_atual,
        disponivel: c.saldo_disponivel,
        cor: c.cor || '#3B82F6',
      }));
    },
  });
}

export function useFluxoCaixaProjetadoDashboard(dias: number = 30) {
  return useQuery({
    queryKey: ['fluxo-caixa-dashboard', dias],
    queryFn: async (): Promise<FluxoProjetado[]> => {
      const hoje = new Date();
      const dataFim = new Date(hoje);
      dataFim.setDate(dataFim.getDate() + dias);

      // Fetch accounts receivable and payable
      const [contasReceber, contasPagar, saldoInicial] = await Promise.all([
        supabase.from('contas_receber')
          .select('valor, data_vencimento')
          .gte('data_vencimento', format(hoje, 'yyyy-MM-dd'))
          .lte('data_vencimento', format(dataFim, 'yyyy-MM-dd'))
          .in('status', ['pendente', 'vencido', 'parcial']),
        supabase.from('contas_pagar')
          .select('valor, data_vencimento')
          .gte('data_vencimento', format(hoje, 'yyyy-MM-dd'))
          .lte('data_vencimento', format(dataFim, 'yyyy-MM-dd'))
          .in('status', ['pendente', 'vencido', 'parcial']),
        supabase.from('contas_bancarias')
          .select('saldo_atual')
          .eq('ativo', true),
      ]);

      const saldo = saldoInicial.data?.reduce((sum, c) => sum + (c.saldo_atual || 0), 0) || 0;

      // Build daily projection
      const projecao: FluxoProjetado[] = [];
      let saldoAcumulado = saldo;

      for (let i = 0; i < dias; i++) {
        const data = new Date(hoje);
        data.setDate(data.getDate() + i);
        const dataStr = format(data, 'yyyy-MM-dd');

        const receitasDia = contasReceber.data
          ?.filter(c => c.data_vencimento === dataStr)
          .reduce((sum, c) => sum + c.valor, 0) || 0;

        const despesasDia = contasPagar.data
          ?.filter(c => c.data_vencimento === dataStr)
          .reduce((sum, c) => sum + c.valor, 0) || 0;

        saldoAcumulado += receitasDia - despesasDia;

        projecao.push({
          data: dataStr,
          receitas: receitasDia,
          despesas: despesasDia,
          saldo: saldoAcumulado,
        });
      }

      return projecao;
    },
  });
}

export function useEvolucaoMensal(meses: number = 6) {
  return useQuery({
    queryKey: ['evolucao-mensal', meses],
    queryFn: async (): Promise<EvolucaoMensal[]> => {
      const hoje = new Date();
      const resultados: EvolucaoMensal[] = [];

      for (let i = meses - 1; i >= 0; i--) {
        const data = subMonths(hoje, i);
        const inicio = startOfMonth(data);
        const fim = endOfMonth(data);
        const mesNome = format(data, 'MMM');

        const [receitas, despesas] = await Promise.all([
          supabase.from('contas_receber')
            .select('valor_recebido')
            .gte('data_recebimento', inicio.toISOString())
            .lte('data_recebimento', fim.toISOString())
            .eq('status', 'pago'),
          supabase.from('contas_pagar')
            .select('valor_pago')
            .gte('data_pagamento', inicio.toISOString())
            .lte('data_pagamento', fim.toISOString())
            .eq('status', 'pago'),
        ]);

        const totalReceitas = receitas.data?.reduce((sum, c) => sum + (c.valor_recebido || 0), 0) || 0;
        const totalDespesas = despesas.data?.reduce((sum, c) => sum + (c.valor_pago || 0), 0) || 0;

        resultados.push({
          mes: mesNome,
          receitas: totalReceitas,
          despesas: totalDespesas,
          lucro: totalReceitas - totalDespesas,
        });
      }

      return resultados;
    },
  });
}

export function useStatusContas() {
  return useQuery({
    queryKey: ['status-contas'],
    queryFn: async (): Promise<StatusConta[]> => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('status');

      if (error) throw error;

      const counts = (data || []).reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return [
        { name: 'Pagas', value: counts['pago'] || 0, fill: 'hsl(150, 70%, 42%)' },
        { name: 'Pendentes', value: counts['pendente'] || 0, fill: 'hsl(42, 95%, 48%)' },
        { name: 'Vencidas', value: counts['vencido'] || 0, fill: 'hsl(0, 78%, 55%)' },
        { name: 'Parciais', value: counts['parcial'] || 0, fill: 'hsl(215, 90%, 52%)' },
      ];
    },
  });
}

export function useCentrosCustoDistribuicao() {
  return useQuery({
    queryKey: ['centros-custo-distribuicao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('centros_custo')
        .select('id, nome, orcamento_previsto, orcamento_realizado')
        .eq('ativo', true)
        .order('orcamento_realizado', { ascending: false });

      if (error) throw error;

      const total = (data || []).reduce((sum, c) => sum + (c.orcamento_realizado || 0), 0);

      return (data || []).map(c => ({
        nome: c.nome,
        valor: c.orcamento_realizado || 0,
        percentual: total > 0 ? ((c.orcamento_realizado || 0) / total) * 100 : 0,
        orcado: c.orcamento_previsto || 0,
      }));
    },
  });
}

export function useTopDevedoresDashboard(limit: number = 5) {
  return useQuery({
    queryKey: ['top-devedores-dashboard', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('cliente_nome, valor, data_vencimento, clientes(score)')
        .eq('status', 'vencido')
        .order('valor', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const hoje = new Date();
      return (data || []).map(c => {
        const vencimento = new Date(c.data_vencimento);
        const diasAtraso = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
        return {
          cliente: c.cliente_nome,
          valor: c.valor,
          diasAtraso: diasAtraso > 0 ? diasAtraso : 0,
          score: (c.clientes as any)?.score || 0,
        };
      });
    },
  });
}
