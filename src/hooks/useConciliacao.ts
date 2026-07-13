import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { toastReconciliationSuccess, toastImportSuccess } from '@/lib/toast-confetti';
import { logger } from '@/lib/logger';
import type { ExtratoOFX } from '@/lib/ofx-parser';
import type { TablesInsert, Tables } from '@/integrations/supabase/types';

interface ConfirmarConciliacaoParams {
  transacaoId: string;
  contaPagarId?: string;
  contaReceberId?: string;
  ajusteCentavos?: number;
  motivo?: string;
  classificacao?: string;
  regra?: string;
  evidenciaUrl?: string;
  regraId?: string;
}

export function useConciliacao() {
  const queryClient = useQueryClient();

  const confirmarConciliacao = useMutation({
    mutationFn: async ({ 
      transacaoId, contaPagarId, contaReceberId, ajusteCentavos, 
      motivo, classificacao, regra, evidenciaUrl, regraId
    }: ConfirmarConciliacaoParams) => {
      const { data: transacao } = await supabase.from('transacoes_bancarias').select('*').eq('id', transacaoId).single();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Usando a nova RPC manual para conciliação direta
      const { error } = await supabase.rpc('confirmar_conciliacao_manual', {
        p_transacao_id: transacaoId,
        p_conta_pagar_id: contaPagarId || null,
        p_conta_receber_id: contaReceberId || null,
        p_ajuste_centavos: ajusteCentavos || 0,
      });

      if (error) throw error;

      // Atualiza metadados extras na transação bancária
      const updateData: any = {
        status: 'confirmado',
        data_confirmacao: new Date().toISOString(),
        confirmado_por: user?.id,
        regra_id: regraId || null,
      };

      if (ajusteCentavos && ajusteCentavos !== 0) {
        updateData.compensacao_valor = ajusteCentavos;
        updateData.compensacao_motivo = motivo || 'Tolerância configurada';
        updateData.compensacao_classificacao = classificacao || (ajusteCentavos > 0 ? 'Juros' : 'Desconto');
        updateData.compensacao_regra = regra || 'Ajuste automático de centavos';
        updateData.compensacao_evidencia_url = evidenciaUrl;
      }

      await supabase.from('transacoes_bancarias')
        .update(updateData)
        .eq('id', transacaoId);

      const regraAplicada = ajusteCentavos && ajusteCentavos !== 0 
        ? (classificacao || (ajusteCentavos > 0 ? 'Compensação automática: Juros' : 'Compensação automática: Desconto'))
        : null;

      // Adiciona metadados de conciliação para rastreabilidade
      if (contaReceberId && transacao) {
        let mensagem = `Conciliado manualmente com transação bancária em ${new Date(transacao.data).toLocaleDateString('pt-BR')}`;
        if (regraAplicada) {
          mensagem += ` (${regraAplicada}: R$ ${Math.abs(ajusteCentavos || 0).toFixed(2)})`;
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
          mensagem += ` (${regraAplicada}: R$ ${Math.abs(ajusteCentavos || 0).toFixed(2)})`;
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
        .insert(transacao as never)
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
        .insert(transacoes as any)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-bancarias'] });
      toastImportSuccess(data?.length || 0, 'transações');
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

  const desfazerConciliacao = useMutation({
    mutationFn: async (transacaoId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.rpc('desfazer_conciliacao_manual', {
        p_transacao_id: transacaoId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes-bancarias'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast.success('Conciliação desfeita com sucesso');
    },
    onError: (error) => {
      logger.error('[useConciliacao] Erro ao desfazer conciliação:', error);
      toast.error('Erro ao desfazer conciliação');
    },
  });

  return {
    confirmarConciliacao,
    inserirTransacao,
    importarTransacoes,
    salvarExtratoBanco,
    desfazerConciliacao,
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
    return data as Tables<'transacoes_bancarias'>[];
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
