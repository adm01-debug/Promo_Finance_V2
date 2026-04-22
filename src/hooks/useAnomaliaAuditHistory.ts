import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnomaliaAuditEntry {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  details: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

/**
 * Histórico completo de mudanças de uma anomalia (audit_logs filtrado por
 * table_name='anomalias_detectadas' e record_id=id), ordenado da mais
 * recente para a mais antiga.
 */
export function useAnomaliaAuditHistory(anomaliaId: string | undefined) {
  return useQuery({
    queryKey: ["anomalia-audit-history", anomaliaId],
    enabled: !!anomaliaId,
    staleTime: 30_000,
    queryFn: async (): Promise<AnomaliaAuditEntry[]> => {
      if (!anomaliaId) return [];
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, created_at, user_id, user_email, action, details, old_data, new_data")
        .eq("table_name", "anomalias_detectadas")
        .eq("record_id", anomaliaId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as AnomaliaAuditEntry[];
    },
  });
}
