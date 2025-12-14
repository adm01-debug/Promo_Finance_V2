import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';
import { 
  ProjecaoDiaria, 
  ProjecaoCenario, 
  CenarioTipo,
  gerarTodasProjecoes as gerarTodasProjecoesLib 
} from '@/lib/cashflow-scenarios';

export interface FluxoKPIs {
  saldoTotal: number;
  totalReceber: number;
  totalPagar: number;
  previsaoSaldo30d: number;
}

export function useFluxoCaixaKPIs() {
  return useQuery({
    queryKey: ['fluxo-caixa-kpis'],
    queryFn: async (): Promise<FluxoKPIs> => {
      // Buscar saldo total das contas bancárias
      const { data: contas, error: errorContas } = await supabase
        .from('contas_bancarias')
        .select('saldo_atual')
        .eq('ativo', true);

      if (errorContas) throw errorContas;

      const saldoTotal = (contas || []).reduce((sum, c) => sum + (c.saldo_atual || 0), 0);

      // Buscar total a receber (pendentes)
      const { data: receber, error: errorReceber } = await supabase
        .from('contas_receber')
        .select('valor, valor_recebido')
        .in('status', ['pendente', 'vencido', 'parcial']);

      if (errorReceber) throw errorReceber;

      const totalReceber = (receber || []).reduce((sum, c) => sum + (c.valor - (c.valor_recebido || 0)), 0);

      // Buscar total a pagar (pendentes)
      const { data: pagar, error: errorPagar } = await supabase
        .from('contas_pagar')
        .select('valor, valor_pago')
        .in('status', ['pendente', 'vencido', 'parcial']);

      if (errorPagar) throw errorPagar;

      const totalPagar = (pagar || []).reduce((sum, c) => sum + (c.valor - (c.valor_pago || 0)), 0);

      // Previsão de saldo em 30 dias
      const previsaoSaldo30d = saldoTotal + totalReceber - totalPagar;

      return {
        saldoTotal,
        totalReceber,
        totalPagar,
        previsaoSaldo30d,
      };
    },
  });
}

export function useFluxoCaixaProjetado(dias: number = 30) {
  return useQuery({
    queryKey: ['fluxo-caixa-projetado', dias],
    queryFn: async (): Promise<ProjecaoDiaria[]> => {
      const hoje = new Date();
      const dataFim = addDays(hoje, dias);
      const hojeStr = format(hoje, 'yyyy-MM-dd');
      const dataFimStr = format(dataFim, 'yyyy-MM-dd');

      // Buscar saldo inicial das contas bancárias
      const { data: contas, error: errorContas } = await supabase
        .from('contas_bancarias')
        .select('saldo_atual')
        .eq('ativo', true);

      if (errorContas) throw errorContas;

      const saldoInicial = (contas || []).reduce((sum, c) => sum + (c.saldo_atual || 0), 0);

      // Buscar contas a receber no período
      const { data: receber, error: errorReceber } = await supabase
        .from('contas_receber')
        .select('id, valor, valor_recebido, data_vencimento')
        .gte('data_vencimento', hojeStr)
        .lte('data_vencimento', dataFimStr)
        .in('status', ['pendente', 'vencido', 'parcial']);

      if (errorReceber) throw errorReceber;

      // Buscar contas a pagar no período
      const { data: pagar, error: errorPagar } = await supabase
        .from('contas_pagar')
        .select('id, valor, valor_pago, data_vencimento')
        .gte('data_vencimento', hojeStr)
        .lte('data_vencimento', dataFimStr)
        .in('status', ['pendente', 'vencido', 'parcial']);

      if (errorPagar) throw errorPagar;

      // Agrupar por data
      const fluxoPorData: Record<string, { receitas: number; despesas: number }> = {};

      // Inicializar todos os dias
      for (let i = 0; i <= dias; i++) {
        const data = format(addDays(hoje, i), 'yyyy-MM-dd');
        fluxoPorData[data] = { receitas: 0, despesas: 0 };
      }

      // Agregar receitas
      (receber || []).forEach(conta => {
        const data = conta.data_vencimento;
        if (fluxoPorData[data]) {
          fluxoPorData[data].receitas += conta.valor - (conta.valor_recebido || 0);
        }
      });

      // Agregar despesas
      (pagar || []).forEach(conta => {
        const data = conta.data_vencimento;
        if (fluxoPorData[data]) {
          fluxoPorData[data].despesas += conta.valor - (conta.valor_pago || 0);
        }
      });

      // Calcular saldo acumulado
      let saldoAcumulado = saldoInicial;
      const resultado: ProjecaoDiaria[] = [];

      Object.keys(fluxoPorData).sort().forEach(data => {
        const { receitas, despesas } = fluxoPorData[data];
        saldoAcumulado = saldoAcumulado + receitas - despesas;
        resultado.push({
          data,
          receitas,
          despesas,
          saldo: saldoAcumulado,
        });
      });

      return resultado;
    },
  });
}

export function useFluxoCaixaHistorico(dias: number = 30) {
  return useQuery({
    queryKey: ['fluxo-caixa-historico', dias],
    queryFn: async (): Promise<ProjecaoDiaria[]> => {
      const hoje = new Date();
      const dataInicio = addDays(hoje, -dias);
      const dataInicioStr = format(dataInicio, 'yyyy-MM-dd');
      const hojeStr = format(hoje, 'yyyy-MM-dd');

      // Buscar transações bancárias do período
      const { data: transacoes, error } = await supabase
        .from('transacoes_bancarias')
        .select('data, valor, tipo, saldo')
        .gte('data', dataInicioStr)
        .lte('data', hojeStr)
        .order('data', { ascending: true });

      if (error) throw error;

      // Agrupar por data
      const fluxoPorData: Record<string, { receitas: number; despesas: number; ultimoSaldo: number }> = {};

      (transacoes || []).forEach(t => {
        if (!fluxoPorData[t.data]) {
          fluxoPorData[t.data] = { receitas: 0, despesas: 0, ultimoSaldo: 0 };
        }
        if (t.tipo === 'receita') {
          fluxoPorData[t.data].receitas += t.valor;
        } else {
          fluxoPorData[t.data].despesas += t.valor;
        }
        fluxoPorData[t.data].ultimoSaldo = t.saldo;
      });

      return Object.keys(fluxoPorData).sort().map(data => ({
        data,
        receitas: fluxoPorData[data].receitas,
        despesas: fluxoPorData[data].despesas,
        saldo: fluxoPorData[data].ultimoSaldo,
      }));
    },
  });
}

// Re-export the function from cashflow-scenarios to use with real data
export function calcularProjecoesReais(
  fluxoBase: ProjecaoDiaria[],
  saldoInicial: number
): Record<CenarioTipo, ProjecaoCenario[]> {
  return gerarTodasProjecoesLib(fluxoBase, saldoInicial);
}
