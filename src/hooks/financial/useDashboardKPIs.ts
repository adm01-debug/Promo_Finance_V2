import { useQuery } from '@tanstack/react-query';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import { STALE_TIMES } from '@/lib/queryClient';

export function useDashboardKPIs(empresaId?: string) {
  return useQuery({
    queryKey: ['dashboard-kpis', empresaId],
    queryFn: async () => {
      const boletos = await supabaseDyn
        .from('boletos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING')
        .eq('empresa_id', empresaId ?? '');

      const divergencias = await supabaseDyn
        .from('divergencias_conciliacao')
        .select('*', { count: 'exact', head: true })
        .eq('resolvido', false)
        .eq('empresa_id', empresaId ?? '');

      return {
        boletosAbertos: boletos.count || 0,
        divergenciasPendentes: divergencias.count || 0,
      };
    },
    staleTime: STALE_TIMES.financial,
    enabled: !!empresaId,
  });
}
