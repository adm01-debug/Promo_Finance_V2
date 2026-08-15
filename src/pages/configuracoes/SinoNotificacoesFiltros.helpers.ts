// Constantes e helpers da página SinoNotificacoesFiltros — extraídos para zerar max-lines.
import { findCatalogEntry } from "./savedFiltersCatalog";

/**
 * Entity types que possuem dispatcher de tempo real registrado em
 * `useSavedFilterAlerts*`. Mantém em sincronia com os hooks instanciados
 * em src/pages/* (Conciliacao + AnomaliasDetectadasPanel).
 */
export const REALTIME_ENABLED_ENTITY_TYPES = new Set([
  "anomalias_detectadas",
  "conciliacao_transacoes",
]);

export interface SavedFilterRowMin {
  id: string;
  name: string;
  entity_type: string;
  is_default: boolean;
  is_shared: boolean;
  updated_at: string;
}

/** Rótulos amigáveis para entity_types que não vivem no catálogo. */
const ENTITY_TYPE_LABELS: Record<string, { label: string; area: string; route?: string }> = {
  anomalias_detectadas: {
    label: "Anomalias detectadas",
    area: "IA / Insights",
    route: "/admin/insights-ia",
  },
  conciliacao_transacoes: {
    label: "Conciliação bancária",
    area: "Financeiro",
    route: "/conciliacao",
  },
};

export function getEntityMeta(entityType: string) {
  const fromCatalog = findCatalogEntry(entityType);
  if (fromCatalog) {
    return {
      label: fromCatalog.label,
      area: fromCatalog.area,
      route: fromCatalog.route,
    };
  }
  return (
    ENTITY_TYPE_LABELS[entityType] ?? {
      label: entityType,
      area: "Outros",
      route: undefined,
    }
  );
}
