// ============================================
// HOOK: APURAÇÕES TRIBUTÁRIAS
// Gerencia apurações de CBS/IBS/IS no banco
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApuracaoTributaria {
  id: string;
  empresa_id: string;
  competencia: string;
  ano: number;
  mes: number;
  
  // CBS
  cbs_debitos: number;
  cbs_creditos: number;
  cbs_saldo_anterior: number;
  cbs_a_pagar: number;
  cbs_a_compensar: number;
  
  // IBS
  ibs_debitos: number;
  ibs_creditos: number;
  ibs_saldo_anterior: number;
  ibs_a_pagar: number;
  ibs_a_compensar: number;
  
  // IS
  is_debitos: number;
  is_creditos: number;
  is_a_pagar: number;
  
  // Tributos Residuais
  icms_residual: number;
  iss_residual: number;
  pis_residual: number;
  cofins_residual: number;
  
  // Totais
  total_tributos_novos: number;
  total_tributos_residuais: number;
  total_geral: number;
  
  // Controle
  status: 'rascunho' | 'calculado' | 'revisado' | 'transmitido' | 'retificado';
  data_transmissao?: string;
  protocolo_transmissao?: string;
  
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateApuracaoInput {
  empresa_id: string;
  ano: number;
  mes: number;
}

export function useApuracoesTributarias(empresaId?: string) {
  const queryClient = useQueryClient();

  // Buscar apurações
  const { data: apuracoes, isLoading, error } = useQuery({
    queryKey: ['apuracoes_tributarias', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('apuracoes_tributarias')
        .select('*')
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });
      
      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ApuracaoTributaria[];
    },
    enabled: true,
  });

  // Buscar apuração específica
  const buscarApuracao = async (id: string) => {
    const { data, error } = await supabase
      .from('apuracoes_tributarias')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as ApuracaoTributaria;
  };

  // Buscar por competência
  const buscarPorCompetencia = async (empresaId: string, ano: number, mes: number) => {
    const { data, error } = await supabase
      .from('apuracoes_tributarias')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ano', ano)
      .eq('mes', mes)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as ApuracaoTributaria | null;
  };

  // Criar apuração
  const criarApuracao = useMutation({
    mutationFn: async (input: CreateApuracaoInput) => {
      const competencia = new Date(input.ano, input.mes - 1, 1).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('apuracoes_tributarias')
        .insert({
          empresa_id: input.empresa_id,
          competencia,
          ano: input.ano,
          mes: input.mes,
          status: 'rascunho',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apuracoes_tributarias'] });
      toast.success('Apuração criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar apuração: ${error.message}`);
    },
  });

  // Atualizar apuração
  const atualizarApuracao = useMutation({
    mutationFn: async ({ id, ...dados }: Partial<ApuracaoTributaria> & { id: string }) => {
      const { data, error } = await supabase
        .from('apuracoes_tributarias')
        .update(dados)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apuracoes_tributarias'] });
      toast.success('Apuração atualizada');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Calcular apuração (soma débitos/créditos do período)
  const calcularApuracao = useMutation({
    mutationFn: async ({ id, empresaId, ano, mes }: { id: string; empresaId: string; ano: number; mes: number }) => {
      // Buscar operações do período
      const inicioMes = new Date(ano, mes - 1, 1).toISOString().split('T')[0];
      const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0];
      
      const { data: operacoes, error: opError } = await supabase
        .from('operacoes_tributaveis')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('data_operacao', inicioMes)
        .lte('data_operacao', fimMes);
      
      if (opError) throw opError;

      // Calcular totais
      let cbs_debitos = 0, cbs_creditos = 0;
      let ibs_debitos = 0, ibs_creditos = 0;
      let is_debitos = 0;
      let icms_residual = 0, iss_residual = 0, pis_residual = 0, cofins_residual = 0;

      (operacoes || []).forEach((op: any) => {
        if (['venda', 'servico_prestado'].includes(op.tipo_operacao)) {
          cbs_debitos += Number(op.cbs_valor) || 0;
          ibs_debitos += Number(op.ibs_valor) || 0;
          is_debitos += Number(op.is_valor) || 0;
        } else if (['compra', 'servico_tomado'].includes(op.tipo_operacao)) {
          cbs_creditos += Number(op.cbs_credito) || 0;
          ibs_creditos += Number(op.ibs_credito) || 0;
        }
        
        icms_residual += Number(op.icms_valor) || 0;
        iss_residual += Number(op.iss_valor) || 0;
        pis_residual += Number(op.pis_valor) || 0;
        cofins_residual += Number(op.cofins_valor) || 0;
      });

      // Buscar saldo anterior
      const mesAnterior = mes === 1 ? 12 : mes - 1;
      const anoAnterior = mes === 1 ? ano - 1 : ano;
      
      const { data: apuracaoAnterior } = await supabase
        .from('apuracoes_tributarias')
        .select('cbs_a_compensar, ibs_a_compensar')
        .eq('empresa_id', empresaId)
        .eq('ano', anoAnterior)
        .eq('mes', mesAnterior)
        .single();

      const cbs_saldo_anterior = Number(apuracaoAnterior?.cbs_a_compensar) || 0;
      const ibs_saldo_anterior = Number(apuracaoAnterior?.ibs_a_compensar) || 0;

      // Calcular valores a pagar/compensar
      const cbs_liquido = cbs_debitos - cbs_creditos - cbs_saldo_anterior;
      const ibs_liquido = ibs_debitos - ibs_creditos - ibs_saldo_anterior;

      const cbs_a_pagar = Math.max(0, cbs_liquido);
      const cbs_a_compensar = Math.abs(Math.min(0, cbs_liquido));
      const ibs_a_pagar = Math.max(0, ibs_liquido);
      const ibs_a_compensar = Math.abs(Math.min(0, ibs_liquido));
      const is_a_pagar = is_debitos;

      const total_tributos_novos = cbs_a_pagar + ibs_a_pagar + is_a_pagar;
      const total_tributos_residuais = icms_residual + iss_residual + pis_residual + cofins_residual;
      const total_geral = total_tributos_novos + total_tributos_residuais;

      // Atualizar apuração
      const { data, error } = await supabase
        .from('apuracoes_tributarias')
        .update({
          cbs_debitos, cbs_creditos, cbs_saldo_anterior, cbs_a_pagar, cbs_a_compensar,
          ibs_debitos, ibs_creditos, ibs_saldo_anterior, ibs_a_pagar, ibs_a_compensar,
          is_debitos, is_a_pagar,
          icms_residual, iss_residual, pis_residual, cofins_residual,
          total_tributos_novos, total_tributos_residuais, total_geral,
          status: 'calculado',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apuracoes_tributarias'] });
      toast.success('Apuração calculada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao calcular: ${error.message}`);
    },
  });

  // Transmitir apuração
  const transmitirApuracao = useMutation({
    mutationFn: async (id: string) => {
      // Simulação de transmissão - em produção, integrar com SPED/eSocial
      const protocolo = `PROT${Date.now()}`;
      
      const { data, error } = await supabase
        .from('apuracoes_tributarias')
        .update({
          status: 'transmitido',
          data_transmissao: new Date().toISOString(),
          protocolo_transmissao: protocolo,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apuracoes_tributarias'] });
      toast.success('Apuração transmitida com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao transmitir: ${error.message}`);
    },
  });

  return {
    apuracoes,
    isLoading,
    error,
    buscarApuracao,
    buscarPorCompetencia,
    criarApuracao,
    atualizarApuracao,
    calcularApuracao,
    transmitirApuracao,
  };
}
