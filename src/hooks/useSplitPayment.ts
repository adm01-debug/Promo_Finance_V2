// ============================================
// HOOK: SPLIT PAYMENT AUTOMÁTICO
// Recolhimento fracionado LC 214/2025
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export type StatusSplitPayment = 'pendente' | 'processado' | 'repassado' | 'erro';

export interface SplitPaymentTransacao {
  id: string;
  empresa_id: string;
  operacao_id?: string;
  documento_tipo?: string;
  documento_numero?: string;
  documento_chave?: string;
  valor_operacao: number;
  valor_liquido: number;
  cbs_retido: number;
  ibs_retido: number;
  is_retido: number;
  total_retido: number;
  conta_fornecedor?: string;
  conta_cbs?: string;
  conta_ibs?: string;
  conta_is?: string;
  status: StatusSplitPayment;
  data_processamento?: string;
  protocolo?: string;
  erro_mensagem?: string;
  created_at: string;
}

// Alíquotas para cálculo do split (2026 em diante)
const ALIQUOTAS_SPLIT = {
  2026: { cbs: 0.009, ibs: 0.001 },
  2027: { cbs: 0.009, ibs: 0.001 },
  2029: { cbs: 0.0352, ibs: 0.0712 },
  2030: { cbs: 0.044, ibs: 0.089 },
  2031: { cbs: 0.0528, ibs: 0.1068 },
  2032: { cbs: 0.0616, ibs: 0.1246 },
  2033: { cbs: 0.088, ibs: 0.178 },
};

export function useSplitPayment(empresaId?: string) {
  const queryClient = useQueryClient();

  // Buscar transações de split payment
  const { data: transacoes = [], isLoading } = useQuery({
    queryKey: ['split-payment', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('split_payment_transacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SplitPaymentTransacao[];
    },
  });

  // Calcular split payment para uma transação
  const calcularSplit = (
    valorTotal: number, 
    anoReferencia: number = new Date().getFullYear(),
    temIS: boolean = false,
    aliquotaIS: number = 0
  ) => {
    const ano = Math.min(Math.max(anoReferencia, 2026), 2033) as keyof typeof ALIQUOTAS_SPLIT;
    const aliquotas = ALIQUOTAS_SPLIT[ano] || ALIQUOTAS_SPLIT[2033];

    const cbsRetido = valorTotal * aliquotas.cbs;
    const ibsRetido = valorTotal * aliquotas.ibs;
    const isRetido = temIS ? valorTotal * aliquotaIS : 0;
    const totalRetido = cbsRetido + ibsRetido + isRetido;
    const valorLiquido = valorTotal - totalRetido;

    return {
      valorTotal,
      cbsRetido,
      ibsRetido,
      isRetido,
      totalRetido,
      valorLiquido,
      aliquotas: {
        cbs: aliquotas.cbs,
        ibs: aliquotas.ibs,
        is: temIS ? aliquotaIS : 0,
      },
    };
  };

  // Registrar transação com split payment
  const registrarTransacao = useMutation({
    mutationFn: async ({
      empresaId,
      valorTotal,
      documentoNumero,
      documentoChave,
      operacaoId,
      temIS = false,
      aliquotaIS = 0,
    }: {
      empresaId: string;
      valorTotal: number;
      documentoNumero?: string;
      documentoChave?: string;
      operacaoId?: string;
      temIS?: boolean;
      aliquotaIS?: number;
    }) => {
      const calculo = calcularSplit(valorTotal, new Date().getFullYear(), temIS, aliquotaIS);

      const insertData = {
        empresa_id: empresaId,
        operacao_id: operacaoId,
        documento_numero: documentoNumero,
        documento_chave: documentoChave,
        valor_operacao: valorTotal,
        valor_liquido: calculo.valorLiquido,
        cbs_retido: calculo.cbsRetido,
        ibs_retido: calculo.ibsRetido,
        is_retido: calculo.isRetido,
        total_retido: calculo.totalRetido,
        status: 'pendente',
      };

      const { data, error } = await supabase
        .from('split_payment_transacoes')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data as SplitPaymentTransacao;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['split-payment'] });
      toast.success('Split Payment registrado', {
        description: `Tributos retidos: R$ ${(data.total_retido || 0).toFixed(2)}`,
      });
    },
    onError: (error) => {
      toast.error('Erro ao registrar split payment: ' + error.message);
    },
  });

  // Confirmar processamento
  const confirmarProcessamento = useMutation({
    mutationFn: async (transacaoId: string) => {
      const { data, error } = await supabase
        .from('split_payment_transacoes')
        .update({
          status: 'processado',
          data_processamento: new Date().toISOString(),
          protocolo: `SP${format(new Date(), 'yyyyMMddHHmmss')}`,
        })
        .eq('id', transacaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['split-payment'] });
      toast.success('Processamento confirmado');
    },
  });

  // Estatísticas
  const estatisticas = {
    totalTransacoes: transacoes.length,
    valorTotalOperacoes: transacoes.reduce((sum, t) => sum + (t.valor_operacao || 0), 0),
    totalTributosRetidos: transacoes.reduce((sum, t) => sum + (t.total_retido || 0), 0),
    pendentes: transacoes.filter(t => t.status === 'pendente').length,
    processados: transacoes.filter(t => t.status === 'processado').length,
    cbsTotal: transacoes.reduce((sum, t) => sum + (t.cbs_retido || 0), 0),
    ibsTotal: transacoes.reduce((sum, t) => sum + (t.ibs_retido || 0), 0),
  };

  return {
    transacoes,
    isLoading,
    estatisticas,
    calcularSplit,
    registrarTransacao,
    confirmarProcessamento,
    ALIQUOTAS_SPLIT,
  };
}

export default useSplitPayment;
