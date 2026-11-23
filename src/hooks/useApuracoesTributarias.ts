// HOOK: APURAÇÕES TRIBUTÁRIAS
// Gerencia apurações de CBS/IBS/IS no banco

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { toISOLocal } from '@/lib/formatters';

/**
 * O PostgREST devolve no máximo 1000 linhas por request. Um mês com mais de
 * 1000 notas tinha os débitos truncados em silêncio, e a apuração saía menor
 * que o real. Pagina até a última página.
 */
async function buscarTodasNotasDoMes(
  empresaId: string,
  inicioMes: string,
  fimMes: string
): Promise<
  {
    v_cbs: number | null;
    v_ibs: number | null;
    v_ibs_uf: number | null;
    v_ibs_mun: number | null;
    v_is: number | null;
  }[]
> {
  const PAGINA = 1000;
  const acumulado: {
    v_cbs: number | null;
    v_ibs: number | null;
    v_ibs_uf: number | null;
    v_ibs_mun: number | null;
    v_is: number | null;
  }[] = [];

  for (let offset = 0; ; offset += PAGINA) {
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select('v_cbs, v_ibs, v_ibs_uf, v_ibs_mun, v_is')
      .eq('empresa_id', empresaId)
      .gte('data_emissao', inicioMes)
      .lte('data_emissao', fimMes)
      .neq('status', 'cancelada')
      .order('id', { ascending: true })
      .range(offset, offset + PAGINA - 1);

    if (error) throw error;
    const lote = data ?? [];
    acumulado.push(...lote);
    if (lote.length < PAGINA) break;
  }

  return acumulado;
}

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
  const {
    data: apuracoes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['apuracoes_tributarias', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('apuracoes_tributarias')
        .select('*')
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });

      if (empresaId && empresaId !== 'all' && empresaId !== 'todas' && empresaId !== 'default') {
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
      const competencia = toISOLocal(new Date(input.ano, input.mes - 1, 1));

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
    mutationFn: async ({
      id,
      ...dados
    }: Omit<Partial<ApuracaoTributaria>, 'id' | 'created_by'> & { id: string }) => {
      // created_by é preenchido pelo DEFAULT auth.uid() no insert e não muda na edição.
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
    mutationFn: async ({
      id,
      empresaId,
      ano,
      mes,
    }: {
      id: string;
      empresaId: string;
      ano: number;
      mes: number;
    }) => {
      // Buscar NF-e emitidas do período (débitos = v_cbs + v_ibs da nota)
      const inicioMes = toISOLocal(new Date(ano, mes - 1, 1));
      const fimMes = toISOLocal(new Date(ano, mes, 0));
      const competenciaMes = `${ano}-${String(mes).padStart(2, '0')}`;

      const notasEmitidas = await buscarTodasNotasDoMes(empresaId, inicioMes, fimMes);

      let cbs_debitos = 0;
      let ibs_debitos = 0;
      let is_debitos = 0;

      (notasEmitidas || []).forEach((n) => {
        cbs_debitos += Number(n.v_cbs) || 0;
        ibs_debitos += (Number(n.v_ibs_uf) || 0) + (Number(n.v_ibs_mun) || 0);
        is_debitos += Number(n.v_is) || 0;
      });

      // Buscar créditos xml_destacado com efeito tributário real (≥ 2027)
      const { data: creditosApropriados, error: credErr } = await supabase
        .from('creditos_tributarios')
        .select('tipo_tributo, valor_credito')
        .eq('empresa_id', empresaId)
        .eq('origem', 'xml_destacado')
        .eq('efeito_tributario', true)
        .like('competencia_origem', `${competenciaMes}%`);

      if (credErr) throw credErr;

      let cbs_creditos = 0;
      let ibs_creditos = 0;

      (creditosApropriados || []).forEach((c) => {
        if (c.tipo_tributo === 'CBS') cbs_creditos += Number(c.valor_credito) || 0;
        else if (c.tipo_tributo === 'IBS') ibs_creditos += Number(c.valor_credito) || 0;
      });

      // Tributos residuais (ICMS/ISS/PIS/COFINS) continuam em operacoes_tributaveis
      const { data: operacoes, error: opError } = await supabase
        .from('operacoes_tributaveis')
        .select('icms_valor, iss_valor, pis_valor, cofins_valor')
        .eq('empresa_id', empresaId)
        .gte('data_operacao', inicioMes)
        .lte('data_operacao', fimMes);

      if (opError) throw opError;

      let icms_residual = 0,
        iss_residual = 0,
        pis_residual = 0,
        cofins_residual = 0;
      (operacoes || []).forEach((op) => {
        icms_residual += Number((op as { icms_valor?: number | null }).icms_valor) || 0;
        iss_residual += Number((op as { iss_valor?: number | null }).iss_valor) || 0;
        pis_residual += Number((op as { pis_valor?: number | null }).pis_valor) || 0;
        cofins_residual += Number((op as { cofins_valor?: number | null }).cofins_valor) || 0;
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
      const total_tributos_residuais =
        icms_residual + iss_residual + pis_residual + cofins_residual;
      const total_geral = total_tributos_novos + total_tributos_residuais;

      // 2026: resultado é apenas informativo (art. 348 LC 214/2025 dispensa recolhimento)
      const observacoes =
        ano <= 2026
          ? 'Informativo — FG 2026: créditos aprop. somente a partir de 2027; resultado compensável com PIS/COFINS (art. 348 LC 214/2025)'
          : undefined;

      // Atualizar apuração
      const { data, error } = await supabase
        .from('apuracoes_tributarias')
        .update({
          cbs_debitos,
          cbs_creditos,
          cbs_saldo_anterior,
          cbs_a_pagar,
          cbs_a_compensar,
          ibs_debitos,
          ibs_creditos,
          ibs_saldo_anterior,
          ibs_a_pagar,
          ibs_a_compensar,
          is_debitos,
          is_a_pagar,
          icms_residual,
          iss_residual,
          pis_residual,
          cofins_residual,
          total_tributos_novos,
          total_tributos_residuais,
          total_geral,
          status: 'calculado',
          ...(observacoes && { observacoes }),
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
    mutationFn: async (_id: string) => {
      // Não altere o status fiscal sem protocolo emitido pelo integrador.
      // O contrato SPED/eSocial ainda não está ligado a esta tela; marcá-la
      // como transmitida aqui criava uma evidência fiscal falsa.
      throw new Error(
        'Transmissão indisponível: integre e confirme o protocolo fiscal antes de marcar a apuração como transmitida.'
      );
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
    apuracoes: apuracoes ?? [],
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
