import type { SavedFilterPayload } from "@/hooks/useSavedFilters";

export interface AnomaliaRow {
  id: string;
  severidade: "critica" | "alta" | "media" | "baixa";
  tipo_anomalia: string;
  descricao: string;
  detectada_em: string;
  status: string;
  centro_custo_id: string | null;
}

export interface AnomaliaFilters {
  status?: string;
  severidades?: AnomaliaRow["severidade"][];
  tipos?: string[];
  periodoInicio?: string;
  periodoFim?: string;
}

export interface ConciliacaoRow {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: "credito" | "debito" | string;
  conciliada: boolean;
  created_at: string;
}

/** Forma serializada do `ConciliacaoFilterState` salvo em saved_filters. */
export interface ConciliacaoFilters {
  periodoInicio?: string;
  periodoFim?: string;
  valorMin?: string;
  valorMax?: string;
  tipo?: "todos" | "credito" | "debito";
  confiancaIA?: "todos" | "alta" | "media" | "baixa";
}

export interface EntityConfig<TRow, TFilters> {
  table: string;
  channel: string;
  entityType: string;
  moduleLabel: string;
  rowTimestamp: (row: TRow) => string;
  buildTitle: (row: TRow, filterName: string) => string;
  buildBaseDescription: (row: TRow) => string;
  buildPushUrl: (row: TRow) => string | null;
  buildAction?: (row: TRow) => { label: string; onClick: () => void } | null;
  pushPriority: (row: TRow) => "critica" | "alta" | "media" | "baixa";
  matches: (row: TRow, payload: SavedFilterPayload<TFilters>) => boolean;
  invalidateKeys: readonly (readonly unknown[])[];
  rowSeveridade?: (row: TRow) => "baixa" | "media" | "alta" | "critica" | null;
  rowTipoEvento?: (row: TRow) => string | null;
}
