// HOOK: RETENÇÕES NA FONTE
// IRRF, CSRF, INSS, ISS, CBS, IBS

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, endOfMonth } from 'date-fns';
import { mustSucceed } from '@/lib/supabase-write';

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
      let query = supabase.from('darfs').select('*').order('data_vencimento', { ascending: true });

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
      retencoesIds,
    }: {
      empresaId: string;
      competencia: string;
      tipoRetencao: TipoRetencao;
      retencoesIds: string[];
    }) => {
      // A lista precisa ser normalizada antes de virar critério de contagem:
      // um id repetido faria a função contar menos disponíveis do que pedidas
      // e acusar lote parcial sem haver problema. A função deduplica de novo
      // do lado do servidor; aqui a normalização serve à checagem local.
      const idsUnicos = Array.from(new Set(retencoesIds));

      if (idsUnicos.length === 0) {
        throw new Error('Nenhuma retenção selecionada');
      }

      // Id selecionado que sumiu da lista carregada: emitir a guia com ele em
      // `retencoes_ids` criaria um DARF apontando para retenção inexistente.
      // A função repete a checagem sobre o estado real do banco; esta aqui só
      // antecipa o erro com uma mensagem que o usuário entende.
      const retencoesSelecionadas = retencoes.filter((r) => idsUnicos.includes(r.id));
      if (retencoesSelecionadas.length !== idsUnicos.length) {
        throw new Error(
          'Parte das retenções selecionadas não está mais disponível. Recarregue a lista e tente novamente.'
        );
      }

      const codigoReceita = CODIGOS_RECEITA[tipoRetencao];

      // Calcular data de vencimento (último dia útil do mês seguinte)
      const [ano, mes] = competencia.split('-').map(Number);
      const dataVencimento = format(endOfMonth(new Date(ano, mes, 1)), 'yyyy-MM-dd');

      // Passo único. Antes eram duas requisições — insert do DARF e depois
      // `update ... in(ids)` nas retenções — e o PostgREST abre uma transação
      // por requisição: falhar entre elas deixava a guia emitida com as
      // retenções ainda pendentes, que voltariam ao DARF seguinte
      // (recolhimento em duplicidade). A função grava as duas coisas na mesma
      // transação, soma `valor_retido` no servidor (o cliente somava de uma
      // lista já filtrada pelo RLS) e exige `darf_gerado = false` em todas,
      // o que bloqueia a dupla inclusão na origem.
      const darf = await mustSucceed(
        supabase.rpc('gerar_darf_retencoes', {
          p_empresa_id: empresaId,
          p_competencia: competencia,
          p_codigo_receita: codigoReceita.codigo,
          p_descricao_receita: codigoReceita.descricao,
          p_data_vencimento: dataVencimento,
          p_retencoes_ids: idsUnicos,
        }),
        'gerar o DARF das retenções'
      );

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
      // Passo único. Antes eram duas requisições — pagar o DARF e depois
      // marcar as retenções — cada uma na sua própria transação: falhar entre
      // elas deixava a guia paga com as retenções ainda pendentes, que
      // reapareciam no DARF seguinte. A função grava as duas na mesma
      // transação, lê `retencoes_ids` da linha travada (não do cache filtrado
      // por empresa/competência), deduplica os ids herdados de guias antigas e
      // confere o ROW_COUNT da marcação.
      //
      // O UPDATE da guia exige `status IS DISTINCT FROM 'pago'`: um segundo
      // clique não regrava a data de pagamento, ele falha com `darf_nao_pagavel`.
      return await mustSucceed(
        supabase.rpc('pagar_darf_retencoes', {
          p_darf_id: darfId,
          p_data_pagamento: dataPagamento,
        }),
        'registrar o pagamento do DARF'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retencoes-fonte'] });
      queryClient.invalidateQueries({ queryKey: ['darfs'] });
      toast.success('Pagamento registrado');
    },
    // Sem este handler a mutação rejeitava sem dizer nada ao usuário: o DARF
    // aparecia como não pago e não havia sinal do porquê.
    onError: (error) => {
      toast.error('Erro ao registrar pagamento do DARF: ' + error.message);
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
  const resumoPorTipo = retencoes.reduce(
    (acc, r) => {
      if (!acc[r.tipo_retencao]) {
        acc[r.tipo_retencao] = { total: 0, pendente: 0, recolhido: 0, count: 0 };
      }
      acc[r.tipo_retencao].total += r.valor_retido;
      acc[r.tipo_retencao].count++;
      if (r.status === 'pendente') acc[r.tipo_retencao].pendente += r.valor_retido;
      if (r.status === 'recolhido') acc[r.tipo_retencao].recolhido += r.valor_retido;
      return acc;
    },
    {} as Record<
      TipoRetencao,
      { total: number; pendente: number; recolhido: number; count: number }
    >
  );

  // Retenções pendentes próximas do vencimento
  const retencoesCriticas = retencoes.filter((r) => {
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
