import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TransacaoOFX } from '@/lib/ofx-parser';
import type { LancamentoSistema, MatchSugestao } from '@/lib/transaction-matcher';
import {
  TOLERANCIA_CENTAVOS,
  converterContasPagarParaLancamentos,
  converterContasReceberParaLancamentos,
} from '@/lib/transaction-matcher';
import type { ImportReport } from '@/components/conciliacao/RelatorioImportacaoDialog';

export interface TransacaoImportada extends TransacaoOFX {
  conciliada: boolean;
  compensacao_valor?: number;
  compensacao_motivo?: string;
  compensacao_classificacao?: string;
  compensacao_regra?: string;
  compensacao_evidencia_url?: string;
}

interface ContaPagarRow {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  fornecedor_nome: string;
  status: string;
  numero_documento?: string | null;
  fornecedor_razao_social?: string | null;
  fornecedor_nome_fantasia?: string | null;
  centro_custo_nome?: string | null;
}

interface ContaReceberRow {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  cliente_nome: string;
  status: string;
  numero_documento?: string | null;
  cliente_razao_social?: string | null;
  cliente_nome_fantasia?: string | null;
  centro_custo_nome?: string | null;
}

export interface ConfigConciliacaoConta {
  tolerancia_centavos: number;
  aceite_automatico: boolean;
}

interface ConfirmarConciliacaoVars {
  transacaoId: string;
  contaPagarId?: string;
  contaReceberId?: string;
  ajusteCentavos?: number;
  motivo?: string;
  classificacao?: string;
  regra?: string;
}

export function montarLancamentosSistema(
  contasPagar: ContaPagarRow[] | null | undefined,
  contasReceber: ContaReceberRow[] | null | undefined
): LancamentoSistema[] {
  const lancamentosPagar = converterContasPagarParaLancamentos(
    (contasPagar || []).map((cp) => ({
      id: cp.id,
      descricao: cp.descricao,
      valor: cp.valor,
      data_vencimento: cp.data_vencimento,
      fornecedor_nome: cp.fornecedor_nome,
      status: cp.status,
      numero_documento: cp.numero_documento,
      fornecedores: cp.fornecedor_razao_social
        ? {
            razao_social: cp.fornecedor_razao_social,
            nome_fantasia: cp.fornecedor_nome_fantasia || null,
          }
        : null,
      centro_custo_nome: cp.centro_custo_nome,
    }))
  );
  const lancamentosReceber = converterContasReceberParaLancamentos(
    (contasReceber || []).map((cr) => ({
      id: cr.id,
      descricao: cr.descricao,
      valor: cr.valor,
      data_vencimento: cr.data_vencimento,
      cliente_nome: cr.cliente_nome,
      status: cr.status,
      numero_documento: cr.numero_documento,
      clientes: cr.cliente_razao_social
        ? {
            razao_social: cr.cliente_razao_social,
            nome_fantasia: cr.cliente_nome_fantasia || null,
          }
        : null,
      centro_custo_nome: cr.centro_custo_nome,
    }))
  );
  return [...lancamentosPagar, ...lancamentosReceber];
}

export async function carregarTransacoesBanco(
  contaId: string
): Promise<TransacaoImportada[] | null> {
  try {
    const { data, error } = await supabase
      .from('transacoes_bancarias')
      .select('*')
      .eq('conta_bancaria_id', contaId)
      .limit(500)
      .order('data', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar transações');
      return null;
    }

    return (data || []).map((t) => ({
      id: t.id,
      data: new Date(t.data),
      descricao: t.descricao || '',
      valor: Number(t.valor),
      tipo: t.tipo === 'receita' ? ('credito' as const) : ('debito' as const),
      conciliada: !!t.conciliada,
      compensacao_valor: t.compensacao_valor ? Number(t.compensacao_valor) : undefined,
      compensacao_motivo: t.compensacao_motivo || undefined,
      compensacao_classificacao: t.compensacao_classificacao || undefined,
      compensacao_regra: t.compensacao_regra || undefined,
      compensacao_evidencia_url: t.compensacao_evidencia_url || undefined,
    }));
  } catch {
    toast.error('Erro ao carregar transações');
    return null;
  }
}

export async function buscarConfigConciliacao(contaId: string): Promise<ConfigConciliacaoConta> {
  const { data: contaInfo } = await supabase
    .from('contas_bancarias')
    .select('configuracoes_conciliacao')
    .eq('id', contaId)
    .single();

  const config = (contaInfo?.configuracoes_conciliacao as {
    tolerancia_centavos?: number;
    aceite_automatico?: boolean;
  } | null) || {
    tolerancia_centavos: TOLERANCIA_CENTAVOS,
    aceite_automatico: true,
  };

  return {
    tolerancia_centavos: config.tolerancia_centavos ?? TOLERANCIA_CENTAVOS,
    aceite_automatico: config.aceite_automatico ?? true,
  };
}

export async function aplicarConciliacoesAutomaticas(params: {
  transacoes: TransacaoOFX[];
  matches: Map<string, MatchSugestao[]>;
  config: ConfigConciliacaoConta;
  novasTransacoes: TransacaoImportada[];
  confirmarConciliacao: { mutateAsync: (vars: ConfirmarConciliacaoVars) => Promise<unknown> };
  selectedBanco: string | null;
  onResolverManual: (transacaoId: string) => void;
}): Promise<{
  autoConciliadas: number;
  valorAutoConciliado: number;
  matchesAlta: ImportReport['matchesAlta'];
}> {
  const {
    transacoes,
    matches,
    config,
    novasTransacoes,
    confirmarConciliacao,
    selectedBanco,
    onResolverManual,
  } = params;
  const matchesAlta: ImportReport['matchesAlta'] = [];
  let autoConciliadas = 0;
  let valorAutoConciliado = 0;

  for (const transacao of transacoes) {
    const sugestoes = matches.get(transacao.id);
    if (
      sugestoes &&
      sugestoes.length > 0 &&
      sugestoes[0].confianca === 'alta' &&
      config.aceite_automatico
    ) {
      const melhorMatch = sugestoes[0];
      const valorDiff = Math.abs(transacao.valor) - melhorMatch.lancamento.valor;
      const isWithinPennyTolerance =
        Math.abs(valorDiff) <= (config.tolerancia_centavos || TOLERANCIA_CENTAVOS);

      if (isWithinPennyTolerance) {
        matchesAlta.push({ transacao, match: melhorMatch });
        autoConciliadas++;
        valorAutoConciliado += Math.abs(transacao.valor);
        const idx = novasTransacoes.findIndex((t) => t.id === transacao.id);
        if (idx >= 0) {
          novasTransacoes[idx].conciliada = true;
          novasTransacoes[idx].compensacao_valor = valorDiff;
          novasTransacoes[idx].compensacao_motivo = 'Tolerância configurada';
          novasTransacoes[idx].compensacao_classificacao = valorDiff > 0 ? 'Juros' : 'Desconto';
          novasTransacoes[idx].compensacao_regra =
            `Match automático IA (Tolerância R$ ${config.tolerancia_centavos})`;
        }

        // Efetivar conciliação automática no banco
        try {
          await confirmarConciliacao.mutateAsync({
            transacaoId: transacao.id,
            contaPagarId:
              melhorMatch.lancamentoTipo === 'pagar' ? melhorMatch.lancamentoId : undefined,
            contaReceberId:
              melhorMatch.lancamentoTipo === 'receber' ? melhorMatch.lancamentoId : undefined,
            ajusteCentavos: valorDiff,
            motivo: 'Tolerância configurada',
            classificacao: valorDiff > 0 ? 'Juros' : 'Desconto',
            regra: `Aceite automático dentro da tolerância de R$ ${config.tolerancia_centavos}`,
          });
        } catch (err: unknown) {
          console.error('Erro na conciliação automática:', err);

          // Alertar falha de conciliação automática
          toast.error(`Falha na Conciliação Automática`, {
            description: `A transação "${transacao.descricao}" não pôde ser conciliada automaticamente. Erro: ${(err instanceof Error ? err.message : '') || 'Erro no servidor'}`,
            action: {
              label: 'Resolver Manualmente',
              onClick: () => onResolverManual(transacao.id),
            },
          });

          // Registrar log de erro de conciliação no banco
          if (selectedBanco) {
            await supabase.from('webhooks_log').insert({
              event_type: 'reconciliation.failed',
              status: 'error',
              payload: {
                transacao: {
                  id: transacao.id,
                  descricao: transacao.descricao,
                  valor: transacao.valor,
                },
                match: {
                  confianca: melhorMatch.confianca,
                  lancamento_id: melhorMatch.lancamentoId,
                  lancamento_tipo: melhorMatch.lancamentoTipo,
                },
                error: String(err instanceof Error ? err.message : err),
              },
              error_message: `Falha na conciliação automática: ${err instanceof Error ? err.message : String(err)}`,
            });
          }
        }
      }
    }
  }

  return { autoConciliadas, valorAutoConciliado, matchesAlta };
}

export function filtrarTransacoes(params: {
  transacoes: TransacaoImportada[];
  search: string;
  statusTab: string;
  filters: {
    tipo: string;
    periodoInicio: string;
    periodoFim: string;
    valorMin: string;
    valorMax: string;
  };
}): TransacaoImportada[] {
  const { transacoes, search, statusTab, filters } = params;
  return transacoes.filter((t) => {
    const matchesSearch = t.descricao.toLowerCase().includes(search.toLowerCase());
    const matchesTab =
      statusTab === 'todas' ||
      (statusTab === 'pendentes' && !t.conciliada) ||
      (statusTab === 'conciliadas' && t.conciliada);
    if (filters.tipo !== 'todos' && t.tipo !== filters.tipo) return false;

    if (filters.periodoInicio) {
      if (t.data < new Date(filters.periodoInicio)) return false;
    }
    if (filters.periodoFim) {
      const end = new Date(filters.periodoFim);
      end.setHours(23, 59, 59);
      if (t.data > end) return false;
    }
    if (filters.valorMin && t.valor < parseFloat(filters.valorMin)) return false;
    if (filters.valorMax && t.valor > parseFloat(filters.valorMax)) return false;
    return matchesSearch && matchesTab;
  });
}

export function montarExportData(params: {
  transacoes: TransacaoImportada[];
  totalTransacoes: number;
  conciliadas: number;
  pendentes: number;
  percentualConciliado: number;
}) {
  const { transacoes, totalTransacoes, conciliadas, pendentes, percentualConciliado } = params;
  return {
    transacoes: transacoes.map((t) => ({
      id: t.id,
      descricao: t.descricao,
      data: t.data,
      valor: t.valor,
      tipo: t.tipo,
      status: t.conciliada ? 'conciliada' : 'pendente',
      compensacao_valor: t.compensacao_valor,
      compensacao_motivo: t.compensacao_motivo,
      compensacao_classificacao: t.compensacao_classificacao,
      compensacao_regra: t.compensacao_regra,
      compensacao_evidencia_url: t.compensacao_evidencia_url,
    })),
    stats: {
      total: totalTransacoes,
      conciliadas,
      pendentes,
      percentual: percentualConciliado,
      valorConciliado: transacoes.filter((t) => t.conciliada).reduce((s, t) => s + t.valor, 0),
      valorPendente: transacoes.filter((t) => !t.conciliada).reduce((s, t) => s + t.valor, 0),
    },
  };
}
