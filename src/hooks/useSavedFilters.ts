import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";
import {
  validateSharing,
  SavedFilterSharingError,
} from "@/hooks/savedFiltersValidation";

/**
 * Busca papéis ativos no tenant (empresa) consultando user_empresas.
 * É a fonte de verdade para "papéis válidos para compartilhar dentro deste tenant".
 */
async function fetchTenantRoles(empresaId: string): Promise<string[]> {
  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: unknown) => {
          eq: (k: string, v: unknown) => Promise<{ data: { role: string }[] | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("user_empresas")
    .select("role")
    .eq("empresa_id", empresaId)
    .eq("ativo", true);
  if (error) throw new Error(error.message);
  const set = new Set<string>();
  (data ?? []).forEach((r) => {
    if (r?.role) set.add(r.role);
  });
  return Array.from(set);
}

/**
 * Best-effort audit log para ações de compartilhamento de filtros salvos.
 * Falhas de auditoria nunca derrubam a operação principal.
 */
async function logSavedFilterAudit(params: {
  action: "UPDATE" | "INSERT";
  filterId: string;
  details: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}) {
  try {
    await supabase.rpc("log_audit", {
      _action: params.action,
      _table_name: "saved_filters",
      _record_id: params.filterId,
      _old_data: params.oldData ? JSON.stringify(params.oldData) : null,
      _new_data: params.newData ? JSON.stringify(params.newData) : null,
      _details: params.details,
    });
  } catch (err) {
    logger.warn("[saved-filters] audit log falhou", err);
  }
}

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
      const wantsShared = input.isShared ?? false;
      const targetEmpresa = wantsShared
        ? input.empresaId ?? currentEmpresaId ?? null
        : null;

      // Carrega papéis do tenant alvo (se houver) para validação cruzada.
      const tenantRoles =
        wantsShared && targetEmpresa
          ? await fetchTenantRoles(targetEmpresa)
          : [];

      const normalized = validateSharing({
        isShared: wantsShared,
        sharedWithRoles: input.sharedWithRoles ?? [],
        empresaId: targetEmpresa,
        tenantRoles,
      });

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
            is_shared: normalized.isShared,
            empresa_id: normalized.empresaId,
            shared_with_roles: normalized.sharedWithRoles,
          },
          { onConflict: "user_id,entity_type,name" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preset salvo");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => {
      const prefix = e instanceof SavedFilterSharingError ? "Validação" : "Erro ao salvar";
      toast.error(`${prefix}: ${e.message}`);
    },
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
      const targetEmpresa = input.isShared
        ? input.empresaId ?? currentEmpresaId ?? null
        : null;

      const tenantRoles =
        input.isShared && targetEmpresa
          ? await fetchTenantRoles(targetEmpresa)
          : [];

      const normalized = validateSharing({
        isShared: input.isShared,
        sharedWithRoles: input.sharedWithRoles,
        empresaId: targetEmpresa,
        tenantRoles,
      });

      // Captura estado anterior para auditoria
      const previous = (list.data ?? []).find((f) => f.id === input.id);
      const oldSnapshot = previous
        ? {
            is_shared: previous.is_shared,
            shared_with_roles: previous.shared_with_roles,
            empresa_id: previous.empresa_id,
          }
        : undefined;
      const newSnapshot = {
        is_shared: normalized.isShared,
        shared_with_roles: normalized.sharedWithRoles,
        empresa_id: normalized.empresaId,
      };

      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filters" as any)
        .update(newSnapshot)
        .eq("id", input.id);
      if (error) throw error;

      await logSavedFilterAudit({
        action: "UPDATE",
        filterId: input.id,
        details: `Compartilhamento atualizado para filtro "${previous?.name ?? input.id}" (entity=${entityType}); shared=${normalized.isShared}; roles=[${normalized.sharedWithRoles.join(",")}]; empresa=${normalized.empresaId ?? "—"}; user=${user?.id ?? "—"}`,
        oldData: oldSnapshot,
        newData: newSnapshot,
      });
    },
    onSuccess: () => {
      toast.success("Compartilhamento atualizado");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => {
      const prefix = e instanceof SavedFilterSharingError ? "Validação" : "Erro";
      toast.error(`${prefix}: ${e.message}`);
    },
  });

  /** Duplica um preset (próprio ou compartilhado) como cópia pessoal do usuário. */
  const duplicate = useMutation({
    mutationFn: async (input: { sourceId: string; newName?: string }) => {
      const source = (list.data ?? []).find((f) => f.id === input.sourceId);
      const { data, error } = await supabase.rpc("duplicate_saved_filter", {
        _source_id: input.sourceId,
        _new_name: input.newName ?? "",
      });
      if (error) throw error;
      const newId = data as string;

      await logSavedFilterAudit({
        action: "INSERT",
        filterId: newId,
        details: `Filtro duplicado a partir de "${source?.name ?? input.sourceId}" (entity=${entityType}); origem_user=${source?.user_id ?? "—"}; origem_empresa=${source?.empresa_id ?? "—"}; origem_roles=[${(source?.shared_with_roles ?? []).join(",")}]; novo_user=${user?.id ?? "—"}; novo_nome=${input.newName ?? `${source?.name ?? ""} (cópia)`}`,
        oldData: source
          ? {
              source_id: source.id,
              source_user_id: source.user_id,
              source_empresa_id: source.empresa_id,
              source_shared_with_roles: source.shared_with_roles,
            }
          : undefined,
        newData: { new_filter_id: newId, owner_user_id: user?.id },
      });

      return newId;
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
