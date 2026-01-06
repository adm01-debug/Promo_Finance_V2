// ============================================
// HOOK: RETENÇÕES NA FONTE
// IRRF, CSRF, INSS, ISS, CBS, IBS
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, endOfMonth } from 'date-fns';

export type TipoRetencao = 'irrf' | 'csrf' | 'pis_cofins_csll' | 'inss' | 'iss' | 'cbs' | 'ibs';
export type StatusRetencao = 'pendente' | 'recolhido' | 'compensado' | 'cancelado';

export interface RetencaoFonte {
  id: string;
  empresa_id: string;
  tipo_retencao: TipoRetencao;
  tipo_operacao: 'pagamento' | 'recebimento';
  nota_fiscal_id?: string;
  conta_pagar_id?: string;
  conta_receber_id?: string;
  cnpj_participante?: string;
  nome_participante: string;
  valor_base: number;
  aliquota: number;
  valor_retido: number;
  data_fato_gerador: string;
  data_retencao: string;
  data_recolhimento?: string;
  data_vencimento: string;
  codigo_receita?: string;
  numero_documento?: string;
  darf_gerado: boolean;
  status: StatusRetencao;
  competencia: string;
  observacoes?: string;
  created_at: string;
}

export interface DARF {
  id: string;
  empresa_id: string;
  codigo_receita: string;
  descricao_receita: string;
  competencia: string;
  valor_principal: number;
  valor_multa: number;
  valor_juros: number;
  valor_total: number;
  data_vencimento: string;
  data_pagamento?: string;
  codigo_barras?: string;
  linha_digitavel?: string;
  status: 'gerado' | 'pago' | 'vencido' | 'cancelado';
  retencoes_ids: string[];
  created_at: string;
}

// Códigos de receita por tipo de retenção
export const CODIGOS_RECEITA: Record<TipoRetencao, { codigo: string; descricao: string }> = {
  irrf: { codigo: '0561', descricao: 'IRRF - Rendimentos do Trabalho' },
  csrf: { codigo: '5952', descricao: 'CSRF - PIS/COFINS/CSLL Retidos' },
  pis_cofins_csll: { codigo: '5952', descricao: 'PIS/COFINS/CSLL - Retenção na Fonte' },
  inss: { codigo: '2631', descricao: 'INSS - Retenção 11%' },
  iss: { codigo: 'ISS', descricao: 'ISS - Imposto Sobre Serviços' },
  cbs: { codigo: 'CBS', descricao: 'CBS - Contribuição sobre Bens e Serviços' },
  ibs: { codigo: 'IBS', descricao: 'IBS - Imposto sobre Bens e Serviços' },
};

// Alíquotas padrão
export const ALIQUOTAS_RETENCAO: Record<TipoRetencao, number> = {
  irrf: 0.015, // 1.5%
  csrf: 0.0465, // 4.65%
  pis_cofins_csll: 0.0465,
  inss: 0.11, // 11%
  iss: 0.05, // 5% (varia por município)
  cbs: 0.088, // 8.8% (alíquota padrão)
  ibs: 0.178, // 17.8% (alíquota padrão)
};

export function useRetencoesFonte(empresaId?: string, competencia?: string) {
  const queryClient = useQueryClient();

  // Buscar retenções
  const { data: retencoes = [], isLoading } = useQuery({
    queryKey: ['retencoes-fonte', empresaId, competencia],
    queryFn: async () => {
      let query = supabase
        .from('retencoes_fonte')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      if (competencia) {
        query = query.eq('competencia', competencia);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RetencaoFonte[];
    },
    enabled: true,
  });

  // Buscar DARFs
  const { data: darfs = [], isLoading: isLoadingDarfs } = useQuery({
    queryKey: ['darfs', empresaId, competencia],
    queryFn: async () => {
      let query = supabase
        .from('darfs')
        .select('*')
        .order('data_vencimento', { ascending: true });

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      if (competencia) {
        query = query.eq('competencia', competencia);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DARF[];
    },
  });

  // Criar retenção
  const criarRetencao = useMutation({
    mutationFn: async (retencao: Omit<RetencaoFonte, 'id' | 'created_at' | 'darf_gerado'>) => {
      const { data, error } = await supabase
        .from('retencoes_fonte')
        .insert({
          ...retencao,
          darf_gerado: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retencoes-fonte'] });
      toast.success('Retenção registrada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao registrar retenção: ' + error.message);
    },
  });

  // Atualizar status da retenção
  const atualizarRetencao = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RetencaoFonte> & { id: string }) => {
      const { data, error } = await supabase
        .from('retencoes_fonte')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retencoes-fonte'] });
      toast.success('Retenção atualizada');
    },
  });

  // Gerar DARF consolidado
  const gerarDARF = useMutation({
    mutationFn: async ({ 
      empresaId, 
      competencia, 
      tipoRetencao,
      retencoesIds 
    }: { 
      empresaId: string; 
      competencia: string; 
      tipoRetencao: TipoRetencao;
      retencoesIds: string[];
    }) => {
      // Buscar retenções selecionadas
      const retencoesSelecionadas = retencoes.filter(r => retencoesIds.includes(r.id));
      
      if (retencoesSelecionadas.length === 0) {
        throw new Error('Nenhuma retenção selecionada');
      }

      const valorPrincipal = retencoesSelecionadas.reduce((sum, r) => sum + r.valor_retido, 0);
      const codigoReceita = CODIGOS_RECEITA[tipoRetencao];

      // Calcular data de vencimento (último dia útil do mês seguinte)
      const [ano, mes] = competencia.split('-').map(Number);
      const dataVencimento = format(endOfMonth(new Date(ano, mes, 1)), 'yyyy-MM-dd');

      const { data: darf, error } = await supabase
        .from('darfs')
        .insert({
          empresa_id: empresaId,
          codigo_receita: codigoReceita.codigo,
          descricao_receita: codigoReceita.descricao,
          competencia,
          valor_principal: valorPrincipal,
          valor_multa: 0,
          valor_juros: 0,
          valor_total: valorPrincipal,
          data_vencimento: dataVencimento,
          status: 'gerado',
          retencoes_ids: retencoesIds,
        })
        .select()
        .single();

      if (error) throw error;

      // Marcar retenções como DARF gerado
      await supabase
        .from('retencoes_fonte')
        .update({ darf_gerado: true })
        .in('id', retencoesIds);

      return darf;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retencoes-fonte'] });
      queryClient.invalidateQueries({ queryKey: ['darfs'] });
      toast.success('DARF gerado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao gerar DARF: ' + error.message);
    },
  });

  // Registrar pagamento de DARF
  const pagarDARF = useMutation({
    mutationFn: async ({ darfId, dataPagamento }: { darfId: string; dataPagamento: string }) => {
      const { data, error } = await supabase
        .from('darfs')
        .update({ 
          status: 'pago',
          data_pagamento: dataPagamento,
        })
        .eq('id', darfId)
        .select()
        .single();

      if (error) throw error;

      // Atualizar retenções vinculadas
      const darf = darfs.find(d => d.id === darfId);
      if (darf?.retencoes_ids?.length) {
        await supabase
          .from('retencoes_fonte')
          .update({ 
            status: 'recolhido',
            data_recolhimento: dataPagamento,
          })
          .in('id', darf.retencoes_ids);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retencoes-fonte'] });
      queryClient.invalidateQueries({ queryKey: ['darfs'] });
      toast.success('Pagamento registrado');
    },
  });

  // Calcular retenção automaticamente
  const calcularRetencao = (
    valorBase: number,
    tipoRetencao: TipoRetencao,
    aliquotaCustom?: number
  ) => {
    const aliquota = aliquotaCustom ?? ALIQUOTAS_RETENCAO[tipoRetencao];
    return {
      aliquota,
      valorRetido: valorBase * aliquota,
    };
  };

  // Resumo por tipo
  const resumoPorTipo = retencoes.reduce((acc, r) => {
    if (!acc[r.tipo_retencao]) {
      acc[r.tipo_retencao] = { total: 0, pendente: 0, recolhido: 0, count: 0 };
    }
    acc[r.tipo_retencao].total += r.valor_retido;
    acc[r.tipo_retencao].count++;
    if (r.status === 'pendente') acc[r.tipo_retencao].pendente += r.valor_retido;
    if (r.status === 'recolhido') acc[r.tipo_retencao].recolhido += r.valor_retido;
    return acc;
  }, {} as Record<TipoRetencao, { total: number; pendente: number; recolhido: number; count: number }>);

  // Retenções pendentes próximas do vencimento
  const retencoesCriticas = retencoes.filter(r => {
    if (r.status !== 'pendente') return false;
    const diasParaVencer = Math.ceil(
      (new Date(r.data_vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return diasParaVencer <= 5;
  });

  return {
    retencoes,
    darfs,
    isLoading,
    isLoadingDarfs,
    resumoPorTipo,
    retencoesCriticas,
    criarRetencao,
    atualizarRetencao,
    gerarDARF,
    pagarDARF,
    calcularRetencao,
    CODIGOS_RECEITA,
    ALIQUOTAS_RETENCAO,
  };
}

export default useRetencoesFonte;
