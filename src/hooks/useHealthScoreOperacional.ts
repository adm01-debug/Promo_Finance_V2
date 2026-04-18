import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HealthScore {
  id: string;
  empresa_id: string | null;
  snapshot_data: string;
  score_total: number;
  score_tributario: number;
  score_financeiro: number;
  score_operacional: number;
  score_lgpd: number;
  score_cadastros: number;
  score_engajamento: number;
  tendencia_pct: number | null;
  insights_md: string | null;
}

export function useHealthScoreOperacional(empresaId?: string | null) {
  const qc = useQueryClient();

  const latest = useQuery({
    queryKey: ["health-score", empresaId],
    queryFn: async () => {
      let q = supabase
        .from("health_scores_operacionais")
        .select("*")
        .order("snapshot_data", { ascending: false })
        .limit(1);
      if (empresaId) q = q.eq("empresa_id", empresaId);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data as HealthScore | null;
    },
  });

  const recalcular = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "calcular-health-score-operacional",
        { body: empresaId ? { empresa_id: empresaId } : {} }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Health Score recalculado");
      qc.invalidateQueries({ queryKey: ["health-score"] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  return { ...latest, recalcular };
}
