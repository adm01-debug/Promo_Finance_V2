import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_TIMES } from '@/lib/queryClient';

// ============================================
// EXTRATO BANCÁRIO (importação OFX/CSV)
// ============================================
export function useExtratoBancario(contaBancariaId?: string) {
  return useQuery({
    queryKey: ['extrato-bancario', contaBancariaId],
    queryFn: async () => {
      let query = supabase.from('extrato_bancario').select('*').order('data', { ascending: false }).limit(500);
      if (contaBancariaId) query = query.eq('conta_bancaria_id', contaBancariaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// ============================================
// SESSÕES DE CONCILIAÇÃO
// ============================================
export function useConciliacoes(empresaId?: string) {
  return useQuery({
    queryKey: ['conciliacoes', empresaId],
    queryFn: async () => {
      let query = supabase.from('conciliacoes').select('*').order('created_at', { ascending: false });
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIMES.financial,
  });
}

// ============================================
// WEBHOOKS LOG (Asaas)
// ============================================
export function useWebhooksLog() {
  return useQuery({
    queryKey: ['webhooks-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhooks_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });
}

// ============================================
// VIEW vw_webhooks_recentes
// ============================================
export function useWebhooksRecentes() {
  return useQuery({
    queryKey: ['views', 'webhooks-recentes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vw_webhooks_recentes').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: STALE_TIMES.realtime,
  });
}

// ============================================
// HISTÓRICO ANÁLISES PREDITIVAS
// ============================================
export function useHistoricoAnalisesPreditivas() {
  return useQuery({
    queryKey: ['historico-analises-preditivas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_analises_preditivas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}
