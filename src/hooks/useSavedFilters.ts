import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export interface SavedFilterPayload<T = unknown> {
  v: 1;
  filters: T;
  sort?: { key: string; dir: "asc" | "desc" };
  columns?: string[];
}

export interface SavedFilterRow<T = unknown> {
  id: string;
  user_id: string;
  entity_type: string;
  name: string;
  filters: SavedFilterPayload<T>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Generic hook for user-specific saved filter presets.
 * Each preset stores filters + sort + visible columns under a JSONB payload.
 */
export function useSavedFilters<T = unknown>(entityType: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const queryKey = ["saved-filters", entityType, user?.id];

  const list = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filters" as any)
        .select("*")
        .eq("entity_type", entityType)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as SavedFilterRow<T>[];
    },
  });

  const save = useMutation({
    mutationFn: async (input: {
      name: string;
      payload: SavedFilterPayload<T>;
      isDefault?: boolean;
    }) => {
      if (!user) throw new Error("Sessão expirada");
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filters" as any)
        .upsert(
          {
            user_id: user.id,
            entity_type: entityType,
            name: input.name,
            filters: input.payload,
            is_default: input.isDefault ?? false,
          },
          { onConflict: "user_id,entity_type,name" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preset salvo");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro ao salvar: ${e.message}`),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filters" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preset removido");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro ao remover: ${e.message}`),
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filters" as any)
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const filters = list.data ?? [];
  const defaultFilter = filters.find((f) => f.is_default) ?? null;

  return {
    filters,
    defaultFilter,
    isLoading: list.isLoading,
    save,
    remove,
    setDefault,
  };
}
