// Factories e utilitários do AdminTelemetria (extraídos do arquivo de teste
// para modularização max-lines). Compartilhados por AdminTelemetria.test.tsx e
// admin-telemetria-logica.test.ts.

// ── TelemetryRow factory ─────────────────────────────────────────────────

export interface TelemetryRow {
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  record_count: number | null;
  query_limit: number | null;
  query_offset: number | null;
  count_mode: string | null;
  severity: string;
  error_message: string | null;
  user_id: string | null;
  created_at: string;
}

let rowCounter = 0;
export function makeRow(overrides: Partial<TelemetryRow> = {}): TelemetryRow {
  rowCounter++;
  return {
    id: 'id' in overrides ? overrides.id! : `tel-${rowCounter}`,
    operation: overrides.operation ?? 'SELECT',
    table_name: 'table_name' in overrides ? (overrides.table_name ?? null) : 'companies',
    rpc_name: 'rpc_name' in overrides ? (overrides.rpc_name ?? null) : null,
    duration_ms: overrides.duration_ms ?? 4500,
    record_count: 'record_count' in overrides ? (overrides.record_count ?? null) : 25,
    query_limit: 'query_limit' in overrides ? (overrides.query_limit ?? null) : 100,
    query_offset: 'query_offset' in overrides ? (overrides.query_offset ?? null) : 0,
    count_mode: 'count_mode' in overrides ? (overrides.count_mode ?? null) : 'exact',
    severity: overrides.severity ?? 'slow',
    error_message: 'error_message' in overrides ? (overrides.error_message ?? null) : null,
    user_id: 'user_id' in overrides ? (overrides.user_id ?? null) : null,
    created_at: overrides.created_at ?? new Date().toISOString(),
  };
}

export function makeRows(count: number, overrides: Partial<TelemetryRow> = {}): TelemetryRow[] {
  return Array.from({ length: count }, () => makeRow(overrides));
}

// ── Utility functions under test (extracted logic) ───────────────────────

export function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export function getTimeThreshold(timeFilter: string): string {
  const now = new Date();
  switch (timeFilter) {
    case "1h": return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case "6h": return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    default: return new Date().toISOString();
  }
}

export function computeStats(rows: TelemetryRow[]) {
  const verySlow = rows.filter(r => r.severity === "very_slow").length;
  const slow = rows.filter(r => r.severity === "slow").length;
  const errors = rows.filter(r => r.severity === "error").length;
  const avgDuration = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length)
    : 0;
  return { verySlow, slow, errors, avgDuration };
}

export function computeTopOffenders(rows: TelemetryRow[]) {
  const tableStats = new Map<string, { count: number; totalMs: number; maxMs: number }>();
  for (const r of rows) {
    const key = r.rpc_name || r.table_name || "unknown";
    const prev = tableStats.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
    tableStats.set(key, {
      count: prev.count + 1,
      totalMs: prev.totalMs + r.duration_ms,
      maxMs: Math.max(prev.maxMs, r.duration_ms),
    });
  }
  return [...tableStats.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);
}
