import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { toastReconciliationSuccess, toastImportSuccess } from '@/lib/toast-confetti';
import { logger } from '@/lib/logger';
import type { TransacaoOFX, ExtratoOFX } from '@/lib/ofx-parser';
import type { TablesInsert } from '@/integrations/supabase/types';

interface ConfirmarConciliacaoParams {
  transacaoId: string;
  contaPagarId?: string;
  contaReceberId?: string;
  ajusteCentavos?: number;
}

export function useConciliacao() {
  const queryClient = useQueryClient();

  const confirmarConciliacao = useMutation({
    mutationFn: async ({ transacaoId, contaPagarId, contaReceberId, ajusteCentavos }: ConfirmarConciliacaoParams) => {
      const { data: transacao } = await supabase.from('transacoes_bancarias').select('*').eq('id', transacaoId).single();
      
      const { error } = await supabase.rpc('confirmar_conciliacao', {
        p_transacao_id: transacaoId,
        p_conta_pagar_id: contaPagarId || null,
        p_conta_receber_id: contaReceberId || null,
        p_ajuste_centavos: ajusteCentavos || 0,
      });

      if (error) throw error;

      const regraAplicada = ajusteCentavos && ajusteCentavos !== 0 
        ? (ajusteCentavos > 0 ? 'Compensação automática: Juros' : 'Compensação automática: Desconto')
        : null;

      // Adiciona metadados de conciliação para rastreabilidade
      if (contaReceberId && transacao) {
        let mensagem = `Conciliado manualmente com transação bancária em ${new Date(transacao.data).toLocaleDateString('pt-BR')}`;
        if (regraAplicada) {
          mensagem += ` (${regraAplicada}: R$ ${Math.abs(ajusteCentavos).toFixed(2)})`;
        } else if (ajusteCentavos && ajusteCentavos !== 0) {
          mensagem += ` (Ajuste de centavos: R$ ${ajusteCentavos.toFixed(2)})`;
        }

        await supabase.rpc('registrar_evento_receber', {
          p_conta_id: contaReceberId,
          p_tipo: 'conciliacao',
          p_mensagem: mensagem,
          p_metadata: { 
            transacao_banco: transacao, 
            ajuste_centavos: ajusteCentavos,
            regra_aplicada: regraAplicada 
          }
        });
        
        await supabase.from('contas_receber').update({ 
          transacao_conciliada_id: transacaoId 
        }).eq('id', contaReceberId);
      }

      if (contaPagarId && transacao) {
        let mensagem = `Conciliado manualmente com transação bancária em ${new Date(transacao.data).toLocaleDateString('pt-BR')}`;
        if (regraAplicada) {
          mensagem += ` (${regraAplicada}: R$ ${Math.abs(ajusteCentavos).toFixed(2)})`;
        }

        await supabase.rpc('registrar_evento_pagar', {
          p_conta_id: contaPagarId,
          p_tipo: 'conciliacao',
          p_mensagem: mensagem,
          p_metadata: { 
            transacao_banco: transacao, 
            ajuste_centavos: ajusteCentavos,
            regra_aplicada: regraAplicada 
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-bancarias'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toastReconciliationSuccess(1);
    },
    onError: (error) => {
      logger.error('[useConciliacao] Erro ao confirmar conciliação:', error);
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
      logger.error('[useConciliacao] Erro ao inserir transação:', error);
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
      toastImportSuccess(data.length, 'transações');
    },
    onError: (error) => {
      logger.error('[useConciliacao] Erro ao importar transações:', error);
      toast.error('Erro ao importar transações');
    },
  });

  const salvarExtratoBanco = useMutation({
    mutationFn: async ({ extrato, contaBancariaId }: { extrato: ExtratoOFX; contaBancariaId: string }) => {
      const rows: TablesInsert<'extrato_bancario'>[] = extrato.transacoes.map((t, i) => ({
        conta_bancaria_id: contaBancariaId,
        data: t.data.toISOString().split('T')[0],
        descricao: t.descricao,
        valor: t.valor,
        tipo: t.tipo === 'credito' ? 'credito' : 'debito',
        numero_documento: t.numeroReferencia || null,
        numero_documento_banco: t.checkNum || null,
        codigo_transacao: t.tipoTransacao || null,
        arquivo_origem: extrato.nomeArquivo,
        importado_de: extrato.formato,
        importado_em: new Date().toISOString(),
        linha_arquivo: i + 1,
        hash_transacao: `${contaBancariaId}_${t.data.toISOString().split('T')[0]}_${t.valor}_${t.descricao.slice(0, 30)}`,
        saldo: extrato.conta.saldoFinal || null,
      }));

      const hashes = rows.map(r => r.hash_transacao).filter(Boolean) as string[];
      const { data: existing } = await supabase
        .from('extrato_bancario')
        .select('hash_transacao')
        .in('hash_transacao', hashes);

      const existingHashes = new Set((existing || []).map(e => e.hash_transacao));
      const newRows = rows.filter(r => !existingHashes.has(r.hash_transacao));
      const duplicateCount = rows.length - newRows.length;

      if (newRows.length === 0) {
        return { saved: 0, duplicates: duplicateCount };
      }

      const { error } = await supabase
        .from('extrato_bancario')
        .insert(newRows);

      if (error) throw error;

      return { saved: newRows.length, duplicates: duplicateCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extrato-bancario'] });
    },
    onError: (error) => {
      logger.error('[useConciliacao] Erro ao salvar extrato:', error);
      toast.error('Erro ao salvar extrato no banco');
    },
  });

  return {
    confirmarConciliacao,
    inserirTransacao,
    importarTransacoes,
    salvarExtratoBanco,
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
