// HOOK: CRÉDITOS TRIBUTÁRIOS
// Gerencia créditos de CBS/IBS no banco

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { todayISOLocal } from '@/lib/formatters';

export interface CreditoTributario {
  id: string;
  empresa_id: string;
  tipo_tributo: 'CBS' | 'IBS' | 'IS';
  tipo_credito: string;

  // Documento
  documento_tipo?: string;
  documento_numero?: string;
  documento_serie?: string;
  documento_chave?: string;
  nota_fiscal_id?: string;

  // Fornecedor
  fornecedor_id?: string;
  fornecedor_cnpj?: string;
  fornecedor_nome?: string;

  // Valores
  valor_base: number;
  aliquota: number;
  valor_credito: number;

  // Período
  data_origem: string;
  competencia_origem: string;
  competencia_utilizacao?: string;

  // Status
  status: 'disponivel' | 'utilizado' | 'compensado' | 'expirado' | 'estornado' | 'transferido';

  // Utilização
  apuracao_id?: string;
  valor_utilizado: number;
  saldo_disponivel?: number;

  /** De onde veio o valor (etapa 43). Ausente em registros manuais antigos. */
  origem?: 'xml_destacado' | 'estimado' | 'manual' | null;
  /**
   * Se o crédito é apropriável (etapa 44). 2026 é ano de teste: o valor é
   * destacado, mas o crédito é apenas informativo.
   */
  efeito_tributario?: boolean | null;
  ano_fato_gerador?: number | null;

  observacoes?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

export interface CreateCreditoInput {
  empresa_id: string;
  tipo_tributo: 'CBS' | 'IBS' | 'IS';
  tipo_credito: string;
  documento_tipo?: string;
  documento_numero?: string;
  documento_chave?: string;
  nota_fiscal_id?: string;
  fornecedor_id?: string;
  fornecedor_cnpj?: string;
  fornecedor_nome?: string;
  valor_base: number;
  aliquota: number;
  valor_credito: number;
  data_origem: string;
  competencia_origem: string;
  observacoes?: string;
}

export function useCreditosTributarios(empresaId?: string) {
  const queryClient = useQueryClient();

  // Buscar créditos
  const {
    data: creditos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creditos_tributarios', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('creditos_tributarios')
        .select('*')
        .order('data_origem', { ascending: false });

      if (empresaId && empresaId !== 'all' && empresaId !== 'todas' && empresaId !== 'default') {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CreditoTributario[];
    },
  });

  // Resumo de créditos
  const { data: resumoCreditos } = useQuery({
    queryKey: ['creditos_tributarios_resumo', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('creditos_tributarios')
        .select(
          'tipo_tributo, status, valor_credito, valor_utilizado, saldo_disponivel, origem, efeito_tributario'
        );

      if (empresaId && empresaId !== 'all' && empresaId !== 'todas' && empresaId !== 'default') {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const resumo = {
        cbs: { total: 0, disponivel: 0, utilizado: 0, informativo: 0 },
        ibs: { total: 0, disponivel: 0, utilizado: 0, informativo: 0 },
        is: { total: 0, disponivel: 0, utilizado: 0, informativo: 0 },
      };

      interface CreditoData {
        tipo_tributo: string;
        status: string | null;
        valor_credito: number | null;
        valor_utilizado: number | null;
        saldo_disponivel: number;
        origem?: string | null;
        efeito_tributario?: boolean | null;
      }

      (data || []).forEach((c: CreditoData) => {
        const key = c.tipo_tributo.toLowerCase() as 'cbs' | 'ibs' | 'is';
        resumo[key].total += Number(c.valor_credito) || 0;
        resumo[key].utilizado += Number(c.valor_utilizado) || 0;

        // Etapa 44/48/88: "disponível" exige `efeito_tributario=true` **e**
        // `origem='xml_destacado'`. Antes bastava `status='disponivel'`, então
        // um crédito de 2026 (informativo) e uma estimativa (sem destaque)
        // entravam no saldo apropriável.
        // O importador grava `saldo_disponivel = 0` no crédito informativo
        // (não há saldo a gastar). Somar esse campo zerava o KPI: o valor do
        // documento está em `valor_credito`, que é o que precisa ser exibido.
        const saldo =
          Number(c.saldo_disponivel) || Number(c.valor_credito) - Number(c.valor_utilizado) || 0;

        if (c.efeito_tributario === true && c.origem === 'xml_destacado') {
          resumo[key].disponivel += saldo;
        } else if (c.status !== 'utilizado' && c.status !== 'estornado') {
          // KPI separado: informativo 2026 + estimados. Não é saldo gastável.
          resumo[key].informativo += saldo;
        }
      });

      return resumo;
    },
  });

  // Criar crédito
  const criarCredito = useMutation({
    mutationFn: async (input: CreateCreditoInput) => {
      const { data, error } = await supabase
        .from('creditos_tributarios')
        .insert({
          empresa_id: input.empresa_id,
          tipo_tributo: input.tipo_tributo,
          tipo_credito: input.tipo_credito,
          documento_tipo: input.documento_tipo,
          documento_numero: input.documento_numero,
          documento_chave: input.documento_chave,
          fornecedor_id: input.fornecedor_id,
          fornecedor_cnpj: input.fornecedor_cnpj,
          fornecedor_nome: input.fornecedor_nome,
          valor_base: input.valor_base,
          aliquota: input.aliquota,
          observacoes: input.observacoes,
          valor_credito: input.valor_credito,
          data_origem: input.data_origem,
          competencia_origem: input.competencia_origem,
          nota_fiscal_id: input.nota_fiscal_id,
          status: 'disponivel',
          valor_utilizado: 0,
          saldo_disponivel: input.valor_credito,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditos_tributarios'] });
      toast.success('Crédito registrado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar crédito: ${error.message}`);
    },
  });

  // Utilizar crédito
  const utilizarCredito = useMutation({
    mutationFn: async ({
      id,
      valorUtilizar,
      apuracaoId,
    }: {
      id: string;
      valorUtilizar: number;
      apuracaoId: string;
    }) => {
      // Buscar crédito atual
      const { data: credito, error: fetchError } = await supabase
        .from('creditos_tributarios')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const saldoAtual =
        Number(credito.saldo_disponivel) ||
        Number(credito.valor_credito) - Number(credito.valor_utilizado);

      if (valorUtilizar > saldoAtual) {
        throw new Error('Valor a utilizar maior que saldo disponível');
      }

      const novoValorUtilizado = Number(credito.valor_utilizado) + valorUtilizar;
      const novoSaldo = Number(credito.valor_credito) - novoValorUtilizado;
      const novoStatus = novoSaldo <= 0 ? 'utilizado' : 'disponivel';

      const { data, error } = await supabase
        .from('creditos_tributarios')
        .update({
          valor_utilizado: novoValorUtilizado,
          saldo_disponivel: novoSaldo,
          status: novoStatus,
          apuracao_id: apuracaoId,
          competencia_utilizacao: todayISOLocal().slice(0, 7) + '-01',
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditos_tributarios'] });
      toast.success('Crédito utilizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao utilizar crédito: ${error.message}`);
    },
  });

  // Estornar crédito
  const estornarCredito = useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('creditos_tributarios')
        .update({
          status: 'estornado',
          observacoes: `Estorno: ${motivo}`,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditos_tributarios'] });
      toast.success('Crédito estornado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao estornar: ${error.message}`);
    },
  });

  // Gerar créditos a partir de NF-e
  const gerarCreditosNFe = useMutation({
    mutationFn: async ({
      notaFiscalId,
      empresaId,
    }: {
      notaFiscalId: string;
      empresaId: string;
    }) => {
      // Buscar nota fiscal
      const { data: nf, error: nfError } = await supabase
        .from('notas_fiscais')
        .select('*')
        .eq('id', notaFiscalId)
        .single();

      if (nfError) throw nfError;

      // data_emissao é NOT NULL em NF-e emitida; normalizamos uma vez.
      const dataEmissao = nf.data_emissao ?? '';

      // Determinar alíquotas baseado no ano
      const ano = new Date(dataEmissao).getFullYear();
      let aliquotaCBS = 0,
        aliquotaIBS = 0;

      if (ano >= 2026) {
        aliquotaCBS = ano === 2026 ? 0.009 : ano === 2027 ? 0.009 : 0.088;
        aliquotaIBS = ano === 2026 ? 0.001 : ano === 2027 ? 0.001 : 0.172;
      }

      const valorBase = Number(nf.valor_produtos);
      const creditoCBS = valorBase * aliquotaCBS;
      const creditoIBS = valorBase * aliquotaIBS;

      // Shape completo do crédito gerado (colunas de creditos_tributarios).
      interface CreditoGerado {
        empresa_id: string;
        tipo_tributo: 'CBS' | 'IBS';
        tipo_credito: string;
        documento_tipo: string;
        documento_numero: string | null;
        documento_chave: string | null;
        nota_fiscal_id: string;
        valor_base: number;
        aliquota: number;
        valor_credito: number;
        data_origem: string;
        competencia_origem: string;
        status: string;
        valor_utilizado: number;
        saldo_disponivel: number;
      }
      const creditos: CreditoGerado[] = [];

      if (creditoCBS > 0) {
        creditos.push({
          empresa_id: empresaId,
          tipo_tributo: 'CBS',
          tipo_credito: 'aquisicao_mercadorias',
          documento_tipo: 'nfe',
          documento_numero: nf.numero,
          documento_chave: nf.chave_acesso,
          nota_fiscal_id: notaFiscalId,
          valor_base: valorBase,
          aliquota: aliquotaCBS,
          valor_credito: creditoCBS,
          data_origem: dataEmissao,
          competencia_origem: dataEmissao.slice(0, 7) + '-01',
          status: 'disponivel',
          valor_utilizado: 0,
          saldo_disponivel: creditoCBS,
        });
      }

      if (creditoIBS > 0) {
        creditos.push({
          empresa_id: empresaId,
          tipo_tributo: 'IBS',
          tipo_credito: 'aquisicao_mercadorias',
          documento_tipo: 'nfe',
          documento_numero: nf.numero,
          documento_chave: nf.chave_acesso,
          nota_fiscal_id: notaFiscalId,
          valor_base: valorBase,
          aliquota: aliquotaIBS,
          valor_credito: creditoIBS,
          data_origem: dataEmissao,
          competencia_origem: dataEmissao.slice(0, 7) + '-01',
          status: 'disponivel',
          valor_utilizado: 0,
          saldo_disponivel: creditoIBS,
        });
      }

      if (creditos.length > 0) {
        const { data, error } = await supabase
          .from('creditos_tributarios')
          .insert(creditos)
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creditos_tributarios'] });
      if (data.length > 0) {
        toast.success(`${data.length} crédito(s) gerado(s) com sucesso`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar créditos: ${error.message}`);
    },
  });

  return {
    creditos,
    resumoCreditos,
    isLoading,
    error,
    criarCredito,
    utilizarCredito,
    estornarCredito,
    gerarCreditosNFe,
  };
}

/**
 * Etapa 89 — Busca os créditos `xml_destacado` do sistema por chave de acesso,
 * para o diff da conciliação contra o extrato da apuração assistida.
 */
export function useCreditosPorChaves(chaves: string[]) {
  return useQuery({
    queryKey: ['creditos_tributarios_por_chaves', chaves],
    enabled: chaves.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creditos_tributarios')
        .select('documento_chave, tipo_tributo, valor_credito')
        .in('documento_chave', chaves)
        .eq('origem', 'xml_destacado')
        .eq('efeito_tributario', true);

      if (error) throw error;
      return (data || []) as {
        documento_chave: string | null;
        tipo_tributo: string;
        valor_credito: number | null;
      }[];
    },
  });
}
