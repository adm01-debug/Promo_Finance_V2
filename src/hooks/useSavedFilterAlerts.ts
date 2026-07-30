import { dispatchOpenAnomaliaDrawer } from "@/lib/anomalia-routes";
import { useEntitySavedFilterAlerts } from "./saved-filter-alerts/useEntitySavedFilterAlerts";
import {
  matchesAnomaliaFilters,
  matchesConciliacaoFilters,
} from "./saved-filter-alerts/matchers";
import type {
  AnomaliaFilters,
  AnomaliaRow,
  ConciliacaoFilters,
  ConciliacaoRow,
} from "./saved-filter-alerts/types";

export type {
  AnomaliaFilters,
  AnomaliaRow,
  ConciliacaoFilters,
  ConciliacaoRow,
} from "./saved-filter-alerts/types";

/**
 * Escuta INSERTs em anomalias_detectadas e dispara toast in-app + push para
 * cada filtro salvo (entity_type "anomalias_detectadas") assinado pelo usuário.
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
    rowSeveridade: (row) => row.severidade,
    rowTipoEvento: (row) => row.tipo_anomalia,
    invalidateKeys: [
      ["anomalias-detectadas"],
      ["anomalias-criticas-count"],
    ],
  });
}

/**
 * Escuta INSERTs em transacoes_bancarias e notifica para cada preset salvo
 * de conciliação (entity_type "conciliacao_transacoes").
 */
export function useSavedFilterAlertsConciliacao() {
  useEntitySavedFilterAlerts<ConciliacaoRow, ConciliacaoFilters>({
    table: "transacoes_bancarias",
    channel: "saved-filter-alerts:conciliacao",
    entityType: "conciliacao_transacoes",
    moduleLabel: "Conciliação",
    rowTimestamp: (row) => row.data ?? row.created_at,
    buildTitle: (_row, filterName) => `Nova transação em "${filterName}"`,
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
    rowTipoEvento: (row) => (row.tipo === "credito" ? "credito" : "debito"),
    invalidateKeys: [["conciliacao-transacoes"], ["conciliacao-page"]],
  });
}
