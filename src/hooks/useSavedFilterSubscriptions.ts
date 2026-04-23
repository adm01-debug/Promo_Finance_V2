import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

/** Cadência de entrega das notificações para uma assinatura. */
export type SubscriptionFrequencia = "imediata" | "horaria" | "diaria";

/** Severidades padronizadas reutilizadas pelos pickers de UI/validação. */
export type SeveridadeAlerta = "baixa" | "media" | "alta" | "critica";
export const SEVERIDADES_DISPONIVEIS: readonly SeveridadeAlerta[] = [
  "baixa",
  "media",
  "alta",
  "critica",
] as const;

export interface SavedFilterSubscription {
  id: string;
  user_id: string;
  saved_filter_id: string;
  notify_inapp: boolean;
  notify_push: boolean;
  /** Se true, dispara também e-mail via edge function `notify-saved-filter`. */
  notify_email: boolean;
  /** Cadência de entrega: imediata, agrupada por hora ou única vez por dia. */
  frequencia: SubscriptionFrequencia;
  /** Horário preferido (HH:MM:SS, timezone do usuário) para a cadência diária. */
  horario_preferido: string;
  /**
   * Severidades que o usuário considera críticas para esta assinatura.
   * Eleva a prioridade do push e o uso de toast.error. Default: ['critica'].
   */
  severidades_criticas: SeveridadeAlerta[];
  /**
   * Lista de tipos de evento (ex.: tipo_anomalia) que disparam alerta.
   * Vazio = todos os tipos disparam (compatibilidade retroativa).
   */
  tipos_eventos_ativos: string[];
  /**
   * Anti-spam — limite máximo de notificações individuais entregues numa
   * janela deslizante. Ao exceder, o restante é agrupado num único batch.
   * Aplicado apenas para frequência "imediata" (cadências horária/diária
   * já agrupam por natureza).
   */
  rate_limit_max: number;
  /** Tamanho da janela em minutos para o contador de rate limit. */
  rate_limit_window_min: number;
  /** Próxima janela de despacho — usada pelo cliente para agrupar pendentes. */
  next_dispatch_at: string | null;
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

  /**
   * Defesa de permissão em tempo real: o trigger
   * `fn_revoke_orphan_saved_filter_subscriptions` apaga assinaturas órfãs no
   * banco quando um filtro perde acesso (UPDATE em saved_filters/user_empresas)
   * ou é DELETE'd. Aqui escutamos esses eventos para invalidar a query local
   * imediatamente — assim o `useSavedFilterAlerts` para de processar o filtro
   * sem precisar de refresh manual.
   */
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`saved-filter-permissions-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saved_filters" },
        () => {
          qc.invalidateQueries({ queryKey });
          qc.invalidateQueries({ queryKey: ["saved-filters"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "saved_filter_subscriptions" },
        () => {
          qc.invalidateQueries({ queryKey });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // queryKey é derivado de user.id (estável dentro do mesmo user); evitamos
    // recriar canal a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, qc]);

  const subscribe = useMutation({
    mutationFn: async (input: {
      savedFilterId: string;
      notifyInapp?: boolean;
      notifyPush?: boolean;
      notifyEmail?: boolean;
      frequencia?: SubscriptionFrequencia;
      horarioPreferido?: string;
      severidadesCriticas?: SeveridadeAlerta[];
      tiposEventosAtivos?: string[];
      rateLimitMax?: number;
      rateLimitWindowMin?: number;
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
            notify_email: input.notifyEmail ?? false,
            frequencia: input.frequencia ?? "imediata",
            horario_preferido: input.horarioPreferido ?? "09:00:00",
            severidades_criticas: input.severidadesCriticas ?? ["critica"],
            tipos_eventos_ativos: input.tiposEventosAtivos ?? [],
            rate_limit_max: input.rateLimitMax ?? 5,
            rate_limit_window_min: input.rateLimitWindowMin ?? 10,
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

  /**
   * Atualiza canais e/ou cadência. Todos os campos são opcionais para permitir
   * patches focados (ex.: alternar push sem mexer na frequência salva).
   */
  const updateChannels = useMutation({
    mutationFn: async (input: {
      id: string;
      notifyInapp?: boolean;
      notifyPush?: boolean;
      notifyEmail?: boolean;
      frequencia?: SubscriptionFrequencia;
      horarioPreferido?: string;
      severidadesCriticas?: SeveridadeAlerta[];
      tiposEventosAtivos?: string[];
      rateLimitMax?: number;
      rateLimitWindowMin?: number;
    }) => {
      const patch: Record<string, unknown> = {};
      if (input.notifyInapp !== undefined) patch.notify_inapp = input.notifyInapp;
      if (input.notifyPush !== undefined) patch.notify_push = input.notifyPush;
      if (input.notifyEmail !== undefined) patch.notify_email = input.notifyEmail;
      if (input.frequencia !== undefined) patch.frequencia = input.frequencia;
      if (input.horarioPreferido !== undefined)
        patch.horario_preferido = input.horarioPreferido;
      if (input.severidadesCriticas !== undefined)
        patch.severidades_criticas = input.severidadesCriticas;
      if (input.tiposEventosAtivos !== undefined)
        patch.tipos_eventos_ativos = input.tiposEventosAtivos;
      if (input.rateLimitMax !== undefined)
        patch.rate_limit_max = input.rateLimitMax;
      if (input.rateLimitWindowMin !== undefined)
        patch.rate_limit_window_min = input.rateLimitWindowMin;
      // Reset do agendamento sempre que a cadência muda — o hook de alertas
      // recalcula o próximo despacho com base nas novas regras.
      if (input.frequencia !== undefined || input.horarioPreferido !== undefined) {
        patch.next_dispatch_at = null;
      }
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("saved_filter_subscriptions" as any)
        .update(patch)
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
