// Helpers, constants e serialização de estado para AnomaliasDetectadasPanel.
// Extraído para reduzir o tamanho do componente principal (modularização #4).

import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";
import type { SavedFilterPayload } from "@/hooks/useSavedFilters";
import type { ColumnDef } from "@/components/shared/ColumnVisibilityMenu";

export function severidadeBadge(s: Anomalia["severidade"]) {
  if (s === "critica" || s === "alta") return "destructive";
  if (s === "media") return "secondary";
  return "outline";
}

export const SEV_RANK: Record<Anomalia["severidade"], number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

export const TIPO_LABEL: Record<Anomalia["tipo_anomalia"], string> = {
  movimentacao_outlier: "Movimentação atípica",
  pagamento_duplicado: "Pagamento duplicado",
  conta_pagar_alta: "Conta a pagar alta",
  conciliacao_atrasada: "Conciliação atrasada",
  mudanca_regime_brusca: "Variação brusca de regime",
};

export const SEVERIDADES: Anomalia["severidade"][] = [
  "critica",
  "alta",
  "media",
  "baixa",
];
export const TIPOS = Object.keys(TIPO_LABEL) as Anomalia["tipo_anomalia"][];

export interface AnomaliaFilters {
  status: Anomalia["status"] | "todas";
  severidades: Anomalia["severidade"][];
  tipos: Anomalia["tipo_anomalia"][];
  periodoInicio: string;
  periodoFim: string;
  apenasReabertas: boolean;
}

export const ENTITY_TYPE = "anomalias_detectadas";

export const COLUNAS: ColumnDef[] = [
  { key: "severidade", label: "Severidade", locked: true },
  { key: "tipo", label: "Tipo", locked: true },
  { key: "data", label: "Data" },
  { key: "descricao", label: "Descrição", locked: true },
  { key: "observacoes", label: "Observações" },
  { key: "acoes_inline", label: "Ações inline" },
];

export const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: "detectada_em", label: "Data de detecção" },
  { key: "severidade", label: "Severidade" },
  { key: "tipo_anomalia", label: "Tipo de anomalia" },
  { key: "ultima_reabertura", label: "Última reabertura" },
];

export const DEFAULT_FILTERS: AnomaliaFilters = {
  status: "nova",
  severidades: [],
  tipos: [],
  periodoInicio: "",
  periodoFim: "",
  apenasReabertas: false,
};
export const DEFAULT_VISIBLE = COLUNAS.map((c) => c.key);
export const DEFAULT_PAYLOAD: SavedFilterPayload<AnomaliaFilters> = {
  v: 1,
  filters: DEFAULT_FILTERS,
  sort: { key: "detectada_em", dir: "desc" },
  columns: DEFAULT_VISIBLE,
};

export function parseFiltersFromUrl(sp: URLSearchParams): Partial<AnomaliaFilters> {
  const out: Partial<AnomaliaFilters> = {};
  const status = sp.get("status");
  if (status) out.status = status as AnomaliaFilters["status"];
  const sev = sp.get("sev");
  if (sev)
    out.severidades = sev
      .split(",")
      .filter(Boolean) as Anomalia["severidade"][];
  const tipos = sp.get("tipos");
  if (tipos)
    out.tipos = tipos
      .split(",")
      .filter(Boolean) as Anomalia["tipo_anomalia"][];
  const ini = sp.get("ini");
  if (ini) out.periodoInicio = ini;
  const fim = sp.get("fim");
  if (fim) out.periodoFim = fim;
  if (sp.get("reopen") === "1") out.apenasReabertas = true;
  return out;
}

export function writeFiltersToUrl(
  sp: URLSearchParams,
  f: AnomaliaFilters,
  s: { key: string; dir: "asc" | "desc" },
  cols: string[],
  q: string,
  presetId: string | null,
): URLSearchParams {
  const next = new URLSearchParams(sp);
  const setOrDel = (k: string, v: string) => {
    if (v) next.set(k, v);
    else next.delete(k);
  };
  setOrDel("status", f.status !== "nova" ? f.status : "");
  setOrDel("sev", f.severidades.join(","));
  setOrDel("tipos", f.tipos.join(","));
  setOrDel("ini", f.periodoInicio);
  setOrDel("fim", f.periodoFim);
  setOrDel("reopen", f.apenasReabertas ? "1" : "");
  setOrDel("sort", s.key !== "detectada_em" ? s.key : "");
  setOrDel("dir", s.dir !== "desc" ? s.dir : "");
  const colsDifere =
    cols.length !== DEFAULT_VISIBLE.length ||
    cols.some((c, i) => c !== DEFAULT_VISIBLE[i]);
  setOrDel("cols", colsDifere ? cols.join(",") : "");
  setOrDel("q", q.trim());
  setOrDel("preset", presetId ?? "");
  return next;
}

export const PERSIST_KEY = "anomalias-panel:state-v1";
export interface PersistedState {
  filters: AnomaliaFilters;
  sort: { key: string; dir: "asc" | "desc" };
  cols: string[];
  q: string;
  presetId?: string | null;
}
export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}
export function savePersistedState(s: PersistedState) {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(s));
  } catch {
    // quota cheia / modo privado — ignora silenciosamente
  }
}
