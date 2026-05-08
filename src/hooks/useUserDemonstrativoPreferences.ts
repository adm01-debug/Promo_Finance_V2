import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface UserDemonstrativoPreferences {
  id: string;
  user_id: string;
  modo_padrao: 'dre' | 'balanco';
  fonte_padrao: 'competencia' | 'caixa';
  filtros_por_empresa: Record<string, {
    mes?: number;
    ano?: number;
    contaId?: string;
  }>;
  drill_down_estado: Record<string, boolean>; // key could be a combination of context and line
}

const DEFAULT_PREFS: Omit<UserDemonstrativoPreferences, "id" | "user_id"> = {
  modo_padrao: 'dre',
  fonte_padrao: 'competencia',
  filtros_por_empresa: {},
  drill_down_estado: {},
};

export function useUserDemonstrativoPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ["user-demonstrativo-preferences", user?.id] as const;

  const query = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async (): Promise<UserDemonstrativoPreferences | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_demonstrativo_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      if (data) return data as UserDemonstrativoPreferences;

      // Create default if not exists
      const { data: created, error: insErr } = await supabase
        .from("user_demonstrativo_preferences")
        .upsert(
          { user_id: user.id, ...DEFAULT_PREFS },
          { onConflict: "user_id" }
        )
        .select("*")
        .maybeSingle();
      
      if (insErr) throw insErr;
      return (created as UserDemonstrativoPreferences) || null;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Omit<UserDemonstrativoPreferences, "id" | "user_id">>) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("user_demonstrativo_preferences")
        .upsert(
          { user_id: user.id, ...patch },
          { onConflict: "user_id" }
        )
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data as UserDemonstrativoPreferences;
    },
    onSuccess: (data) => {
      if (data) qc.setQueryData(queryKey, data);
    },
  });

  return { preferences: query.data, isLoading: query.isLoading, update };
}
