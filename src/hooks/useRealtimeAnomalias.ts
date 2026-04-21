import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  ANOMALIA_DRAWER_EVENT,
  dispatchOpenAnomaliaDrawer,
} from "@/lib/anomalia-routes";
import {
  useAnomaliaPreferences,
  shouldNotify,
} from "@/hooks/useAnomaliaPreferences";

const TIPO_LABEL: Record<string, string> = {
  movimentacao_outlier: "Movimentação atípica",
  pagamento_duplicado: "Pagamento duplicado",
  conta_pagar_alta: "Conta a pagar alta",
  conciliacao_atrasada: "Conciliação atrasada",
  mudanca_regime_brusca: "Variação brusca de regime",
};

/**
 * Subscribes to realtime INSERT events on anomalias_detectadas.
 * Only critical/high severity anomalies trigger user-facing toasts.
 * The toast offers a quick "Drill-down" (in-app drawer) and "Open page" action.
 */
export function useRealtimeAnomalias() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { preferences } = useAnomaliaPreferences();
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("anomalias-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "anomalias_detectadas" },
        (payload) => {
          const a = payload.new as {
            id: string;
            severidade?: string;
            tipo_anomalia?: string;
            descricao?: string;
            centro_custo_id?: string | null;
          };

          if (!a?.id || seenIds.current.has(a.id)) return;
          seenIds.current.add(a.id);

          queryClient.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
          queryClient.invalidateQueries({
            queryKey: ["anomalias-detectadas", "pending-queue"],
          });
          queryClient.invalidateQueries({
            queryKey: ["anomalias-criticas-count"],
          });

          if (!shouldNotify(prefsRef.current, a)) return;

          const isCritical = a.severidade === "critica";
          const tipoLabel = TIPO_LABEL[a.tipo_anomalia ?? ""] ?? "Nova anomalia";
          const titulo = `${isCritical ? "🚨 Crítica" : "⚠️ Alta"} — ${tipoLabel}`;
          const fn = isCritical ? toast.error : toast.warning;

          fn(titulo, {
            description: a.descricao,
            duration: 12000,
            action: {
              label: "Drill-down",
              onClick: () => dispatchOpenAnomaliaDrawer(a.id),
            },
            cancel: {
              label: "Abrir página",
              onClick: () =>
                window.location.assign(`/admin/insights-ia/anomalia/${a.id}`),
            },
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);
}

export { ANOMALIA_DRAWER_EVENT };
