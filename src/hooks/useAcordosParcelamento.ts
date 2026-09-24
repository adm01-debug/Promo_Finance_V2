import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { mustSucceed } from '@/lib/supabase-write';
import { addMonths, format } from 'date-fns';

export interface AcordoParcelamento {
  id: string;
  numero_acordo: string;
  cliente_id: string | null;
  cliente_nome: string;
  cliente_email: string | null;
  cliente_telefone: string | null;
  valor_original: number;
  valor_total_acordo: number;
  desconto_aplicado: number;
  juros_aplicado: number;
  numero_parcelas: number;
  valor_parcela: number;
  data_primeiro_vencimento: string;
  dia_vencimento: number;
  status: 'ativo' | 'quitado' | 'cancelado' | 'inadimplente';
  observacoes: string | null;
  contas_receber_ids: string[];
  empresa_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ParcelaAcordo {
  id: string;
  acordo_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  valor_pago: number | null;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  conta_receber_id: string | null;
  created_at: string;
}

export interface CreateAcordoData {
  cliente_id?: string | null;
  cliente_nome: string;
  cliente_email?: string | null;
  cliente_telefone?: string | null;
  valor_original: number;
  desconto_percentual?: number;
  juros_percentual?: number;
  numero_parcelas: number;
  data_primeiro_vencimento: string;
  dia_vencimento: number;
  observacoes?: string | null;
  contas_receber_ids: string[];
  empresa_id: string;
}

export function useAcordosParcelamento() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: acordos = [], isLoading } = useQuery({
    queryKey: ['acordos-parcelamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acordos_parcelamento')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AcordoParcelamento[];
    },
    enabled: !!user,
  });

  const buscarParcelas = async (acordoId: string) => {
    const { data, error } = await supabase
      .from('parcelas_acordo')
      .select('*')
      .eq('acordo_id', acordoId)
      .order('numero_parcela');
    if (error) throw error;
    return data as ParcelaAcordo[];
  };

  const criarAcordoMutation = useMutation({
    mutationFn: async (data: CreateAcordoData) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Calcular valores
      const desconto = data.valor_original * ((data.desconto_percentual || 0) / 100);
      const valorComDesconto = data.valor_original - desconto;
      const juros = valorComDesconto * ((data.juros_percentual || 0) / 100);
      const valorTotalAcordo = valorComDesconto + juros;
      const valorParcela = Math.ceil((valorTotalAcordo / data.numero_parcelas) * 100) / 100;

      // Gerar número do acordo
      const { data: numeroData, error: numeroError } = await supabase.rpc('gerar_numero_acordo');
      if (numeroError) throw numeroError;

      // Criar acordo
      const { data: acordo, error: acordoError } = await supabase
        .from('acordos_parcelamento')
        .insert({
          numero_acordo: numeroData,
          cliente_id: data.cliente_id || null,
          cliente_nome: data.cliente_nome,
          cliente_email: data.cliente_email || null,
          cliente_telefone: data.cliente_telefone || null,
          valor_original: data.valor_original,
          valor_total_acordo: valorTotalAcordo,
          desconto_aplicado: desconto,
          juros_aplicado: juros,
          numero_parcelas: data.numero_parcelas,
          valor_parcela: valorParcela,
          data_primeiro_vencimento: data.data_primeiro_vencimento,
          dia_vencimento: data.dia_vencimento,
          observacoes: data.observacoes || null,
          contas_receber_ids: data.contas_receber_ids,
          empresa_id: data.empresa_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (acordoError) throw acordoError;

      // Criar parcelas
      const parcelas = [];
      let dataVencimento = new Date(data.data_primeiro_vencimento);

      for (let i = 1; i <= data.numero_parcelas; i++) {
        // Última parcela pode ter ajuste de centavos
        const valorParcelaAjustado =
          i === data.numero_parcelas
            ? valorTotalAcordo - valorParcela * (data.numero_parcelas - 1)
            : valorParcela;

        parcelas.push({
          acordo_id: acordo.id,
          numero_parcela: i,
          valor: valorParcelaAjustado,
          data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
          status: 'pendente',
        });

        dataVencimento = addMonths(dataVencimento, 1);
      }

      const { error: parcelasError } = await supabase.from('parcelas_acordo').insert(parcelas);

      if (parcelasError) throw parcelasError;

      // Atualizar contas a receber originais como "em acordo": status dedicado,
      // não só observações — é o que executar-regua-cobranca filtra para
      // parar de cobrar automaticamente uma conta já negociada.
      if (data.contas_receber_ids.length > 0) {
        const { error: updateError } = await supabase
          .from('contas_receber')
          .update({ status: 'em_acordo', observacoes: `Em acordo: ${numeroData}` })
          .in('id', data.contas_receber_ids);

        if (updateError) logger.error('Erro ao atualizar contas:', updateError);
      }

      return acordo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acordos-parcelamento'] });
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast.success('Acordo de parcelamento criado com sucesso!');
    },
    onError: (error: unknown) => {
      logger.error('Erro ao criar acordo:', error);
      toast.error('Erro ao criar acordo de parcelamento');
    },
  });

  const registrarPagamentoMutation = useMutation({
    mutationFn: async ({
      parcelaId,
      valorPago: _valorPago,
    }: {
      parcelaId: string;
      valorPago: number;
    }) => {
      const { data, error } = await supabase
        .from('parcelas_acordo')
        // TODO(2026-08-14): data_pagamento/valor_pago removidos — não existem em parcelas_acordo (types.ts)
        .update({ status: 'pago' })
        .eq('id', parcelaId)
        .select('acordo_id')
        .single();

      if (error) throw error;

      // O erro deste select era descartado, e a expressão errava nos dois
      // sentidos: com `parcelas` undefined (select falhou), `?.every` devolve
      // undefined e o acordo nunca era quitado; com um array vazio — o que a
      // RLS produz quando as parcelas estão fora do escopo — `[].every()`
      // devolve `true` e o acordo era quitado sem parcela alguma paga.
      const parcelas = await mustSucceed(
        supabase.from('parcelas_acordo').select('status').eq('acordo_id', data.acordo_id),
        'conferir as parcelas restantes do acordo'
      );

      const todasPagas = parcelas.length > 0 && parcelas.every((p) => p.status === 'pago');

      if (todasPagas) {
        const [acordoQuitado] = await mustSucceed(
          supabase
            .from('acordos_parcelamento')
            .update({ status: 'quitado' })
            .eq('id', data.acordo_id)
            .select('id, contas_receber_ids'),
          'quitar o acordo de parcelamento',
          { exigirLinhas: true }
        );

        // Acordo quitado: as contas originais saem de "em_acordo" e passam a
        // refletir o pagamento — senão ficam em_acordo pra sempre e telas/
        // relatórios que filtram por status = 'recebido' nunca veem o valor.
        const contasParaQuitar = acordoQuitado.contas_receber_ids ?? [];
        if (contasParaQuitar.length > 0) {
          const { error: quitarError } = await supabase
            .from('contas_receber')
            .update({ status: 'recebido', data_recebimento: new Date().toISOString().slice(0, 10) })
            .in('id', contasParaQuitar)
            .eq('status', 'em_acordo');

          if (quitarError)
            logger.error('Erro ao marcar contas do acordo quitado como recebidas:', quitarError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acordos-parcelamento'] });
      toast.success('Pagamento registrado!');
    },
    onError: (error: unknown) => {
      logger.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    },
  });

  const cancelarAcordoMutation = useMutation({
    mutationFn: async (acordoId: string) => {
      // Sem `exigirLinhas` de propósito: um acordo com todas as parcelas já
      // pagas não tem nenhuma pendente para cancelar, e zero linhas aqui é o
      // resultado correto. O que precisava ser verificado é o erro.
      await mustSucceed(
        supabase
          .from('parcelas_acordo')
          .update({ status: 'cancelado' })
          .eq('acordo_id', acordoId)
          .eq('status', 'pendente'),
        'cancelar as parcelas pendentes do acordo'
      );

      // Aqui, ao contrário, zero linhas é bug: significa acordo inexistente ou
      // fora do escopo da empresa, e o toast de sucesso mentiria.
      const [acordoCancelado] = await mustSucceed(
        supabase
          .from('acordos_parcelamento')
          .update({ status: 'cancelado' })
          .eq('id', acordoId)
          .select('id, contas_receber_ids'),
        'cancelar o acordo de parcelamento',
        { exigirLinhas: true }
      );

      // Acordo cancelado: a conta volta a ser cobrada pela régua automática.
      const contasParaReverter = acordoCancelado.contas_receber_ids ?? [];
      if (contasParaReverter.length > 0) {
        const { error: revertError } = await supabase
          .from('contas_receber')
          .update({ status: 'pendente' })
          .in('id', contasParaReverter)
          .eq('status', 'em_acordo');

        if (revertError)
          logger.error('Erro ao reverter status das contas do acordo cancelado:', revertError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acordos-parcelamento'] });
      toast.success('Acordo cancelado');
    },
    onError: (error: unknown) => {
      logger.error('Erro ao cancelar acordo:', error);
      toast.error('Erro ao cancelar acordo');
    },
  });

  // Estatísticas
  const stats = {
    total: acordos.length,
    ativos: acordos.filter((a) => a.status === 'ativo').length,
    quitados: acordos.filter((a) => a.status === 'quitado').length,
    cancelados: acordos.filter((a) => a.status === 'cancelado').length,
    valorTotalAcordos: acordos
      .filter((a) => a.status === 'ativo')
      .reduce((acc, a) => acc + a.valor_total_acordo, 0),
  };

  return {
    acordos,
    isLoading,
    stats,
    buscarParcelas,
    criarAcordo: criarAcordoMutation.mutate,
    registrarPagamento: registrarPagamentoMutation.mutate,
    cancelarAcordo: cancelarAcordoMutation.mutate,
    isCriando: criarAcordoMutation.isPending,
  };
}

// Função utilitária para simular parcelamento
export function simularParcelamento(params: {
  valorOriginal: number;
  descontoPercentual?: number;
  jurosPercentual?: number;
  numeroParcelas: number;
}) {
  const desconto = params.valorOriginal * ((params.descontoPercentual || 0) / 100);
  const valorComDesconto = params.valorOriginal - desconto;
  const juros = valorComDesconto * ((params.jurosPercentual || 0) / 100);
  const valorTotal = valorComDesconto + juros;
  const valorParcela = Math.ceil((valorTotal / params.numeroParcelas) * 100) / 100;

  return {
    valorOriginal: params.valorOriginal,
    desconto,
    juros,
    valorTotal,
    valorParcela,
    numeroParcelas: params.numeroParcelas,
  };
}
