import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { toastReconciliationSuccess, toastImportSuccess } from '@/lib/toast-confetti';

interface ConfirmarConciliacaoParams {
  transacaoId: string;
  contaPagarId?: string;
  contaReceberId?: string;
}

export function useConciliacao() {
  const queryClient = useQueryClient();

  const confirmarConciliacao = useMutation({
    mutationFn: async ({ transacaoId, contaPagarId, contaReceberId }: ConfirmarConciliacaoParams) => {
      const { error } = await supabase.rpc('confirmar_conciliacao', {
        p_transacao_id: transacaoId,
        p_conta_pagar_id: contaPagarId || null,
        p_conta_receber_id: contaReceberId || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-bancarias'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      // Use confetti toast for reconciliation success
      toastReconciliationSuccess(1);
    },
    onError: (error) => {
      console.error('Erro ao confirmar conciliação:', error);
      toast.error('Erro ao confirmar conciliação');
    },
  });

  const inserirTransacao = useMutation({
    mutationFn: async (transacao: {
      conta_bancaria_id: string;
      data: string;
      descricao: string;
      valor: number;
      tipo: 'receita' | 'despesa';
      saldo: number;
    }) => {
      const { data, error } = await supabase
        .from('transacoes_bancarias')
        .insert(transacao)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-bancarias'] });
    },
    onError: (error) => {
      console.error('Erro ao inserir transação:', error);
      toast.error('Erro ao inserir transação');
    },
  });

  const importarTransacoes = useMutation({
    mutationFn: async (transacoes: Array<{
      conta_bancaria_id: string;
      data: string;
      descricao: string;
      valor: number;
      tipo: 'receita' | 'despesa';
      saldo: number;
    }>) => {
      const { data, error } = await supabase
        .from('transacoes_bancarias')
        .insert(transacoes)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-bancarias'] });
      // Use confetti toast for import success
      toastImportSuccess(data.length, 'transações');
    },
    onError: (error) => {
      console.error('Erro ao importar transações:', error);
      toast.error('Erro ao importar transações');
    },
  });

  return {
    confirmarConciliacao,
    inserirTransacao,
    importarTransacoes,
  };
}

export function useTransacoesBancarias(contaBancariaId?: string) {
  const queryClient = useQueryClient();
  
  const fetchTransacoes = async () => {
    let query = supabase
      .from('transacoes_bancarias')
      .select('*')
      .order('data', { ascending: false });

    if (contaBancariaId) {
      query = query.eq('conta_bancaria_id', contaBancariaId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  };

  return {
    fetchTransacoes,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['transacoes-bancarias'] }),
  };
}

export function useHistoricoCobranca(contaReceberId: string) {
  const fetchHistorico = async () => {
    const { data, error } = await supabase
      .from('historico_cobranca')
      .select('*')
      .eq('conta_receber_id', contaReceberId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  return { fetchHistorico };
}
