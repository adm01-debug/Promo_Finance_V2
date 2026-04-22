import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSavedFilters, type SavedFilterPayload } from "@/hooks/useSavedFilters";
import { useSavedFilterSubscriptions } from "@/hooks/useSavedFilterSubscriptions";
import { dispatchOpenAnomaliaDrawer } from "@/lib/anomalia-routes";
import { logger } from "@/lib/logger";

interface AnomaliaRow {
  id: string;
  severidade: "critica" | "alta" | "media" | "baixa";
  tipo_anomalia: string;
  descricao: string;
  detectada_em: string;
  status: string;
  centro_custo_id: string | null;
}

interface AnomaliaFilters {
  status?: string;
  severidades?: AnomaliaRow["severidade"][];
  tipos?: string[];
  periodoInicio?: string;
  periodoFim?: string;
}

/**
 * Aplica os filtros salvos (do tipo Anomalias) a um registro recém-chegado
 * via Realtime. Mantemos a lógica simples e idêntica ao painel.
 */
function matchesAnomaliaFilters(
  row: AnomaliaRow,
  payload: SavedFilterPayload<AnomaliaFilters>,
): boolean {
  const f = payload.filters ?? {};
  if (f.status && f.status !== "todas" && row.status !== f.status) return false;
  if (f.severidades?.length && !f.severidades.includes(row.severidade))
    return false;
  if (f.tipos?.length && !f.tipos.includes(row.tipo_anomalia)) return false;
  const ts = new Date(row.detectada_em).getTime();
  if (f.periodoInicio && ts < new Date(f.periodoInicio).getTime()) return false;
  if (f.periodoFim && ts > new Date(f.periodoFim).getTime() + 86_400_000)
    return false;
  return true;
}

/**
 * Escuta INSERTs em anomalias_detectadas e, para cada filtro salvo (entity_type
 * "anomalias_detectadas") que o usuário assinou, dispara toast in-app e/ou
 * push do navegador conforme os canais escolhidos.
 *
 * Frequência: tempo real (cada novo registro que casa com o filtro notifica).
 */
export function useSavedFilterAlerts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { filters: savedFilters } = useSavedFilters<AnomaliaFilters>(
    "anomalias_detectadas",
  );
  const { byFilterId, markSeen } = useSavedFilterSubscriptions();

  // Refs para acessar valor atual dentro do callback do channel
  const filtersRef = useRef(savedFilters);
  filtersRef.current = savedFilters;
  const subsRef = useRef(byFilterId);
  subsRef.current = byFilterId;

  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("saved-filter-alerts:anomalias")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "anomalias_detectadas" },
        (msg) => {
          const row = msg.new as AnomaliaRow;
          if (!row?.id || seen.current.has(row.id)) return;
          seen.current.add(row.id);

          // Para cada filtro salvo do usuário com assinatura ativa
          for (const sf of filtersRef.current) {
            const sub = subsRef.current.get(sf.id);
            if (!sub) continue;
            if (new Date(row.detectada_em).getTime() <= new Date(sub.last_seen_at).getTime())
              continue;
            if (!matchesAnomaliaFilters(row, sf.filters)) continue;

            // 1) Sino in-app + toast
            if (sub.notify_inapp) {
              toast(`Novo em "${sf.name}"`, {
                description: `[${row.severidade.toUpperCase()}] ${row.descricao}`,
                action: {
                  label: "Abrir",
                  onClick: () => dispatchOpenAnomaliaDrawer(row.id),
                },
                duration: 10_000,
              });
              // Atualiza badges/contagens
              queryClient.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
              queryClient.invalidateQueries({ queryKey: ["anomalias-criticas-count"] });
            }

            // 2) Push do navegador (mesmo com aba fechada/em background)
            if (sub.notify_push) {
              supabase.functions
                .invoke("send-push-notification", {
                  body: {
                    userId: user.id,
                    title: `Novo em "${sf.name}"`,
                    body: `[${row.severidade.toUpperCase()}] ${row.descricao}`,
                    tag: `saved-filter-${sf.id}`,
                    prioridade:
                      row.severidade === "critica" || row.severidade === "alta"
                        ? row.severidade
                        : "media",
                    data: { url: `/admin/insights-ia/anomalia/${row.id}` },
                  },
                })
                .catch((e) => logger.warn("push falhou", e));
            }

            // Atualiza last_seen para não notificar de novo se a página recarregar
            markSeen.mutate(sub.id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, markSeen]);
}
