// ============================================
// HOOK: contagem de alertas tributários não lidos
// ============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TIPOS_TRIBUTARIOS = [
  'sublimite_simples',
  'fator_r_baixo',
  'vencimento_darf',
  'desvio_benchmark',
  'irpfm_2026',
  'tributario',
] as const;

export function useAlertasTributariosCount() {
  return useQuery({
    queryKey: ['alertas-tributarios-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('alertas')
        .select('*', { count: 'exact', head: true })
        .in('tipo', TIPOS_TRIBUTARIOS as unknown as string[])
        .eq('lido', false);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
