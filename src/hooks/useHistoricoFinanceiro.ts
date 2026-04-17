// ============================================
// HOOK: CRUD Faturamento + Folha mensal
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FaturamentoRow {
  id: string;
  empresa_id: string;
  ano: number;
  mes: number;
  receita_bruta: number;
  receita_servicos: number;
  receita_revenda: number;
  receita_industria: number;
  receita_exportacao: number;
  observacoes?: string | null;
}

export interface FolhaRow {
  id: string;
  empresa_id: string;
  ano: number;
  mes: number;
  salarios: number;
  pro_labore: number;
  encargos: number;
  total_folha: number;
  numero_funcionarios?: number | null;
  observacoes?: string | null;
}

export function useHistoricoFinanceiro(empresaId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const faturamentoQuery = useQuery({
    queryKey: ['historico-faturamento', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('faturamento_mensal')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });
      if (error) throw error;
      return (data || []) as FaturamentoRow[];
    },
    enabled: !!empresaId,
  });

  const folhaQuery = useQuery({
    queryKey: ['historico-folha', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('folha_pagamento')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });
      if (error) throw error;
      return (data || []) as FolhaRow[];
    },
    enabled: !!empresaId,
  });

  const upsertFaturamento = useMutation({
    mutationFn: async (row: Omit<FaturamentoRow, 'id'>) => {
      const { error } = await supabase
        .from('faturamento_mensal')
        .upsert(
          { ...row, created_by: user?.id ?? null },
          { onConflict: 'empresa_id,ano,mes' },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Faturamento salvo');
      queryClient.invalidateQueries({ queryKey: ['historico-faturamento', empresaId] });
      queryClient.invalidateQueries({ queryKey: ['faturamento-mensal', empresaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upsertFolha = useMutation({
    mutationFn: async (row: Omit<FolhaRow, 'id'>) => {
      const { error } = await supabase
        .from('folha_pagamento')
        .upsert(
          { ...row, created_by: user?.id ?? null },
          { onConflict: 'empresa_id,ano,mes' },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Folha salva');
      queryClient.invalidateQueries({ queryKey: ['historico-folha', empresaId] });
      queryClient.invalidateQueries({ queryKey: ['folha-pagamento', empresaId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteFaturamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('faturamento_mensal').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Removido');
      queryClient.invalidateQueries({ queryKey: ['historico-faturamento', empresaId] });
    },
  });

  const deleteFolha = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('folha_pagamento').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Removido');
      queryClient.invalidateQueries({ queryKey: ['historico-folha', empresaId] });
    },
  });

  return {
    faturamento: faturamentoQuery.data || [],
    folha: folhaQuery.data || [],
    isLoading: faturamentoQuery.isLoading || folhaQuery.isLoading,
    upsertFaturamento,
    upsertFolha,
    deleteFaturamento,
    deleteFolha,
  };
}
