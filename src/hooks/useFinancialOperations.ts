import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Cliente com schema genérico usado apenas nas consultas com filtros dinâmicos.
 * Evita a explosão de instanciação de tipos (TS2589) do builder tipado quando
 * o mesmo builder é reatribuído condicionalmente. Os resultados continuam
 * validados por asserção explícita para as interfaces deste módulo.
 */
const dynamicDb = supabase as unknown as SupabaseClient;

// NOTE: movimentacoes are primarily created by triggers (transferências, pagamentos).
// Direct inserts should only be used for manual adjustments by admins.

export interface Movimentacao {
  id: string;
  empresa_id: string;
  conta_bancaria_id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data_movimentacao: string;
  categoria_id?: string | null;
  conta_pagar_id?: string | null;
  conta_receber_id?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  conciliada?: boolean | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MovimentacaoInput {
  empresa_id: string;
  conta_bancaria_id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data_movimentacao: string;
  categoria_id?: string;
  conta_pagar_id?: string;
  conta_receber_id?: string;
  origem?: string;
  observacoes?: string;
}

export function useMovimentacoes(
  contaBancariaId?: string,
  filters?: { startDate?: string; endDate?: string }
) {
  return useQuery({
    queryKey: ['movimentacoes', contaBancariaId, filters],
    queryFn: async () => {
      const base = dynamicDb
        .from('movimentacoes')
        .select('*')
        .is('deleted_at', null)
        .order('data_movimentacao', { ascending: false });

      let query: typeof base = base;
      if (contaBancariaId) query = query.eq('conta_bancaria_id', contaBancariaId) as typeof base;
      if (filters?.startDate) query = query.gte('data_movimentacao', filters.startDate) as typeof base;
      if (filters?.endDate) query = query.lte('data_movimentacao', filters.endDate) as typeof base;

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return (data ?? []) as Movimentacao[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateMovimentacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MovimentacaoInput) => {
      const { data, error } = await supabase.from('movimentacoes').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: ['promo-finance', 'dashboard'] });
      toast.success('Movimentação registrada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar movimentação: ${error.message}`);
    },
  });
}

export function useDeleteMovimentacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movimentacoes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['views'] });
      toast.success('Movimentação removida!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export interface TransferenciaInput {
  empresa_id: string;
  conta_bancaria_id: string;
  conta_destino_id: string;
  valor: number;
  descricao: string;
  data_transferencia: string;
  tipo?: string;
  observacoes?: string;
}

export function useTransferencias(empresaId?: string) {
  return useQuery({
    queryKey: ['transferencias', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('transferencias')
        .select('*')
        .order('data_transferencia', { ascending: false });

      if (empresaId) query = query.eq('empresa_id', empresaId);

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return (data ?? []) as Record<string, unknown>[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransferenciaInput) => {
      const { data, error } = await supabase
        .from('transferencias')
        .insert({ ...input, status: 'realizado' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: ['promo-finance', 'dashboard'] });
      toast.success('Transferência realizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro na transferência: ${error.message}`);
    },
  });
}

export function useCancelTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transferencias')
        .update({ status: 'cancelado', cancelado_em: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['views'] });
      toast.success('Transferência cancelada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useFormasPagamento(tipo?: 'entrada' | 'saida' | 'ambos') {
  return useQuery({
    queryKey: ['formas-pagamento', tipo],
    queryFn: async () => {
      const base = dynamicDb
        .from('formas_pagamento')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      let query: typeof base = base;
      if (tipo && tipo !== 'ambos') {
        query = query.or(`tipo.eq.${tipo},tipo.eq.ambos`) as typeof base;
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Record<string, unknown>[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function usePlanoContas() {
  return useQuery({
    queryKey: ['plano-contas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plano_contas')
        .select('*')
        .eq('ativo', true)
        .order('codigo');

      if (error) throw error;
      return (data ?? []) as Record<string, unknown>[];
    },
    staleTime: 10 * 60 * 1000,
  });
}
