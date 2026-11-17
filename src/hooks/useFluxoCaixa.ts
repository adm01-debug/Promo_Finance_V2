import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import {
  ProjecaoDiaria,
  ProjecaoCenario,
  CenarioTipo,
  gerarTodasProjecoes as gerarTodasProjecoesLib,
} from '@/lib/cashflow-scenarios';

export interface FluxoKPIs {
  saldoTotal: number;
  totalReceber: number;
  totalPagar: number;
  previsaoSaldo30d: number;
}

export function useFluxoCaixaKPIs() {
  // A barra de empresa do topo (Header.tsx:138 -> EmpresaScopeBar) vale para
  // esta página, mas o hook não lia o escopo: os três números somavam TODAS as
  // empresas acessíveis e o cache não separava por empresa, então trocar a
  // empresa no topo não mudava nada na tela. src/contexts/useEmpresaScope.ts:11-15
  // declara essa regra para o próprio projeto.
  const { currentEmpresaId } = useAuth();

  return useQuery({
    queryKey: ['fluxo-caixa-kpis', currentEmpresaId],
    queryFn: async (): Promise<FluxoKPIs> => {
      // Janela da previsão: o cartão se chama "30 dias" e somava TODO o
      // pendente, inclusive vencimento de anos à frente. As linhas de
      // useFluxoCaixaProjetado já usavam .gte/.lte('data_vencimento'), então a
      // janela existia no arquivo e faltava só aqui.
      const hojeStr = format(new Date(), 'yyyy-MM-dd');
      const limite30d = format(addDays(new Date(), 30), 'yyyy-MM-dd');
      // Janela fechada nos dois lados, igual à da projeção diária (que começa
      // hoje): só o limite superior deixaria passar título vencido com
      // vencimento no passado, e os dois números da mesma tela divergiriam.
      const dentroDaJanela = (venc?: string | null) =>
        !!venc && venc >= hojeStr && venc <= limite30d;

      // Buscar saldo total das contas bancárias
      let qContas = supabase.from('contas_bancarias').select('saldo_atual').eq('ativo', true);
      if (currentEmpresaId) qContas = qContas.eq('empresa_id', currentEmpresaId);
      const { data: contas, error: errorContas } = await qContas;

      if (errorContas) throw errorContas;

      const saldoTotal = (contas || []).reduce((sum, c) => sum + (c.saldo_atual || 0), 0);

      // Buscar total a receber (pendentes)
      let qReceber = supabase
        .from('contas_receber')
        .select('valor, valor_recebido, data_vencimento')
        .in('status', ['pendente', 'vencido', 'parcial']);
      if (currentEmpresaId) qReceber = qReceber.eq('empresa_id', currentEmpresaId);
      const { data: receber, error: errorReceber } = await qReceber;

      if (errorReceber) throw errorReceber;

      const saldoReceber = (c: { valor: number; valor_recebido?: number | null }) =>
        c.valor - (c.valor_recebido || 0);
      const totalReceber = (receber || []).reduce((sum, c) => sum + saldoReceber(c), 0);
      const receber30d = (receber || [])
        .filter((c) => dentroDaJanela(c.data_vencimento))
        .reduce((sum, c) => sum + saldoReceber(c), 0);

      // Buscar total a pagar (pendentes)
      let qPagar = supabase
        .from('contas_pagar')
        .select('valor, valor_pago, data_vencimento')
        .in('status', ['pendente', 'vencido', 'parcial']);
      if (currentEmpresaId) qPagar = qPagar.eq('empresa_id', currentEmpresaId);
      const { data: pagar, error: errorPagar } = await qPagar;

      if (errorPagar) throw errorPagar;

      const saldoPagar = (c: { valor: number; valor_pago?: number | null }) =>
        c.valor - (c.valor_pago || 0);
      const totalPagar = (pagar || []).reduce((sum, c) => sum + saldoPagar(c), 0);
      const pagar30d = (pagar || [])
        .filter((c) => dentroDaJanela(c.data_vencimento))
        .reduce((sum, c) => sum + saldoPagar(c), 0);

      // Previsão de saldo em 30 dias — só o que vence dentro da janela.
      const previsaoSaldo30d = saldoTotal + receber30d - pagar30d;

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
  // Mesmo escopo do KPI: sem isto a curva projetada misturava o saldo inicial
  // e os vencimentos de todas as empresas acessíveis.
  const { currentEmpresaId } = useAuth();

  return useQuery({
    queryKey: ['fluxo-caixa-projetado', dias, currentEmpresaId],
    queryFn: async (): Promise<ProjecaoDiaria[]> => {
      const hoje = new Date();
      const dataFim = addDays(hoje, dias);
      const hojeStr = format(hoje, 'yyyy-MM-dd');
      const dataFimStr = format(dataFim, 'yyyy-MM-dd');

      // Buscar saldo inicial das contas bancárias
      let qContas = supabase.from('contas_bancarias').select('saldo_atual').eq('ativo', true);
      if (currentEmpresaId) qContas = qContas.eq('empresa_id', currentEmpresaId);
      const { data: contas, error: errorContas } = await qContas;

      if (errorContas) throw errorContas;

      const saldoInicial = (contas || []).reduce((sum, c) => sum + (c.saldo_atual || 0), 0);

      // Buscar contas a receber no período
      let qReceber = supabase
        .from('contas_receber')
        .select('id, valor, valor_recebido, data_vencimento')
        .gte('data_vencimento', hojeStr)
        .lte('data_vencimento', dataFimStr)
        .in('status', ['pendente', 'vencido', 'parcial']);
      if (currentEmpresaId) qReceber = qReceber.eq('empresa_id', currentEmpresaId);
      const { data: receber, error: errorReceber } = await qReceber;

      if (errorReceber) throw errorReceber;

      // Buscar contas a pagar no período
      let qPagar = supabase
        .from('contas_pagar')
        .select('id, valor, valor_pago, data_vencimento')
        .gte('data_vencimento', hojeStr)
        .lte('data_vencimento', dataFimStr)
        .in('status', ['pendente', 'vencido', 'parcial']);
      if (currentEmpresaId) qPagar = qPagar.eq('empresa_id', currentEmpresaId);
      const { data: pagar, error: errorPagar } = await qPagar;

      if (errorPagar) throw errorPagar;

      // Agrupar por data
      const fluxoPorData: Record<string, { receitas: number; despesas: number }> = {};

      // Inicializar todos os dias
      for (let i = 0; i <= dias; i++) {
        const data = format(addDays(hoje, i), 'yyyy-MM-dd');
        fluxoPorData[data] = { receitas: 0, despesas: 0 };
      }

      // Agregar receitas
      (receber || []).forEach((conta) => {
        const data = conta.data_vencimento;
        if (fluxoPorData[data]) {
          fluxoPorData[data].receitas += conta.valor - (conta.valor_recebido || 0);
        }
      });

      // Agregar despesas
      (pagar || []).forEach((conta) => {
        const data = conta.data_vencimento;
        if (fluxoPorData[data]) {
          fluxoPorData[data].despesas += conta.valor - (conta.valor_pago || 0);
        }
      });

      // Calcular saldo acumulado
      let saldoAcumulado = saldoInicial;
      const resultado: ProjecaoDiaria[] = [];

      Object.keys(fluxoPorData)
        .sort((a, b) => a.localeCompare(b))
        .forEach((data) => {
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
      const fluxoPorData: Record<
        string,
        { receitas: number; despesas: number; ultimoSaldo: number }
      > = {};

      (transacoes || []).forEach((t) => {
        if (!fluxoPorData[t.data]) {
          fluxoPorData[t.data] = { receitas: 0, despesas: 0, ultimoSaldo: 0 };
        }
        if (t.tipo === 'receita') {
          fluxoPorData[t.data].receitas += t.valor;
        } else {
          fluxoPorData[t.data].despesas += t.valor;
        }
        fluxoPorData[t.data].ultimoSaldo = t.saldo ?? fluxoPorData[t.data].ultimoSaldo;
      });

      return Object.keys(fluxoPorData)
        .sort((a, b) => a.localeCompare(b))
        .map((data) => ({
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
  saldoInicial: number,
  /**
   * Semente do fator de atraso (achado F06). Passe o id da empresa para que
   * duas empresas no mesmo dia nao recebam o mesmo jitter e cada uma continue
   * reproduzivel entre recarregamentos.
   */
  semente?: string
): Record<CenarioTipo, ProjecaoCenario[]> {
  return gerarTodasProjecoesLib(fluxoBase, saldoInicial, { semente });
}
