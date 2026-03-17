import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_TIMES } from '@/lib/queryClient';

// ============================================
// Hook para vw_saldos_contas
// ============================================
export function useSaldosContas(empresaId?: string) {
  return useQuery({
    queryKey: ['views', 'saldos-contas', empresaId],
    queryFn: async () => {
      let query = supabase.from('vw_saldos_contas').select('*');
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIMES.dashboard,
  });
}

// ============================================
// Hook para vw_dre_mensal
// ============================================
export function useDREMensal(empresaId?: string) {
  return useQuery({
    queryKey: ['views', 'dre-mensal', empresaId],
    queryFn: async () => {
      let query = supabase.from('vw_dre_mensal').select('*').order('mes', { ascending: true });
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIMES.financial,
  });
}

// ============================================
// Hook para vw_fluxo_caixa (projeção por título)
// ============================================
export function useFluxoCaixaView() {
  return useQuery({
    queryKey: ['views', 'fluxo-caixa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_fluxo_caixa')
        .select('*')
        .order('dia', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIMES.dashboard,
  });
}

// ============================================
// Hook para vw_fluxo_caixa_diario (movimentações reais)
// ============================================
export function useFluxoCaixaDiario(empresaId?: string) {
  return useQuery({
    queryKey: ['views', 'fluxo-caixa-diario', empresaId],
    queryFn: async () => {
      let query = supabase.from('vw_fluxo_caixa_diario').select('*').order('dia', { ascending: true });
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIMES.dashboard,
  });
}

// ============================================
// Hook para vw_dso_aging (aging de recebíveis)
// ============================================
export function useDSOAging(empresaId?: string) {
  return useQuery({
    queryKey: ['views', 'dso-aging', empresaId],
    queryFn: async () => {
      let query = supabase.from('vw_dso_aging').select('*');
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data?.[0] || null;
    },
    staleTime: STALE_TIMES.financial,
  });
}

// ============================================
// Hook para vw_gastos_centro_custo
// ============================================
export function useGastosCentroCusto() {
  return useQuery({
    queryKey: ['views', 'gastos-centro-custo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_gastos_centro_custo')
        .select('*')
        .order('total_gasto', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIMES.financial,
  });
}

// ============================================
// Hook para vw_metricas_cobranca
// ============================================
export function useMetricasCobranca(empresaId?: string) {
  return useQuery({
    queryKey: ['views', 'metricas-cobranca', empresaId],
    queryFn: async () => {
      let query = supabase.from('vw_metricas_cobranca').select('*');
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIMES.financial,
  });
}

// ============================================
// Hook para vw_transferencias_painel
// ============================================
export function useTransferenciasPainel() {
  return useQuery({
    queryKey: ['views', 'transferencias-painel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_transferencias_painel')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIMES.financial,
  });
}
