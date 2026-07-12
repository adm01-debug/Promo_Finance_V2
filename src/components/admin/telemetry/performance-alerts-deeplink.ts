// Deep-link parsers/serializers para PerformanceAlertsWeeklyTrend.
// Extraídos para permitir testes unitários sem montar o componente.

export type SeverityFilter = "all" | "critical" | "warning" | "info";

const SEVERITIES: readonly SeverityFilter[] = ["all", "critical", "warning", "info"] as const;

/** Type guard: string é um SeverityFilter válido. */
export function isSeverity(v: string | null | undefined): v is SeverityFilter {
  return typeof v === "string" && (SEVERITIES as readonly string[]).includes(v);
}

/** Type guard: string está no formato ISO YYYY-MM-DD com dia/mês válidos. */
export function isIsoDate(v: string | null | undefined): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  // Rejeita datas inválidas tipo 2024-02-30 verificando round-trip.
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Lê severity da query string com fallback para storage e depois "all". */
export function readSeverityFromLocation(
  search: string,
  storageValue: string | null,
): SeverityFilter {
  const urlParam = new URLSearchParams(search).get("severity");
  if (isSeverity(urlParam)) return urlParam;
  if (isSeverity(storageValue)) return storageValue;
  return "all";
}

/** Lê week da query string, ignorando valores inválidos. */
export function readWeekFromLocation(search: string): string | null {
  const wk = new URLSearchParams(search).get("week");
  return isIsoDate(wk) ? wk : null;
}

/** Retorna a href atualizada com/sem os params — pura, sem side effects. */
export function buildUrlWithParams(
  href: string,
  params: { severity?: SeverityFilter | null; week?: string | null },
): string {
  const url = new URL(href);
  if (params.severity !== undefined) {
    if (params.severity == null || params.severity === "all") {
      url.searchParams.delete("severity");
    } else {
      url.searchParams.set("severity", params.severity);
    }
  }
  if (params.week !== undefined) {
    if (params.week == null) url.searchParams.delete("week");
    else if (isIsoDate(params.week)) url.searchParams.set("week", params.week);
  }
  return url.toString();
}
