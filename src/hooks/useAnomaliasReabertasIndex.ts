import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReaberturaInfo {
  ultima_reabertura: string;
  total_reaberturas: number;
}

/**
 * Index of anomalies that have been reopened at least once.
 * Reads `audit_logs` filtered by `table_name='anomalias_detectadas'` and
 * `details` starting with `REOPEN:` or `REOPEN_BATCH`. Builds a map
 * keyed by anomalia id with the most recent reopen timestamp and the
 * total number of reopens.
 *
 * For batch reopens (`REOPEN_BATCH`) the same audit row references several
 * anomalia ids joined by comma in `record_id`, so each id is exploded.
 */
export function useAnomaliasReabertasIndex() {
  return useQuery({
    queryKey: ["anomalias-reabertas-index"],
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<Map<string, ReaberturaInfo>> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("record_id, created_at, details")
        .eq("table_name", "anomalias_detectadas")
        .or("details.ilike.REOPEN:%,details.ilike.REOPEN_BATCH%")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;

      const map = new Map<string, ReaberturaInfo>();
      for (const row of data ?? []) {
        if (!row.record_id) continue;
        const ids = row.record_id.split(",").map((s) => s.trim()).filter(Boolean);
        for (const id of ids) {
          const prev = map.get(id);
          if (!prev) {
            map.set(id, {
              ultima_reabertura: row.created_at,
              total_reaberturas: 1,
            });
          } else {
            prev.total_reaberturas += 1;
            // created_at is sorted desc, so the first hit wins
          }
        }
      }
      return map;
    },
  });
}
