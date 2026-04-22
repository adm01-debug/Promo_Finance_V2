import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export interface SavedFilterSubscription {
  id: string;
  user_id: string;
  saved_filter_id: string;
  notify_inapp: boolean;
  notify_push: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Gerencia as assinaturas do usuário em filtros salvos.
 * Cada assinatura define quais canais (in-app / push) recebem notificação
 * quando novos registros entram no filtro em tempo real.
 */
export function useSavedFilterSubscriptions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const queryKey = ["saved-filter-subscriptions", user?.id];

  const list = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filter_subscriptions" as any)
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as SavedFilterSubscription[];
    },
  });

  const subscribe = useMutation({
    mutationFn: async (input: {
      savedFilterId: string;
      notifyInapp?: boolean;
      notifyPush?: boolean;
    }) => {
      if (!user) throw new Error("Sessão expirada");
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filter_subscriptions" as any)
        .upsert(
          {
            user_id: user.id,
            saved_filter_id: input.savedFilterId,
            notify_inapp: input.notifyInapp ?? true,
            notify_push: input.notifyPush ?? false,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "user_id,saved_filter_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assinatura ativada");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro ao assinar: ${e.message}`),
  });

  const updateChannels = useMutation({
    mutationFn: async (input: {
      id: string;
      notifyInapp: boolean;
      notifyPush: boolean;
    }) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filter_subscriptions" as any)
        .update({
          notify_inapp: input.notifyInapp,
          notify_push: input.notifyPush,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const unsubscribe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filter_subscriptions" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assinatura removida");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  /** Marca o "visto até agora" para evitar notificar registros antigos. */
  const markSeen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filter_subscriptions" as any)
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const subscriptions = list.data ?? [];
  const byFilterId = new Map(subscriptions.map((s) => [s.saved_filter_id, s]));

  return {
    subscriptions,
    byFilterId,
    isLoading: list.isLoading,
    subscribe,
    updateChannels,
    unsubscribe,
    markSeen,
  };
}
