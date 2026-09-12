// HOOK: PER/DCOMP DIGITAL
// Pedido de Restituição e Compensação

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TipoPedido = 'per' | 'dcomp';
export type StatusPedido =
  | 'rascunho'
  | 'aguardando_transmissao'
  | 'transmitido'
  | 'em_analise'
  | 'deferido'
  | 'indeferido'
  | 'cancelado';

export type TipoCreditoOrigem =
  | 'saldo_negativo'
  | 'pagamento_indevido'
  | 'retencao'
  | 'ressarcimento'
  | 'exportacao';

export interface PerDcomp {
  id: string;
  empresa_id: string;
  tipo: TipoPedido;
  numero_processo?: string;
  numero_recibo?: string;
  data_transmissao?: string;
  tipo_credito_origem: TipoCreditoOrigem;
  tributo_origem: string;
  competencia_origem: string;
  valor_original: number;
  valor_atualizado?: number;
  tributo_destino?: string;
  competencia_destino?: string;
  valor_compensado?: number;
  creditos_ids: string[];
  status: StatusPedido;
  data_protocolo?: string;
  data_decisao?: string;
  prazo_recurso?: string;
  justificativa?: string;
  fundamentacao_legal?: string;
  observacoes?: string;
  created_at: string;
  created_by?: string;
}

// Tributos válidos para PER/DCOMP
export const TRIBUTOS_VALIDOS = [
  { codigo: 'cbs', nome: 'CBS - Contribuição sobre Bens e Serviços' },
  { codigo: 'ibs', nome: 'IBS - Imposto sobre Bens e Serviços' },
  { codigo: 'irpj', nome: 'IRPJ - Imposto de Renda Pessoa Jurídica' },
  { codigo: 'csll', nome: 'CSLL - Contribuição Social sobre Lucro Líquido' },
  { codigo: 'pis', nome: 'PIS - Programa de Integração Social' },
  { codigo: 'cofins', nome: 'COFINS - Contribuição para Financiamento da Seguridade' },
  { codigo: 'ipi', nome: 'IPI - Imposto sobre Produtos Industrializados' },
];

export const TIPOS_CREDITO_ORIGEM = [
  { codigo: 'saldo_negativo', nome: 'Saldo Negativo de IRPJ/CSLL' },
  { codigo: 'pagamento_indevido', nome: 'Pagamento Indevido ou a Maior' },
  { codigo: 'retencao', nome: 'Retenções na Fonte' },
  { codigo: 'ressarcimento', nome: 'Ressarcimento de IPI/Exportação' },
  { codigo: 'exportacao', nome: 'Créditos de Exportação (IBS/CBS)' },
];

export const TRANSMISSAO_PER_DCOMP_INDISPONIVEL =
  'A transmissão de PER/DCOMP não está configurada. O pedido permanece como rascunho e nenhum crédito foi compensado.';

/** Impede que a interface registre transmissão fiscal sem comprovante externo verificável. */
export function transmitirPerDcompNaoConfigurado(): never {
  throw new Error(TRANSMISSAO_PER_DCOMP_INDISPONIVEL);
}

export function usePerDcomp(empresaId?: string) {
  const queryClient = useQueryClient();

  // Buscar pedidos
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['per-dcomp', empresaId],
    queryFn: async () => {
      let query = supabase.from('per_dcomp').select('*').order('created_at', { ascending: false });

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PerDcomp[];
    },
  });

  // Criar novo pedido
  const criarPedido = useMutation({
    mutationFn: async (
      pedido: Omit<PerDcomp, 'id' | 'created_at' | 'numero_processo' | 'numero_recibo'>
    ) => {
      const { data, error } = await supabase
        .from('per_dcomp')
        .insert({
          ...pedido,
          status: 'rascunho',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['per-dcomp'] });
      toast.success('Pedido criado como rascunho');
    },
    onError: (error) => {
      toast.error('Erro ao criar pedido: ' + error.message);
    },
  });

  // Atualizar pedido
  const atualizarPedido = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PerDcomp> & { id: string }) => {
      const { data, error } = await supabase
        .from('per_dcomp')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['per-dcomp'] });
      toast.success('Pedido atualizado');
    },
  });

  // A transmissão externa ainda não está homologada. Falhar fechado é mais seguro
  // do que atribuir um recibo aleatório e alterar créditos locais.
  const transmitirPedido = useMutation({
    mutationFn: async (_pedidoId: string) => transmitirPerDcompNaoConfigurado(),
    onError: (error) => {
      toast.error('Transmissão indisponível: ' + error.message);
    },
  });

  // Cancelar pedido
  const cancelarPedido = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { data, error } = await supabase
        .from('per_dcomp')
        .update({ status: 'cancelado' })
        .eq('id', pedidoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['per-dcomp'] });
      toast.success('Pedido cancelado');
    },
  });

  // Calcular valor atualizado com SELIC
  const calcularValorAtualizado = (valorOriginal: number, dataOrigem: Date): number => {
    const mesesDecorridos = Math.floor(
      (new Date().getTime() - dataOrigem.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    // Aproximação da SELIC mensal (0.9% ao mês)
    const taxaMensal = 0.009;
    const fatorCorrecao = Math.pow(1 + taxaMensal, mesesDecorridos);

    return valorOriginal * fatorCorrecao;
  };

  // Estatísticas
  const estatisticas = {
    total: pedidos.length,
    rascunhos: pedidos.filter((p) => p.status === 'rascunho').length,
    transmitidos: pedidos.filter((p) => p.status === 'transmitido').length,
    emAnalise: pedidos.filter((p) => p.status === 'em_analise').length,
    deferidos: pedidos.filter((p) => p.status === 'deferido').length,
    indeferidos: pedidos.filter((p) => p.status === 'indeferido').length,
    valorTotalOriginal: pedidos.reduce((sum, p) => sum + p.valor_original, 0),
    valorTotalCompensado: pedidos
      .filter((p) => p.tipo === 'dcomp' && p.status === 'deferido')
      .reduce((sum, p) => sum + (p.valor_compensado || p.valor_original), 0),
  };

  return {
    pedidos,
    isLoading,
    estatisticas,
    criarPedido,
    atualizarPedido,
    transmitirPedido,
    cancelarPedido,
    calcularValorAtualizado,
    TRIBUTOS_VALIDOS,
    TIPOS_CREDITO_ORIGEM,
  };
}

export default usePerDcomp;
