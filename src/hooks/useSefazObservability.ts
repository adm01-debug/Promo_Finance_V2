import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface SefazObservabilityRow {
  cnpj: string;
  ambiente: string;
  ultimo_nsu: number | null;
  max_nsu: number | null;
  ultima_consulta: string | null;
  ultimo_status: string | null;
  circuit_open: boolean;
  retry_count: number;
  next_run_at: string | null;
  seconds_since_last: number | null;
  nfe_24h: number;
  nfe_7d: number;
  open_alerts: number;
}

export interface SefazIntegrityAlert {
  id: string;
  invariant: string;
  severity: string;
  reason: string;
  affected_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  resolved_at: string | null;
}

export function useSefazObservability() {
  return useQuery({
    queryKey: ['sefaz-observability'],
    queryFn: async (): Promise<SefazObservabilityRow[]> => {
      const { data, error } = await supabase
        .from('v_sefaz_observability' as never)
        .select('*')
        .order('seconds_since_last', { ascending: false, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as unknown as SefazObservabilityRow[];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useSefazAlerts() {
  return useQuery({
    queryKey: ['sefaz-integrity-alerts'],
    queryFn: async (): Promise<SefazIntegrityAlert[]> => {
      const { data, error } = await supabase
        .from('integrity_alerts')
        .select('id, invariant, severity, reason, affected_count, metadata, created_at, resolved_at')
        .eq('domain', 'nfe_sefaz')
        .is('resolved_at', null)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as SefazIntegrityAlert[];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
