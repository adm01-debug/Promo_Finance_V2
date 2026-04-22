import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "financeiro" | "operacional" | "visualizador";

export interface SavedFilterPayload<T = unknown> {
  v: 1;
  filters: T;
  sort?: { key: string; dir: "asc" | "desc" };
  columns?: string[];
}

export interface SavedFilterRow<T = unknown> {
  id: string;
  user_id: string;
  created_by: string | null;
  entity_type: string;
  name: string;
  filters: SavedFilterPayload<T>;
  is_default: boolean;
  is_shared: boolean;
  empresa_id: string | null;
  shared_with_roles: AppRole[];
  created_at: string;
  updated_at: string;
}

/**
 * Generic hook for user-specific saved filter presets.
 * Supports per-user defaults plus optional sharing with roles within an empresa.
 */
export function useSavedFilters<T = unknown>(entityType: string) {
  const qc = useQueryClient();
  const { user, currentEmpresaId } = useAuth();
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
        .order("is_shared", { ascending: true })
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
      isShared?: boolean;
      sharedWithRoles?: AppRole[];
      empresaId?: string | null;
    }) => {
      if (!user) throw new Error("Sessão expirada");
      const empresaId =
        input.isShared
          ? input.empresaId ?? currentEmpresaId ?? null
          : null;
      if (input.isShared && !empresaId) {
        throw new Error(
          "Selecione uma empresa atual para compartilhar o filtro",
        );
      }
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filters" as any)
        .upsert(
          {
            user_id: user.id,
            created_by: user.id,
            entity_type: entityType,
            name: input.name,
            filters: input.payload,
            is_default: input.isDefault ?? false,
            is_shared: input.isShared ?? false,
            empresa_id: empresaId,
            shared_with_roles: input.sharedWithRoles ?? [],
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

  /** Atualiza atributos de compartilhamento de um preset existente. */
  const updateSharing = useMutation({
    mutationFn: async (input: {
      id: string;
      isShared: boolean;
      sharedWithRoles: AppRole[];
      empresaId?: string | null;
    }) => {
      const empresaId = input.isShared
        ? input.empresaId ?? currentEmpresaId ?? null
        : null;
      if (input.isShared && !empresaId) {
        throw new Error("Selecione uma empresa atual para compartilhar");
      }
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filters" as any)
        .update({
          is_shared: input.isShared,
          shared_with_roles: input.sharedWithRoles,
          empresa_id: empresaId,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Compartilhamento atualizado");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  /** Duplica um preset (próprio ou compartilhado) como cópia pessoal do usuário. */
  const duplicate = useMutation({
    mutationFn: async (input: { sourceId: string; newName?: string }) => {
      const { data, error } = await supabase.rpc("duplicate_saved_filter", {
        _source_id: input.sourceId,
        _new_name: input.newName ?? "",
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      toast.success("Filtro duplicado para sua biblioteca");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro ao duplicar: ${e.message}`),
  });

  const filters = list.data ?? [];
  const defaultFilter =
    filters.find((f) => f.is_default && f.user_id === user?.id) ??
    filters.find((f) => f.is_default) ??
    null;

  return {
    filters,
    defaultFilter,
    isLoading: list.isLoading,
    save,
    remove,
    setDefault,
    updateSharing,
    duplicate,
  };
}
