import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Severidade = "baixa" | "media" | "alta" | "critica";

export type ToastAcaoKey =
  | "drill_down"
  | "abrir_pagina"
  | "copiar_id"
  | "marcar_lida";

export type DrawerAcaoKey =
  | "abrir_entidade"
  | "pagina_completa"
  | "copiar_id"
  | "marcar_lida";

export type ToastAcoes = Record<ToastAcaoKey, boolean>;
export type DrawerAcoes = Record<DrawerAcaoKey, boolean>;

export interface AnomaliaPreferences {
  id: string;
  user_id: string;
  toast_enabled: boolean;
  /** @deprecated mantido por compat — a fonte da verdade agora é toast_severidades_ativas */
  toast_min_severidade: Severidade;
  toast_severidades_ativas: Severidade[];
  toast_duracao_segundos: number;
  toast_acoes: ToastAcoes;
  drawer_acoes: DrawerAcoes;
  silenciar_ate: string | null;
  centros_custo_silenciados: string[];
  tipos_silenciados: string[];
}

const DEFAULT_TOAST_ACOES: ToastAcoes = {
  drill_down: true,
  abrir_pagina: true,
  copiar_id: false,
  marcar_lida: false,
};

const DEFAULT_DRAWER_ACOES: DrawerAcoes = {
  abrir_entidade: true,
  pagina_completa: true,
  copiar_id: false,
  marcar_lida: false,
};

export const TOAST_DURACAO_MIN = 3;
export const TOAST_DURACAO_MAX = 30;
export const TOAST_DURACAO_DEFAULT = 12;

const DEFAULT_PREFS: Omit<AnomaliaPreferences, "id" | "user_id"> = {
  toast_enabled: true,
  toast_min_severidade: "critica",
  toast_severidades_ativas: ["critica", "alta"],
  toast_duracao_segundos: TOAST_DURACAO_DEFAULT,
  toast_acoes: DEFAULT_TOAST_ACOES,
  drawer_acoes: DEFAULT_DRAWER_ACOES,
  silenciar_ate: null,
  centros_custo_silenciados: [],
  tipos_silenciados: [],
};

/** Normaliza um registro do banco preenchendo defaults para colunas novas/legadas. */
function normalizePrefs(raw: unknown): AnomaliaPreferences {
  const r = (raw ?? {}) as Partial<AnomaliaPreferences>;
  return {
    id: r.id as string,
    user_id: r.user_id as string,
    toast_enabled: r.toast_enabled ?? DEFAULT_PREFS.toast_enabled,
    toast_min_severidade:
      r.toast_min_severidade ?? DEFAULT_PREFS.toast_min_severidade,
    toast_severidades_ativas:
      r.toast_severidades_ativas && r.toast_severidades_ativas.length > 0
        ? r.toast_severidades_ativas
        : DEFAULT_PREFS.toast_severidades_ativas,
    toast_duracao_segundos:
      r.toast_duracao_segundos ?? DEFAULT_PREFS.toast_duracao_segundos,
    toast_acoes: { ...DEFAULT_TOAST_ACOES, ...(r.toast_acoes ?? {}) },
    drawer_acoes: { ...DEFAULT_DRAWER_ACOES, ...(r.drawer_acoes ?? {}) },
    silenciar_ate: r.silenciar_ate ?? null,
    centros_custo_silenciados: r.centros_custo_silenciados ?? [],
    tipos_silenciados: r.tipos_silenciados ?? [],
  };
}

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

  // Lista explícita de severidades ativas é a fonte da verdade
  if (
    prefs.toast_severidades_ativas &&
    prefs.toast_severidades_ativas.length > 0 &&
    !prefs.toast_severidades_ativas.includes(sev)
  ) {
    return false;
  }

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
  const queryKey = ["anomalia-preferences", user?.id] as const;

  const query = useQuery({
    queryKey,
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
      if (data) return normalizePrefs(data);

      // Upsert defensivo: evita corrida com outra aba criando a mesma linha
      const { data: created, error: insErr } = await supabase
        .from("user_anomalia_preferences")
        .upsert(
          { user_id: user.id, ...DEFAULT_PREFS },
          { onConflict: "user_id" },
        )
        .select("*")
        .maybeSingle();
      if (insErr) throw insErr;
      return created ? normalizePrefs(created) : null;
    },
  });

  // Realtime cross-device: qualquer mudança nas prefs deste usuário
  // (em outra aba, outro dispositivo, ou via SQL) atualiza o cache local
  // imediatamente — mantém o useRealtimeAnomalias consistente sem F5.
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`user-anomalia-preferences:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_anomalia_preferences",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            qc.setQueryData(queryKey, null);
            return;
          }
          const next = normalizePrefs(payload.new);
          qc.setQueryData(queryKey, next);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  const update = useMutation({
    mutationFn: async (
      patch: Partial<Omit<AnomaliaPreferences, "id" | "user_id">>,
    ) => {
      if (!user?.id) throw new Error("not authenticated");
      // Re-lê o estado mais recente do servidor antes de mesclar, evitando
      // sobrescrever mudanças vindas de outro dispositivo desde o último fetch.
      const { data: latest, error: readErr } = await supabase
        .from("user_anomalia_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (readErr) throw readErr;

      const base = latest ? normalizePrefs(latest) : null;
      const merged = {
        ...DEFAULT_PREFS,
        ...(base ?? {}),
        ...patch,
      };
      // Remove campos auto-gerenciados antes do upsert
      const { id: _id, user_id: _uid, ...payload } = merged as AnomaliaPreferences;
      void _id;
      void _uid;

      const { data, error } = await supabase
        .from("user_anomalia_preferences")
        .upsert(
          { user_id: user.id, ...payload },
          { onConflict: "user_id" },
        )
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data ? normalizePrefs(data) : null;
    },
    onSuccess: (data) => {
      if (data) qc.setQueryData(queryKey, data);
    },
  });

  return { preferences: query.data ?? null, isLoading: query.isLoading, update };
}
