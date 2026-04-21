import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Severidade = "baixa" | "media" | "alta" | "critica";

export interface AnomaliaPreferences {
  id: string;
  user_id: string;
  toast_enabled: boolean;
  toast_min_severidade: Severidade;
  silenciar_ate: string | null;
  centros_custo_silenciados: string[];
  tipos_silenciados: string[];
}

const SEV_RANK: Record<Severidade, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

const DEFAULT_PREFS: Omit<AnomaliaPreferences, "id" | "user_id"> = {
  toast_enabled: true,
  toast_min_severidade: "critica",
  silenciar_ate: null,
  centros_custo_silenciados: [],
  tipos_silenciados: [],
};

export function shouldNotify(
  prefs: AnomaliaPreferences | null | undefined,
  anomalia: {
    severidade?: string | null;
    centro_custo_id?: string | null;
    tipo_anomalia?: string | null;
  },
): boolean {
  if (!prefs) return true;
  if (!prefs.toast_enabled) return false;
  if (prefs.silenciar_ate && new Date(prefs.silenciar_ate) > new Date())
    return false;

  const sev = (anomalia.severidade ?? "baixa") as Severidade;
  if (SEV_RANK[sev] > SEV_RANK[prefs.toast_min_severidade]) return false;

  if (
    anomalia.centro_custo_id &&
    prefs.centros_custo_silenciados.includes(anomalia.centro_custo_id)
  )
    return false;

  if (
    anomalia.tipo_anomalia &&
    prefs.tipos_silenciados.includes(anomalia.tipo_anomalia)
  )
    return false;

  return true;
}

export function useAnomaliaPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["anomalia-preferences", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<AnomaliaPreferences | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_anomalia_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as unknown as AnomaliaPreferences;

      const { data: created, error: insErr } = await supabase
        .from("user_anomalia_preferences")
        .insert({ user_id: user.id, ...DEFAULT_PREFS })
        .select("*")
        .maybeSingle();
      if (insErr) throw insErr;
      return (created as unknown as AnomaliaPreferences) ?? null;
    },
  });

  const update = useMutation({
    mutationFn: async (
      patch: Partial<Omit<AnomaliaPreferences, "id" | "user_id">>,
    ) => {
      if (!user?.id) throw new Error("not authenticated");
      const { data, error } = await supabase
        .from("user_anomalia_preferences")
        .upsert(
          { user_id: user.id, ...DEFAULT_PREFS, ...query.data, ...patch },
          { onConflict: "user_id" },
        )
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AnomaliaPreferences;
    },
    onSuccess: (data) => {
      qc.setQueryData(["anomalia-preferences", user?.id], data);
    },
  });

  return { preferences: query.data ?? null, isLoading: query.isLoading, update };
}
