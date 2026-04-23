import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSavedFilters, type SavedFilterPayload } from "@/hooks/useSavedFilters";
import { useSavedFilterSubscriptions } from "@/hooks/useSavedFilterSubscriptions";
import {
  computeNextDispatch,
  shouldDispatchNow,
} from "@/hooks/savedFilterDispatchSchedule";
import { dispatchOpenAnomaliaDrawer } from "@/lib/anomalia-routes";
import { logger } from "@/lib/logger";

// ============================================================================
// Tipos das entidades suportadas
// ============================================================================

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

interface ConciliacaoRow {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: "credito" | "debito" | string;
  conciliada: boolean;
  created_at: string;
}

/** Forma serializada do `ConciliacaoFilterState` salvo em saved_filters. */
interface ConciliacaoFilters {
  periodoInicio?: string;
  periodoFim?: string;
  valorMin?: string;
  valorMax?: string;
  tipo?: "todos" | "credito" | "debito";
  confiancaIA?: "todos" | "alta" | "media" | "baixa";
}

// ============================================================================
// Matchers (puros) — replicam a lógica dos painéis
// ============================================================================

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

function matchesConciliacaoFilters(
  row: ConciliacaoRow,
  payload: SavedFilterPayload<ConciliacaoFilters>,
): boolean {
  const f = payload.filters ?? {};
  const ts = new Date(row.data).getTime();
  if (f.periodoInicio && ts < new Date(f.periodoInicio).getTime()) return false;
  if (f.periodoFim && ts > new Date(f.periodoFim).getTime() + 86_400_000)
    return false;
  const min = f.valorMin ? Number(f.valorMin) : null;
  const max = f.valorMax ? Number(f.valorMax) : null;
  const valorAbs = Math.abs(Number(row.valor) || 0);
  if (min !== null && Number.isFinite(min) && valorAbs < min) return false;
  if (max !== null && Number.isFinite(max) && valorAbs > max) return false;
  if (f.tipo && f.tipo !== "todos" && row.tipo !== f.tipo) return false;
  return true;
}

// ============================================================================
// Helpers de apresentação
// ============================================================================

/** Descreve a ordenação ativa do preset em forma curta para o toast. */
function describeSort(payload: SavedFilterPayload<unknown>): string | null {
  if (!payload.sort) return null;
  return `Ordenado por ${payload.sort.key} ${payload.sort.dir.toUpperCase()}`;
}

/** Descreve as colunas visíveis do preset em forma curta para o toast. */
function describeColumns(payload: SavedFilterPayload<unknown>): string | null {
  const cols = payload.columns;
  if (!cols?.length) return null;
  const head = cols.slice(0, 4).join(", ");
  const extra = cols.length > 4 ? ` +${cols.length - 4}` : "";
  return `Colunas: ${head}${extra}`;
}

/** Compõe a descrição do toast incorporando colunas/ordenação salvas. */
function buildDescription(
  base: string,
  payload: SavedFilterPayload<unknown>,
): string {
  const extras = [describeColumns(payload), describeSort(payload)].filter(
    Boolean,
  ) as string[];
  return extras.length > 0 ? `${base}\n${extras.join(" · ")}` : base;
}

// ============================================================================
// Hook genérico interno: escuta INSERT em uma tabela e processa via matcher
// ============================================================================

interface EntityConfig<TRow, TFilters> {
  table: string;
  channel: string;
  /** Tipo salvo em saved_filters.entity_type. */
  entityType: string;
  /** Nome legível do módulo para exibir no toast. */
  moduleLabel: string;
  /** Extrai o timestamp do registro para comparação com last_seen_at. */
  rowTimestamp: (row: TRow) => string;
  /** Constrói o título do toast. */
  buildTitle: (row: TRow, filterName: string) => string;
  /** Constrói a descrição base do toast (antes de colunas/ordenação). */
  buildBaseDescription: (row: TRow) => string;
  /** Para cada novo registro, gera URL de drilldown ou null. */
  buildPushUrl: (row: TRow) => string | null;
  /** Ação opcional do toast in-app. */
  buildAction?: (row: TRow) => { label: string; onClick: () => void } | null;
  /** Prioridade de push. */
  pushPriority: (row: TRow) => "critica" | "alta" | "media" | "baixa";
  /** Matcher do preset. */
  matches: (row: TRow, payload: SavedFilterPayload<TFilters>) => boolean;
  /** Query keys a invalidar. */
  invalidateKeys: readonly (readonly unknown[])[];
}

function useEntitySavedFilterAlerts<TRow extends { id: string }, TFilters>(
  config: EntityConfig<TRow, TFilters>,
) {
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

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(config.channel)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: config.table },
        (msg) => {
          const row = msg.new as TRow;
          if (!row?.id || seen.current.has(row.id)) return;
          seen.current.add(row.id);

          for (const sf of filtersRef.current) {
            const sub = subsRef.current.get(sf.id);
            if (!sub) continue;
            const rowTs = new Date(config.rowTimestamp(row)).getTime();
            if (rowTs <= new Date(sub.last_seen_at).getTime()) continue;
            if (!config.matches(row, sf.filters)) continue;

            const title = config.buildTitle(row, sf.name);
            const baseDesc = config.buildBaseDescription(row);
            const description = buildDescription(baseDesc, sf.filters);

            if (sub.notify_inapp) {
              const action = config.buildAction?.(row);
              toast(title, {
                description,
                ...(action ? { action } : {}),
                duration: 10_000,
              });
              for (const key of config.invalidateKeys) {
                queryClient.invalidateQueries({ queryKey: [...key] });
              }
            }

            if (sub.notify_push) {
              const url = config.buildPushUrl(row);
              supabase.functions
                .invoke("send-push-notification", {
                  body: {
                    userId: user.id,
                    title,
                    body: description,
                    tag: `saved-filter-${sf.id}`,
                    prioridade: config.pushPriority(row),
                    ...(url ? { data: { url } } : {}),
                  },
                })
                .catch((e) => logger.warn(`push falhou (${config.entityType})`, e));
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

// ============================================================================
// Hooks públicos
// ============================================================================

/**
 * Escuta INSERTs em anomalias_detectadas e dispara toast in-app + push para
 * cada filtro salvo (entity_type "anomalias_detectadas") assinado pelo usuário.
 *
 * O título/descrição do toast incluem o nome do preset, severidade e — quando
 * o preset salvar `columns`/`sort` — uma linha extra com a ordenação ativa e
 * as colunas visíveis, para o usuário saber em que contexto aquele item entra.
 *
 * Para "anomalias críticas", basta o usuário salvar um preset com
 * severidades = ['critica','alta'] — o matcher já cobre isso.
 */
export function useSavedFilterAlerts() {
  useEntitySavedFilterAlerts<AnomaliaRow, AnomaliaFilters>({
    table: "anomalias_detectadas",
    channel: "saved-filter-alerts:anomalias",
    entityType: "anomalias_detectadas",
    moduleLabel: "Anomalia",
    rowTimestamp: (row) => row.detectada_em,
    buildTitle: (_row, filterName) => `Novo em "${filterName}"`,
    buildBaseDescription: (row) =>
      `[${row.severidade.toUpperCase()}] ${row.descricao}`,
    buildPushUrl: (row) => `/admin/insights-ia/anomalia/${row.id}`,
    buildAction: (row) => ({
      label: "Abrir",
      onClick: () => dispatchOpenAnomaliaDrawer(row.id),
    }),
    pushPriority: (row) =>
      row.severidade === "critica" || row.severidade === "alta"
        ? row.severidade
        : "media",
    matches: matchesAnomaliaFilters,
    invalidateKeys: [
      ["anomalias-detectadas"],
      ["anomalias-criticas-count"],
    ],
  });
}

/**
 * Escuta INSERTs em transacoes_bancarias e notifica para cada preset salvo
 * de conciliação (entity_type "conciliacao_transacoes") que inclua o registro
 * pelo período e faixa de valor configurados pelo usuário.
 *
 * Diferente do painel, o matcher aqui ignora `confiancaIA` (campo derivado de
 * IA, ainda não disponível no payload do realtime) e busca conformidade
 * estrutural — o painel re-aplica o filtro completo ao abrir.
 */
export function useSavedFilterAlertsConciliacao() {
  useEntitySavedFilterAlerts<ConciliacaoRow, ConciliacaoFilters>({
    table: "transacoes_bancarias",
    channel: "saved-filter-alerts:conciliacao",
    entityType: "conciliacao_transacoes",
    moduleLabel: "Conciliação",
    rowTimestamp: (row) => row.data ?? row.created_at,
    buildTitle: (_row, filterName) =>
      `Nova transação em "${filterName}"`,
    buildBaseDescription: (row) => {
      const valor = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Math.abs(Number(row.valor) || 0));
      const sinal = row.tipo === "credito" ? "+" : "−";
      const data = new Date(row.data).toLocaleDateString("pt-BR");
      return `${sinal} ${valor} · ${data} · ${row.descricao ?? "sem descrição"}`;
    },
    buildPushUrl: () => `/conciliacao`,
    buildAction: () => ({
      label: "Conciliar",
      onClick: () => {
        if (typeof window !== "undefined") window.location.assign("/conciliacao");
      },
    }),
    pushPriority: () => "media",
    matches: matchesConciliacaoFilters,
    invalidateKeys: [["conciliacao-transacoes"], ["conciliacao-page"]],
  });
}
