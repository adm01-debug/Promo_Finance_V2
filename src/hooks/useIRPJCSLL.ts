// ============================================
// HOOK: IRPJ/CSLL - LUCRO REAL
// Gerencia apurações de IRPJ e CSLL
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApuracaoIRPJCSLL {
  id: string;
  empresa_id: string;
  tipo_apuracao: 'trimestral' | 'anual' | 'estimativa';
  ano: number;
  trimestre?: number;
  mes?: number;
  
  // Lucro Contábil
  lucro_contabil: number;
  
  // Adições
  adicoes_permanentes: number;
  adicoes_temporarias: number;
  total_adicoes: number;
  
  // Exclusões
  exclusoes_permanentes: number;
  exclusoes_temporarias: number;
  total_exclusoes: number;
  
  // Lucro Real
  lucro_real_antes_compensacao: number;
  compensacao_prejuizos: number;
  lucro_real: number;
  
  // IRPJ
  irpj_aliquota_normal: number;
  irpj_normal: number;
  irpj_adicional_base: number;
  irpj_adicional: number;
  irpj_total: number;
  
  // CSLL
  csll_aliquota: number;
  csll_base: number;
  csll_total: number;
  
  // Deduções
  irpj_incentivos_deducoes: number;
  total_tributos: number;
  
  // Retenções
  irrf_retido: number;
  csrf_retido: number;
  saldo_negativo_anterior: number;
  estimativas_pagas: number;
  
  // Saldo Final
  irpj_a_pagar: number;
  csll_a_pagar: number;
  saldo_negativo_irpj: number;
  saldo_negativo_csll: number;
  
  // Controle
  status: 'rascunho' | 'calculado' | 'revisado' | 'transmitido' | 'retificado';
  data_transmissao?: string;
  numero_recibo?: string;
  
  created_at: string;
  updated_at: string;
}

export interface PrejuizoFiscal {
  id: string;
  empresa_id: string;
  tipo: 'IRPJ' | 'CSLL';
  ano_origem: number;
  trimestre_origem?: number;
  valor_original: number;
  valor_compensado: number;
  saldo_disponivel: number;
  status: 'disponivel' | 'parcial' | 'compensado' | 'prescrito';
  observacoes?: string;
}

export interface LalurLancamento {
  id: string;
  empresa_id: string;
  apuracao_id?: string;
  tipo: 'adicao' | 'exclusao';
  natureza: 'permanente' | 'temporaria';
  codigo_lancamento?: string;
  descricao: string;
  valor: number;
  saldo_parte_b: number;
  data_realizacao?: string;
  conta_contabil?: string;
  historico?: string;
}

// Limite de isenção do adicional de IRPJ por mês
const LIMITE_ADICIONAL_MES = 20000;
// Alíquotas
const ALIQUOTA_IRPJ = 0.15;
const ALIQUOTA_IRPJ_ADICIONAL = 0.10;
const ALIQUOTA_CSLL = 0.09;

export function useIRPJCSLL(empresaId?: string) {
  const queryClient = useQueryClient();

  // Buscar apurações
  const { data: apuracoes, isLoading } = useQuery({
    queryKey: ['apuracoes_irpj_csll', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('apuracoes_irpj_csll')
        .select('*')
        .order('ano', { ascending: false })
        .order('trimestre', { ascending: false });
      
      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ApuracaoIRPJCSLL[];
    },
  });

  // Buscar prejuízos fiscais
  const { data: prejuizos } = useQuery({
    queryKey: ['prejuizos_fiscais', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('prejuizos_fiscais')
        .select('*')
        .eq('status', 'disponivel')
        .order('ano_origem', { ascending: true });
      
      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PrejuizoFiscal[];
    },
  });

  // Saldo de prejuízos disponíveis
  const saldoPrejuizos = {
    irpj: prejuizos?.filter(p => p.tipo === 'IRPJ').reduce((acc, p) => acc + Number(p.saldo_disponivel), 0) || 0,
    csll: prejuizos?.filter(p => p.tipo === 'CSLL').reduce((acc, p) => acc + Number(p.saldo_disponivel), 0) || 0,
  };

  // Criar apuração
  const criarApuracao = useMutation({
    mutationFn: async (input: {
      empresa_id: string;
      tipo_apuracao: 'trimestral' | 'anual' | 'estimativa';
      ano: number;
      trimestre?: number;
      mes?: number;
    }) => {
      const { data, error } = await supabase
        .from('apuracoes_irpj_csll')
        .insert({
          ...input,
          status: 'rascunho',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apuracoes_irpj_csll'] });
      toast.success('Apuração IRPJ/CSLL criada');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  // Calcular apuração
  const calcularApuracao = useMutation({
    mutationFn: async ({ id, lucroContabil, adicoes, exclusoes }: {
      id: string;
      lucroContabil: number;
      adicoes: { permanentes: number; temporarias: number };
      exclusoes: { permanentes: number; temporarias: number };
    }) => {
      // Buscar apuração
      const { data: apuracao, error: fetchError } = await supabase
        .from('apuracoes_irpj_csll')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

      const totalAdicoes = adicoes.permanentes + adicoes.temporarias;
      const totalExclusoes = exclusoes.permanentes + exclusoes.temporarias;
      
      // Lucro Real antes da compensação
      const lucroRealAntesComp = lucroContabil + totalAdicoes - totalExclusoes;
      
      // Compensação de prejuízos (máximo 30%)
      const limiteCompensacao = Math.max(0, lucroRealAntesComp * 0.30);
      const compensacaoPrejuizos = Math.min(limiteCompensacao, saldoPrejuizos.irpj);
      
      // Lucro Real
      const lucroReal = Math.max(0, lucroRealAntesComp - compensacaoPrejuizos);
      
      // IRPJ Normal (15%)
      const irpjNormal = lucroReal * ALIQUOTA_IRPJ;
      
      // IRPJ Adicional (10% sobre excedente)
      let mesesPeriodo = 3; // Trimestral
      if (apuracao.tipo_apuracao === 'anual') mesesPeriodo = 12;
      if (apuracao.tipo_apuracao === 'estimativa') mesesPeriodo = 1;
      
      const limiteIsentoAdicional = LIMITE_ADICIONAL_MES * mesesPeriodo;
      const baseAdicional = Math.max(0, lucroReal - limiteIsentoAdicional);
      const irpjAdicional = baseAdicional * ALIQUOTA_IRPJ_ADICIONAL;
      
      const irpjTotal = irpjNormal + irpjAdicional;
      
      // CSLL (9%)
      const csllBase = lucroReal;
      const csllTotal = csllBase * ALIQUOTA_CSLL;
      
      // Total
      const totalTributos = irpjTotal + csllTotal;
      
      // Deduzir retenções e estimativas
      const irrf = Number(apuracao.irrf_retido) || 0;
      const csrf = Number(apuracao.csrf_retido) || 0;
      const saldoNegAnterior = Number(apuracao.saldo_negativo_anterior) || 0;
      const estimativas = Number(apuracao.estimativas_pagas) || 0;
      
      const irpjAPagar = Math.max(0, irpjTotal - irrf - saldoNegAnterior - estimativas);
      const csllAPagar = Math.max(0, csllTotal - csrf);
      
      const saldoNegativoIrpj = Math.abs(Math.min(0, irpjTotal - irrf - saldoNegAnterior - estimativas));
      const saldoNegativoCsll = Math.abs(Math.min(0, csllTotal - csrf));

      // Atualizar
      const { data, error } = await supabase
        .from('apuracoes_irpj_csll')
        .update({
          lucro_contabil: lucroContabil,
          adicoes_permanentes: adicoes.permanentes,
          adicoes_temporarias: adicoes.temporarias,
          total_adicoes: totalAdicoes,
          exclusoes_permanentes: exclusoes.permanentes,
          exclusoes_temporarias: exclusoes.temporarias,
          total_exclusoes: totalExclusoes,
          lucro_real_antes_compensacao: lucroRealAntesComp,
          compensacao_prejuizos: compensacaoPrejuizos,
          lucro_real: lucroReal,
          irpj_normal: irpjNormal,
          irpj_adicional_base: baseAdicional,
          irpj_adicional: irpjAdicional,
          irpj_total: irpjTotal,
          csll_base: csllBase,
          csll_total: csllTotal,
          total_tributos: totalTributos,
          irpj_a_pagar: irpjAPagar,
          csll_a_pagar: csllAPagar,
          saldo_negativo_irpj: saldoNegativoIrpj,
          saldo_negativo_csll: saldoNegativoCsll,
          status: 'calculado',
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apuracoes_irpj_csll'] });
      toast.success('IRPJ/CSLL calculado com sucesso');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  // Registrar prejuízo
  const registrarPrejuizo = useMutation({
    mutationFn: async (input: {
      empresa_id: string;
      tipo: 'IRPJ' | 'CSLL';
      ano_origem: number;
      trimestre_origem?: number;
      valor: number;
    }) => {
      const { data, error } = await supabase
        .from('prejuizos_fiscais')
        .insert({
          empresa_id: input.empresa_id,
          tipo: input.tipo,
          ano_origem: input.ano_origem,
          trimestre_origem: input.trimestre_origem,
          valor_original: input.valor,
          valor_compensado: 0,
          saldo_disponivel: input.valor,
          status: 'disponivel',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prejuizos_fiscais'] });
      toast.success('Prejuízo fiscal registrado');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  return {
    apuracoes,
    prejuizos,
    saldoPrejuizos,
    isLoading,
    criarApuracao,
    calcularApuracao,
    registrarPrejuizo,
    ALIQUOTA_IRPJ,
    ALIQUOTA_IRPJ_ADICIONAL,
    ALIQUOTA_CSLL,
    LIMITE_ADICIONAL_MES,
  };
}
