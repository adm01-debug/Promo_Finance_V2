import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useAnomaliaPreferences,
  shouldNotify,
} from "@/hooks/useAnomaliaPreferences";

/**
 * Contagem de anomalias críticas/altas em aberto (nova/investigando),
 * já respeitando os silêncios por centro de custo e tipo do usuário.
 */
export function useAnomaliasCriticasCount() {
  const { preferences } = useAnomaliaPreferences();

  return useQuery({
    queryKey: [
      "anomalias-criticas-count",
      preferences?.centros_custo_silenciados,
      preferences?.tipos_silenciados,
    ],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anomalias_detectadas")
        .select("id, severidade, centro_custo_id, tipo_anomalia, status")
        .in("severidade", ["critica", "alta"])
        .in("status", ["nova", "investigando"])
        .limit(500);
      if (error) throw error;
      const rows = (data ?? []) as Array<{
        severidade: string;
        centro_custo_id: string | null;
        tipo_anomalia: string;
      }>;
      return rows.filter((r) =>
        shouldNotify(
          preferences
            ? { ...preferences, toast_enabled: true, silenciar_ate: null }
            : null,
          r,
        ),
      ).length;
    },
  });
}
