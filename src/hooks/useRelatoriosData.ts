import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface ComparativoPeriodo {
  mes: string;
  atual: number;
  anterior: number;
}

export interface FluxoMensal {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface DespesaCategoria {
  nome: string;
  valor: number;
  percentual: number;
}

export interface ReceitaCliente {
  cliente: string;
  valor: number;
  percentual: number;
}

export interface InadimplenciaMes {
  mes: string;
  taxa: number;
  valor: number;
}

export function useComparativoPeriodos(meses: number = 6) {
  return useQuery({
    queryKey: ['comparativo-periodos', meses],
    queryFn: async (): Promise<ComparativoPeriodo[]> => {
      const hoje = new Date();
      const resultados: ComparativoPeriodo[] = [];

      for (let i = meses - 1; i >= 0; i--) {
        const mesAtual = subMonths(hoje, i);
        const mesAnterior = subMonths(mesAtual, 12); // Mesmo mês do ano anterior
        
        const inicioAtual = startOfMonth(mesAtual);
        const fimAtual = endOfMonth(mesAtual);
        const inicioAnterior = startOfMonth(mesAnterior);
        const fimAnterior = endOfMonth(mesAnterior);

        const [receitasAtuais, receitasAnteriores] = await Promise.all([
          supabase.from('contas_receber')
            .select('valor_recebido')
            .gte('data_recebimento', inicioAtual.toISOString())
            .lte('data_recebimento', fimAtual.toISOString())
            .eq('status', 'pago'),
          supabase.from('contas_receber')
            .select('valor_recebido')
            .gte('data_recebimento', inicioAnterior.toISOString())
            .lte('data_recebimento', fimAnterior.toISOString())
            .eq('status', 'pago'),
        ]);

        resultados.push({
          mes: format(mesAtual, 'MMM'),
          atual: receitasAtuais.data?.reduce((sum, c) => sum + (c.valor_recebido || 0), 0) || 0,
          anterior: receitasAnteriores.data?.reduce((sum, c) => sum + (c.valor_recebido || 0), 0) || 0,
        });
      }

      return resultados;
    },
  });
}

export function useFluxoMensal(meses: number = 6) {
  return useQuery({
    queryKey: ['fluxo-mensal', meses],
    queryFn: async (): Promise<FluxoMensal[]> => {
      const hoje = new Date();
      const resultados: FluxoMensal[] = [];

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
          saldo: totalReceitas - totalDespesas,
        });
      }

      return resultados;
    },
  });
}

export function useDespesasPorCategoria() {
  return useQuery({
    queryKey: ['despesas-por-categoria'],
    queryFn: async (): Promise<DespesaCategoria[]> => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('valor_pago, centros_custo(nome)')
        .eq('status', 'pago')
        .not('centro_custo_id', 'is', null);

      if (error) throw error;

      // Aggregate by category
      const categorias: Record<string, number> = {};
      (data || []).forEach(c => {
        const nome = (c.centros_custo as any)?.nome || 'Outros';
        categorias[nome] = (categorias[nome] || 0) + (c.valor_pago || 0);
      });

      const total = Object.values(categorias).reduce((sum, v) => sum + v, 0);

      return Object.entries(categorias)
        .map(([nome, valor]) => ({
          nome,
          valor,
          percentual: total > 0 ? (valor / total) * 100 : 0,
        }))
        .sort((a, b) => b.valor - a.valor);
    },
  });
}

export function useReceitasPorCliente(limit: number = 6) {
  return useQuery({
    queryKey: ['receitas-por-cliente', limit],
    queryFn: async (): Promise<ReceitaCliente[]> => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('cliente_nome, valor_recebido')
        .eq('status', 'pago');

      if (error) throw error;

      // Aggregate by client
      const clientes: Record<string, number> = {};
      (data || []).forEach(c => {
        clientes[c.cliente_nome] = (clientes[c.cliente_nome] || 0) + (c.valor_recebido || 0);
      });

      const total = Object.values(clientes).reduce((sum, v) => sum + v, 0);

      const sorted = Object.entries(clientes)
        .map(([cliente, valor]) => ({
          cliente,
          valor,
          percentual: total > 0 ? (valor / total) * 100 : 0,
        }))
        .sort((a, b) => b.valor - a.valor);

      // Take top N and group rest as "Outros"
      if (sorted.length <= limit) return sorted;

      const topClientes = sorted.slice(0, limit - 1);
      const outros = sorted.slice(limit - 1).reduce(
        (acc, c) => ({ cliente: 'Outros', valor: acc.valor + c.valor, percentual: 0 }),
        { cliente: 'Outros', valor: 0, percentual: 0 }
      );
      outros.percentual = total > 0 ? (outros.valor / total) * 100 : 0;

      return [...topClientes, outros];
    },
  });
}

export function useInadimplenciaPorMes(meses: number = 6) {
  return useQuery({
    queryKey: ['inadimplencia-por-mes', meses],
    queryFn: async (): Promise<InadimplenciaMes[]> => {
      const hoje = new Date();
      const resultados: InadimplenciaMes[] = [];

      for (let i = meses - 1; i >= 0; i--) {
        const data = subMonths(hoje, i);
        const inicio = startOfMonth(data);
        const fim = endOfMonth(data);
        const mesNome = format(data, 'MMM');

        const [total, vencidos] = await Promise.all([
          supabase.from('contas_receber')
            .select('valor')
            .gte('data_vencimento', inicio.toISOString())
            .lte('data_vencimento', fim.toISOString()),
          supabase.from('contas_receber')
            .select('valor')
            .gte('data_vencimento', inicio.toISOString())
            .lte('data_vencimento', fim.toISOString())
            .eq('status', 'vencido'),
        ]);

        const totalValor = total.data?.reduce((sum, c) => sum + c.valor, 0) || 0;
        const valorVencido = vencidos.data?.reduce((sum, c) => sum + c.valor, 0) || 0;
        const taxa = totalValor > 0 ? (valorVencido / totalValor) * 100 : 0;

        resultados.push({
          mes: mesNome,
          taxa,
          valor: valorVencido,
        });
      }

      return resultados;
    },
  });
}

export function useRelatorioKPIs(periodoInicio: string, periodoFim: string) {
  return useQuery({
    queryKey: ['relatorio-kpis', periodoInicio, periodoFim],
    queryFn: async () => {
      const [receitas, despesas] = await Promise.all([
        supabase.from('contas_receber')
          .select('valor_recebido')
          .gte('data_recebimento', periodoInicio)
          .lte('data_recebimento', periodoFim)
          .eq('status', 'pago'),
        supabase.from('contas_pagar')
          .select('valor_pago')
          .gte('data_pagamento', periodoInicio)
          .lte('data_pagamento', periodoFim)
          .eq('status', 'pago'),
      ]);

      const totalReceitas = receitas.data?.reduce((sum, c) => sum + (c.valor_recebido || 0), 0) || 0;
      const totalDespesas = despesas.data?.reduce((sum, c) => sum + (c.valor_pago || 0), 0) || 0;

      return {
        totalReceitas,
        totalDespesas,
        saldoPeriodo: totalReceitas - totalDespesas,
      };
    },
    enabled: !!periodoInicio && !!periodoFim,
  });
}
