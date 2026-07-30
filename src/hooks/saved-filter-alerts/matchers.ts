import type { SavedFilterPayload } from "@/hooks/useSavedFilters";
import type {
  AnomaliaFilters,
  AnomaliaRow,
  ConciliacaoFilters,
  ConciliacaoRow,
} from "./types";

export function matchesAnomaliaFilters(
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

export function matchesConciliacaoFilters(
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
