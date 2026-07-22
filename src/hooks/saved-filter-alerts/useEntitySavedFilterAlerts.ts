import { useEffect, useRef } from "react";
import { supabaseDyn } from "@/lib/supabase-dynamic";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSavedFilters } from "@/hooks/useSavedFilters";
import { useSavedFilterSubscriptions } from "@/hooks/useSavedFilterSubscriptions";
import {
  computeNextDispatch,
  shouldDispatchNow,
} from "@/hooks/savedFilterDispatchSchedule";
import { logger } from "@/lib/logger";
import { checkShouldDispatch } from "@/hooks/savedFilterDedup";
import { buildDescription } from "./descriptions";
import type { EntityConfig } from "./types";

export function useEntitySavedFilterAlerts<
  TRow extends { id: string },
  TFilters,
>(config: EntityConfig<TRow, TFilters>) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { filters: savedFilters } = useSavedFilters<TFilters>(
    config.entityType,
  );
  const { byFilterId, markSeen } = useSavedFilterSubscriptions();

  const filtersRef = useRef(savedFilters);
  filtersRef.current = savedFilters;
  const subsRef = useRef(byFilterId);
  subsRef.current = byFilterId;

  const seen = useRef<Set<string>>(new Set());

  const pendingBySub = useRef<Map<string, Array<{ title: string; desc: string }>>>(
    new Map(),
  );
  const dispatchTimestampsBySub = useRef<Map<string, number[]>>(new Map());
  const flushTimerBySub = useRef<Map<string, number>>(new Map());

  const flushBatch = (
    subId: string,
    sf: { id: string; name: string },
    sub: ReturnType<typeof subsRef.current.get>,
  ) => {
    if (!sub) return;
    const items = pendingBySub.current.get(subId) ?? [];
    if (items.length === 0) return;

    const summary =
      items.length === 1
        ? items[0].desc
        : `${items.length} novos itens · ${items
            .slice(0, 3)
            .map((i) => i.desc.split("\n")[0])
            .join(" • ")}${items.length > 3 ? ` +${items.length - 3}` : ""}`;
    const batchTitle = `Resumo de "${sf.name}"`;

    if (sub.notify_inapp) {
      toast(batchTitle, { description: summary, duration: 12_000 });
      for (const key of config.invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: [...key] });
      }
    }

    if (sub.notify_push && user) {
      supabase.functions
        .invoke("send-push-notification", {
          body: {
            userId: user.id,
            title: batchTitle,
            body: `${items.length} novos itens em ${config.moduleLabel}`,
            tag: `saved-filter-${sf.id}-batch`,
            prioridade: "media",
          },
        })
        .catch((e) =>
          logger.warn(`push batch falhou (${config.entityType})`, e),
        );
    }

    if (sub.notify_inapp || sub.notify_push || sub.notify_email) {
      supabase.functions
        .invoke("notify-saved-filter", {
          body: {
            sourceRef: sf.id,
            filterName: sf.name,
            title: batchTitle,
            body: summary,
            channels: {
              inapp: sub.notify_inapp,
              push: sub.notify_push,
              email: sub.notify_email,
            },
            metadata: {
              entityType: config.entityType,
              moduleLabel: config.moduleLabel,
              count: items.length,
              batched: true,
            },
          },
        })
        .catch((e) =>
          logger.warn(`notify-saved-filter batch falhou (${config.entityType})`, e),
        );
    }

    pendingBySub.current.delete(subId);
    dispatchTimestampsBySub.current.delete(subId);
    const tid = flushTimerBySub.current.get(subId);
    if (tid !== undefined) {
      window.clearTimeout(tid);
      flushTimerBySub.current.delete(subId);
    }
    const next = computeNextDispatch(sub.frequencia, sub.horario_preferido);
    supabaseDyn
      .from("saved_filter_subscriptions")
      .update({
        last_seen_at: new Date().toISOString(),
        next_dispatch_at: next ? next.toISOString() : null,
      })
      .eq("id", subId)
      .then(({ error }) => {
        if (error) logger.warn("update next_dispatch_at falhou", error);
      });
  };

  useEffect(() => {
    if (!user) return;
    const tick = () => {
      for (const [, sub] of subsRef.current) {
        if (sub.frequencia === "imediata") continue;
        if (!shouldDispatchNow(sub.frequencia, sub.next_dispatch_at)) continue;
        const sf = filtersRef.current.find((f) => f.id === sub.saved_filter_id);
        if (!sf) continue;
        flushBatch(sub.id, { id: sf.id, name: sf.name }, sub);
      }
    };
    const interval = window.setInterval(tick, 30_000);
    tick();
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(config.channel)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: config.table },
        (msg) => {
          const row = msg.new as TRow;
          if (!row?.id) return;

          for (const sf of filtersRef.current) {
            const sub = subsRef.current.get(sf.id);
            if (!sub) continue;
            const dedup = checkShouldDispatch({
              rowId: row.id,
              rowTimestamp: config.rowTimestamp(row),
              lastSeenAt: sub.last_seen_at,
              seen: seen.current,
              subscriptionUserId: sub.user_id,
              currentUserId: user?.id,
            });
            if (!dedup.shouldDispatch) continue;
            if (!config.matches(row, sf.filters)) continue;
            seen.current.add(row.id);

            const tiposAtivos = sub.tipos_eventos_ativos ?? [];
            if (tiposAtivos.length > 0 && config.rowTipoEvento) {
              const tipo = config.rowTipoEvento(row);
              if (!tipo || !tiposAtivos.includes(tipo)) continue;
            }

            const sevsCriticas = sub.severidades_criticas ?? ["critica"];
            const sevAtual = config.rowSeveridade?.(row) ?? null;
            const isUserCritical =
              sevAtual !== null && sevsCriticas.includes(sevAtual);

            const title = config.buildTitle(row, sf.name);
            const baseDesc = config.buildBaseDescription(row);
            const description = buildDescription(baseDesc, sf.filters);

            if (sub.frequencia !== "imediata") {
              const list = pendingBySub.current.get(sub.id) ?? [];
              list.push({ title, desc: description });
              pendingBySub.current.set(sub.id, list);
              if (!sub.next_dispatch_at) {
                const next = computeNextDispatch(
                  sub.frequencia,
                  sub.horario_preferido,
                );
                if (next) {
                  supabaseDyn
                    .from("saved_filter_subscriptions")
                    .update({ next_dispatch_at: next.toISOString() })
                    .eq("id", sub.id)
                    .then(({ error }) => {
                      if (error)
                        logger.warn("agendar next_dispatch_at falhou", error);
                    });
                }
              }
              continue;
            }

            const limitMax = sub.rate_limit_max ?? 5;
            const windowMs = (sub.rate_limit_window_min ?? 10) * 60_000;
            const now = Date.now();
            const stamps = (
              dispatchTimestampsBySub.current.get(sub.id) ?? []
            ).filter((t) => now - t < windowMs);
            const overLimit = stamps.length >= limitMax;

            if (overLimit && !isUserCritical) {
              const list = pendingBySub.current.get(sub.id) ?? [];
              list.push({ title, desc: description });
              pendingBySub.current.set(sub.id, list);

              const oldest = stamps[0] ?? now;
              const remaining = Math.max(2_000, windowMs - (now - oldest));
              const prevTimer = flushTimerBySub.current.get(sub.id);
              if (prevTimer !== undefined) window.clearTimeout(prevTimer);
              const tid = window.setTimeout(() => {
                flushTimerBySub.current.delete(sub.id);
                const fresh = subsRef.current.get(sf.id);
                flushBatch(sub.id, { id: sf.id, name: sf.name }, fresh);
              }, remaining);
              flushTimerBySub.current.set(sub.id, tid);

              markSeen.mutate(sub.id);
              continue;
            }

            stamps.push(now);
            dispatchTimestampsBySub.current.set(sub.id, stamps);

            if (sub.notify_inapp) {
              const action = config.buildAction?.(row);
              const toastFn = isUserCritical ? toast.error : toast;
              toastFn(title, {
                description,
                ...(action ? { action } : {}),
                duration: isUserCritical ? 15_000 : 10_000,
              });
              for (const key of config.invalidateKeys) {
                queryClient.invalidateQueries({ queryKey: [...key] });
              }
            }

            if (sub.notify_push) {
              const url = config.buildPushUrl(row);
              const prioridade = isUserCritical
                ? "critica"
                : config.pushPriority(row);
              supabase.functions
                .invoke("send-push-notification", {
                  body: {
                    userId: user.id,
                    title,
                    body: description,
                    tag: `saved-filter-${sf.id}`,
                    prioridade,
                    ...(url ? { data: { url } } : {}),
                  },
                })
                .catch((e) => logger.warn(`push falhou (${config.entityType})`, e));
            }

            if (sub.notify_inapp || sub.notify_push || sub.notify_email) {
              const url = config.buildPushUrl(row);
              supabase.functions
                .invoke("notify-saved-filter", {
                  body: {
                    sourceRef: sf.id,
                    filterName: sf.name,
                    title,
                    body: description,
                    channels: {
                      inapp: sub.notify_inapp,
                      push: sub.notify_push,
                      email: sub.notify_email,
                    },
                    ...(url ? { url } : {}),
                    metadata: {
                      entityType: config.entityType,
                      moduleLabel: config.moduleLabel,
                      rowId: row.id,
                    },
                  },
                })
                .catch((e) =>
                  logger.warn(`notify-saved-filter falhou (${config.entityType})`, e),
                );
            }

            markSeen.mutate(sub.id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, queryClient, markSeen]);
}
