import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useComplianceKpis() {
  return useQuery({
    queryKey: ["compliance-kpis"],
    queryFn: async () => {
      const ontem = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [eventos24h, criticasPend, scoreMedio, pacotesMes] = await Promise.all([
        supabase.from("audit_logs").select("id", { count: "exact", head: true }).gte("created_at", ontem),
        supabase
          .from("audit_logs")
          .select("id", { count: "exact", head: true })
          .in("action", ["DELETE", "REJECT"])
          .gte("created_at", ontem),
        supabase.from("verificacoes_conformidade").select("score").order("created_at", { ascending: false }).limit(20),
        supabase
          .from("evidencias_pacotes")
          .select("id", { count: "exact", head: true })
          .gte("created_at", inicioMes),
      ]);

      const scores = (scoreMedio.data ?? []).map((r) => r.score ?? 0);
      const scoreAvg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      return {
        eventos24h: eventos24h.count ?? 0,
        acoesCriticasPendentes: criticasPend.count ?? 0,
        scoreConformidadeMedio: scoreAvg,
        pacotesGeradosMes: pacotesMes.count ?? 0,
      };
    },
    refetchInterval: 60_000,
  });
}
