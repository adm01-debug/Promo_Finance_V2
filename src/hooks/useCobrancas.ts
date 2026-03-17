import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO, subDays } from 'date-fns';

export interface ContaVencida {
  id: string;
  cliente_nome: string;
  cliente_id: string | null;
  valor: number;
  valor_recebido: number | null;
  data_vencimento: string;
  etapa_cobranca: 'preventiva' | 'lembrete' | 'cobranca' | 'negociacao' | 'juridico' | null;
  status: 'pago' | 'pendente' | 'vencido' | 'parcial' | 'cancelado' | 'atrasado';
  dias_atraso: number;
  score?: number | null;
}

export interface AgingData {
  faixa: string;
  valor: number;
  qtd: number;
}

export interface TopDevedor {
  cliente_id: string | null;
  cliente_nome: string;
  valor_total: number;
  dias_atraso: number;
  score: number | null;
  qtd_titulos: number;
}

export interface CobrancaKPIs {
  totalVencido: number;
  totalRecuperado: number;
  taxaRecuperacao: number;
  qtdVencidas: number;
  qtdRecuperadas: number;
}

export interface EtapaCount {
  etapa: string;
  count: number;
  valor: number;
}

export function useContasVencidas() {
  return useQuery({
    queryKey: ['contas-vencidas'],
    queryFn: async (): Promise<ContaVencida[]> => {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('contas_receber')
        .select(`
          id,
          cliente_nome,
          cliente_id,
          valor,
          valor_recebido,
          data_vencimento,
          etapa_cobranca,
          status,
          clientes:cliente_id (score)
        `)
        .or(`status.eq.vencido,and(status.eq.pendente,data_vencimento.lt.${hoje})`)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      interface ContaVencidaData {
        id: string;
        cliente_nome: string;
        cliente_id: string | null;
        valor: number;
        valor_recebido: number | null;
        data_vencimento: string;
        etapa_cobranca: 'preventiva' | 'lembrete' | 'cobranca' | 'negociacao' | 'juridico' | null;
        status: 'pago' | 'pendente' | 'vencido' | 'parcial' | 'cancelado' | 'atrasado';
        clientes?: { score: number | null } | null;
      }

      return (data || []).map((conta: ContaVencidaData) => ({
        id: conta.id,
        cliente_nome: conta.cliente_nome,
        cliente_id: conta.cliente_id,
        valor: conta.valor,
        valor_recebido: conta.valor_recebido,
        data_vencimento: conta.data_vencimento,
        etapa_cobranca: conta.etapa_cobranca,
        status: conta.status,
        dias_atraso: differenceInDays(new Date(), parseISO(conta.data_vencimento)),
        score: conta.clientes?.score || null,
      }));
    },
  });
}

export function useCobrancaKPIs() {
  return useQuery({
    queryKey: ['cobranca-kpis'],
    queryFn: async (): Promise<CobrancaKPIs> => {
      const hoje = new Date().toISOString().split('T')[0];
      const trintaDiasAtras = subDays(new Date(), 30).toISOString().split('T')[0];

      // Buscar contas vencidas (não pagas)
      const { data: vencidas, error: errorVencidas } = await supabase
        .from('contas_receber')
        .select('id, valor, valor_recebido')
        .or(`status.eq.vencido,and(status.eq.pendente,data_vencimento.lt.${hoje})`);

      if (errorVencidas) throw errorVencidas;

      // Buscar contas recuperadas (pagas nos últimos 30 dias que estavam vencidas)
      const { data: recuperadas, error: errorRecuperadas } = await supabase
        .from('contas_receber')
        .select('id, valor, valor_recebido, data_recebimento')
        .eq('status', 'pago')
        .gte('data_recebimento', trintaDiasAtras)
        .lt('data_vencimento', 'data_recebimento');

      if (errorRecuperadas) throw errorRecuperadas;

      const totalVencido = (vencidas || []).reduce((sum, c) => sum + (c.valor - (c.valor_recebido || 0)), 0);
      const totalRecuperado = (recuperadas || []).reduce((sum, c) => sum + (c.valor_recebido || c.valor), 0);
      const qtdVencidas = vencidas?.length || 0;
      const qtdRecuperadas = recuperadas?.length || 0;
      
      // Taxa de recuperação
      const taxaRecuperacao = totalVencido + totalRecuperado > 0 
        ? (totalRecuperado / (totalVencido + totalRecuperado)) * 100 
        : 0;

      return {
        totalVencido,
        totalRecuperado,
        taxaRecuperacao: Math.round(taxaRecuperacao * 10) / 10,
        qtdVencidas,
        qtdRecuperadas,
      };
    },
  });
}

export function useAgingData() {
  return useQuery({
    queryKey: ['aging-inadimplencia'],
    queryFn: async (): Promise<AgingData[]> => {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('contas_receber')
        .select('id, valor, valor_recebido, data_vencimento')
        .or(`status.eq.vencido,and(status.eq.pendente,data_vencimento.lt.${hoje})`);

      if (error) throw error;

      const faixas = [
        { label: '1-7d', min: 1, max: 7 },
        { label: '8-15d', min: 8, max: 15 },
        { label: '16-30d', min: 16, max: 30 },
        { label: '31-60d', min: 31, max: 60 },
        { label: '60+d', min: 61, max: Infinity },
      ];

      return faixas.map(faixa => {
        const contasFaixa = (data || []).filter(conta => {
          const dias = differenceInDays(new Date(), parseISO(conta.data_vencimento));
          return dias >= faixa.min && dias <= faixa.max;
        });

        return {
          faixa: faixa.label,
          valor: contasFaixa.reduce((sum, c) => sum + (c.valor - (c.valor_recebido || 0)), 0),
          qtd: contasFaixa.length,
        };
      });
    },
  });
}

export function useTopDevedores(limit: number = 10) {
  return useQuery({
    queryKey: ['top-devedores', limit],
    queryFn: async (): Promise<TopDevedor[]> => {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('contas_receber')
        .select(`
          id,
          cliente_id,
          cliente_nome,
          valor,
          valor_recebido,
          data_vencimento,
          clientes:cliente_id (score)
        `)
        .or(`status.eq.vencido,and(status.eq.pendente,data_vencimento.lt.${hoje})`);

      if (error) throw error;

      // Agrupar por cliente
      interface ContaDevedorData {
        cliente_id: string | null;
        cliente_nome: string;
        valor: number;
        valor_recebido: number | null;
        data_vencimento: string;
        clientes?: { score: number | null } | null;
      }

      const devedoresPorCliente = (data || []).reduce((acc: Record<string, TopDevedor>, conta: ContaDevedorData) => {
        const key = conta.cliente_id || conta.cliente_nome;
        if (!acc[key]) {
          acc[key] = {
            cliente_id: conta.cliente_id,
            cliente_nome: conta.cliente_nome,
            valor_total: 0,
            dias_atraso: 0,
            score: conta.clientes?.score || null,
            qtd_titulos: 0,
          };
        }
        acc[key].valor_total += conta.valor - (conta.valor_recebido || 0);
        acc[key].qtd_titulos += 1;
        const diasAtraso = differenceInDays(new Date(), parseISO(conta.data_vencimento));
        if (diasAtraso > acc[key].dias_atraso) {
          acc[key].dias_atraso = diasAtraso;
        }
        return acc;
      }, {});

      return Object.values(devedoresPorCliente)
        .sort((a, b) => b.valor_total - a.valor_total)
        .slice(0, limit);
    },
  });
}

export function useEtapasCobranca() {
  return useQuery({
    queryKey: ['etapas-cobranca'],
    queryFn: async (): Promise<EtapaCount[]> => {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('contas_receber')
        .select('id, valor, valor_recebido, etapa_cobranca')
        .or(`status.eq.vencido,and(status.eq.pendente,data_vencimento.lt.${hoje})`);

      if (error) throw error;

      const etapas = ['preventiva', 'lembrete', 'cobranca', 'negociacao', 'juridico'];
      
      return etapas.map(etapa => {
        const contasEtapa = (data || []).filter(c => c.etapa_cobranca === etapa);
        return {
          etapa,
          count: contasEtapa.length,
          valor: contasEtapa.reduce((sum, c) => sum + (c.valor - (c.valor_recebido || 0)), 0),
        };
      });
    },
  });
}

export function useUpdateEtapaCobranca() {
  const updateEtapa = async (contaId: string, novaEtapa: 'preventiva' | 'lembrete' | 'cobranca' | 'negociacao' | 'juridico') => {
    const { error } = await supabase
      .from('contas_receber')
      .update({ etapa_cobranca: novaEtapa })
      .eq('id', contaId);

    if (error) throw error;
  };

  return { updateEtapa };
}
