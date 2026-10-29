import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { mustSucceed } from '@/lib/supabase-write';
import { addMonths, format } from 'date-fns';
import type { TablesInsert } from '@/integrations/supabase/types';

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
      const parcelas: TablesInsert<'parcelas_acordo'>[] = [];
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
      if (!data.acordo_id) throw new Error('Parcela sem acordo vinculado');
      const acordoId = data.acordo_id;

      // O erro deste select era descartado, e a expressão errava nos dois
      // sentidos: com `parcelas` undefined (select falhou), `?.every` devolve
      // undefined e o acordo nunca era quitado; com um array vazio — o que a
      // RLS produz quando as parcelas estão fora do escopo — `[].every()`
      // devolve `true` e o acordo era quitado sem parcela alguma paga.
      const parcelas = await mustSucceed(
        supabase.from('parcelas_acordo').select('status').eq('acordo_id', acordoId),
        'conferir as parcelas restantes do acordo'
      );

      const todasPagas = parcelas.length > 0 && parcelas.every((p) => p.status === 'pago');

      if (todasPagas) {
        // Lê o acordo SEM alterar: as contas vinculadas são atualizadas
        // primeiro e o status='quitado' grava por último — uma falha no
        // meio deixa o acordo 'ativo' e a tentativa pode ser refeita com
        // segurança (os updates por linha são idempotentes via
        // status='em_acordo').
        const [acordoParaQuitar] = await mustSucceed(
          supabase
            .from('acordos_parcelamento')
            .select('id, contas_receber_ids, valor_total_acordo')
            .eq('id', acordoId),
          'ler o acordo de parcelamento',
          { exigirLinhas: true }
        );

        // Acordo quitado: as contas originais saem de "em_acordo" e passam a
        // refletir o pagamento — senão ficam em_acordo pra sempre e telas/
        // relatórios que filtram por status = 'recebido' nunca veem o valor.
        const contasParaQuitar = acordoParaQuitar.contas_receber_ids ?? [];
        if (contasParaQuitar.length > 0) {
          const hoje = new Date().toISOString().slice(0, 10);
          // valor_recebido é por linha e o PostgREST não aceita expressão
          // em update em massa: lemos as contas e atualizamos uma a uma.
          // O select cobre o conjunto CONTRATADO (sem filtro de status): a
          // alocação precisa dos pesos de todas as contas vinculadas.
          const contasAcordo = await mustSucceed(
            supabase
              .from('contas_receber')
              .select('id, valor, valor_recebido, status, metadata')
              .in('id', contasParaQuitar),
            'ler as contas vinculadas ao acordo'
          );

          const lista = contasAcordo ?? [];
          // Uma ID contratada que não volta do select (exclusão física ou
          // RLS) não tem como reservar cota — seu peso é desconhecido.
          // Distribuir o valor_total_acordo só entre as presentes inflaria
          // o valor_recebido delas; melhor abortar e deixar o acordo
          // 'ativo' para correção manual da causa.
          if (lista.length !== contasParaQuitar.length) {
            throw new Error(
              'Uma ou mais contas vinculadas ao acordo não foram encontradas; quitação abortada para não redistribuir cotas'
            );
          }
          // O que entrou em caixa é o total das parcelas (valor_total_acordo,
          // já líquido de desconto e com juros). Conta que já recebeu cota
          // DESTE acordo numa tentativa anterior (marcada em
          // metadata.acordo_rateio) tem a cota FIXA — ela sai do rateio e é
          // subtraída do total; sem isso o retry recalcularia cotas
          // diferentes e a soma registrada divergiria do pago. Das demais:
          // quem segue em_acordo pesa pelo saldo devedor (parciais
          // anteriores já reduzem a parte do acordo); quem saiu por outro
          // caminho (paga fora, cancelada) pesa pelo nominal, RESERVANDO
          // sua cota contratada no denominador sem receber escrita.
          const marcadores = lista.map((c) => {
            const meta =
              c.metadata && typeof c.metadata === 'object' && !Array.isArray(c.metadata)
                ? (c.metadata as Record<string, unknown>)
                : null;
            const rateio = meta?.acordo_rateio;
            return rateio &&
              typeof rateio === 'object' &&
              !Array.isArray(rateio) &&
              (rateio as Record<string, unknown>).acordo_id === acordoId &&
              typeof (rateio as Record<string, unknown>).quota === 'number'
              ? ((rateio as Record<string, unknown>).quota as number)
              : null;
          });
          const jaDistribuido = marcadores.reduce<number>((s, q) => s + (q ?? 0), 0);
          const pesos = lista.map((c, i) => {
            if (marcadores[i] !== null) return 0;
            return c.status === 'em_acordo'
              ? Math.max((c.valor || 0) - (c.valor_recebido || 0), 0)
              : Math.max(c.valor || 0, 0);
          });
          const totalPeso = pesos.reduce((s, p) => s + p, 0);
          // Sem valor_total_acordo no registro, o total a distribuir é a
          // soma dos pesos — fallback do comportamento anterior.
          const totalPago = acordoParaQuitar.valor_total_acordo ?? jaDistribuido + totalPeso;
          const restante = Math.max(totalPago - jaDistribuido, 0);
          // Rateio em centavos inteiros com floor + teto pelo próprio
          // peso (saldo devedor/cota contratada): arredondar cada cota
          // intermediária para cima poderia somar mais que o pago
          // (4×R$0,01 com acordo de R$0,02 gravaria R$0,03). O resíduo
          // vai um centavo por vez para quem ainda tem capacidade; o que
          // sobrar ALÉM de toda capacidade (acordo com juros acima do
          // principal) fica na última conta com peso — valor_recebido
          // maior que valor é receita real (juros) e a convenção
          // `valor_recebido || valor` dos KPIs a trata como dinheiro
          // recebido; descartá-lo faria o caixa registrar menos do que
          // entrou.
          const restanteCents = Math.round(restante * 100);
          const quotasCents = lista.map((_, i) => {
            if (marcadores[i] !== null) return -1;
            if (totalPeso > 0 && pesos[i] > 0) {
              return Math.min(
                Math.floor((restanteCents * pesos[i]) / totalPeso),
                Math.round(pesos[i] * 100)
              );
            }
            return 0;
          });
          let distribuidoCents = quotasCents.reduce((s, q) => s + Math.max(q, 0), 0);
          // Resíduo e excedente só podem ir para contas elegíveis —
          // em_acordo e sem marcador: são as únicas que recebem escrita
          // (.eq('status', 'em_acordo')). Cota atribuída a conta que saiu
          // do acordo por outro caminho sumiria do registro.
          const elegivel = (i: number) => marcadores[i] === null && lista[i].status === 'em_acordo';
          for (let i = 0; i < quotasCents.length && distribuidoCents < restanteCents; i++) {
            if (elegivel(i) && pesos[i] > 0) {
              const extra = Math.min(
                Math.round(pesos[i] * 100) - quotasCents[i],
                restanteCents - distribuidoCents
              );
              quotasCents[i] += extra;
              distribuidoCents += extra;
            }
          }
          // Excedente sem capacidade (juros acima do principal) vai para
          // a última conta elegível — registra o dinheiro que entrou.
          if (distribuidoCents < restanteCents) {
            let alvo = -1;
            for (let i = quotasCents.length - 1; i >= 0; i--) {
              if (elegivel(i)) {
                alvo = i;
                break;
              }
            }
            if (alvo < 0) {
              throw new Error(
                'Sem conta elegível para registrar o excedente da quitação do acordo'
              );
            }
            quotasCents[alvo] += restanteCents - distribuidoCents;
          }
          const quotas = lista.map((_, i) =>
            quotasCents[i] < 0 ? (marcadores[i] as number) : quotasCents[i] / 100
          );
          if (lista.some((c) => c.status !== 'em_acordo')) {
            logger.warn(
              'Quitação encontrou contas fora de em_acordo — cotas contratadas não redistribuídas'
            );
          }
          const resultados = await Promise.all(
            lista
              .map((c, i) => ({ c, quota: quotas[i] }))
              .filter(({ c }) => c.status === 'em_acordo')
              .map(({ c, quota }) =>
                supabase
                  .from('contas_receber')
                  .update({
                    status: 'recebido',
                    data_recebimento: hoje,
                    valor_recebido: (c.valor_recebido || 0) + quota,
                    // Cota gravada no próprio registro: num retry, o peso
                    // dela é a cota já consumida (não o nominal), então o
                    // rateio sai idêntico ao da 1ª tentativa.
                    metadata: {
                      ...(c.metadata && typeof c.metadata === 'object' && !Array.isArray(c.metadata)
                        ? (c.metadata as Record<string, unknown>)
                        : {}),
                      acordo_rateio: { acordo_id: acordoId, quota },
                    },
                  })
                  .eq('id', c.id)
                  // A conta pode ter saído do acordo entre a leitura e a
                  // escrita — a condição vai na própria escrita para não
                  // reabrir um cancelado/quitado por outro caminho.
                  .eq('status', 'em_acordo')
                  .select('id')
              )
          );
          // Erro de escrita PROPAGA: quitação parcialmente persistida não
          // pode virar toast de sucesso — o acordo segue 'ativo' e o retry
          // é idempotente (contas já recebidas saem do filtro em_acordo).
          const quitarError = resultados.find((r) => r.error)?.error;
          if (quitarError) {
            logger.error('Erro ao marcar contas do acordo quitado como recebidas:', quitarError);
            throw quitarError;
          }
          // Zero linhas afetadas = a conta saiu de em_acordo entre o SELECT
          // e o UPDATE (corrida) — trata como conflito e aborta antes de
          // quitar, senão a cota dela ficaria sem registro.
          if (resultados.some((r) => !r.data || r.data.length === 0)) {
            const conflito = new Error(
              'Uma conta saiu de em_acordo durante a quitação — retry seguro'
            );
            logger.error('Conflito de quitação do acordo de parcelamento:', conflito);
            throw conflito;
          }
        }

        await mustSucceed(
          supabase
            .from('acordos_parcelamento')
            .update({ status: 'quitado' })
            .eq('id', acordoId)
            .select('id'),
          'quitar o acordo de parcelamento',
          { exigirLinhas: true }
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acordos-parcelamento'] });
      // Quitação regrava contas_receber (status/valor_recebido) — sem
      // invalidar, KPIs e listas exibem saldo anterior à quitação.
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
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
