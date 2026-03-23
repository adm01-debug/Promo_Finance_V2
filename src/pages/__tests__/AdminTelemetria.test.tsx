import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// ── TelemetryRow factory ─────────────────────────────────────────────────

interface TelemetryRow {
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
function makeRow(overrides: Partial<TelemetryRow> = {}): TelemetryRow {
  rowCounter++;
  return {
    id: overrides.id ?? `tel-${rowCounter}`,
    operation: overrides.operation ?? 'SELECT',
    table_name: overrides.table_name ?? 'companies',
    rpc_name: overrides.rpc_name ?? null,
    duration_ms: overrides.duration_ms ?? 4500,
    record_count: overrides.record_count ?? 25,
    query_limit: overrides.query_limit ?? 100,
    query_offset: overrides.query_offset ?? 0,
    count_mode: overrides.count_mode ?? 'exact',
    severity: overrides.severity ?? 'slow',
    error_message: overrides.error_message ?? null,
    user_id: overrides.user_id ?? null,
    created_at: overrides.created_at ?? new Date().toISOString(),
  };
}

function makeRows(count: number, overrides: Partial<TelemetryRow> = {}): TelemetryRow[] {
  return Array.from({ length: count }, () => makeRow(overrides));
}

// ── Utility functions under test (extracted logic) ───────────────────────

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function getTimeThreshold(timeFilter: string): string {
  const now = new Date();
  switch (timeFilter) {
    case "1h": return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case "6h": return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    default: return new Date().toISOString();
  }
}

function computeStats(rows: TelemetryRow[]) {
  const verySlow = rows.filter(r => r.severity === "very_slow").length;
  const slow = rows.filter(r => r.severity === "slow").length;
  const errors = rows.filter(r => r.severity === "error").length;
  const avgDuration = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length)
    : 0;
  return { verySlow, slow, errors, avgDuration };
}

function computeTopOffenders(rows: TelemetryRow[]) {
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

// ══════════════════════════════════════════════════════════════════════════
//  UNIT TESTS: formatDuration
// ══════════════════════════════════════════════════════════════════════════

describe('formatDuration', () => {
  it('formats 0ms', () => expect(formatDuration(0)).toBe('0ms'));
  it('formats 1ms', () => expect(formatDuration(1)).toBe('1ms'));
  it('formats 500ms', () => expect(formatDuration(500)).toBe('500ms'));
  it('formats 999ms', () => expect(formatDuration(999)).toBe('999ms'));
  it('formats 1000ms as seconds', () => expect(formatDuration(1000)).toBe('1.0s'));
  it('formats 1500ms', () => expect(formatDuration(1500)).toBe('1.5s'));
  it('formats 3000ms', () => expect(formatDuration(3000)).toBe('3.0s'));
  it('formats 8000ms', () => expect(formatDuration(8000)).toBe('8.0s'));
  it('formats 8500ms', () => expect(formatDuration(8500)).toBe('8.5s'));
  it('formats 10000ms', () => expect(formatDuration(10000)).toBe('10.0s'));
  it('formats 60000ms (1min)', () => expect(formatDuration(60000)).toBe('60.0s'));
  it('formats 999999ms', () => expect(formatDuration(999999)).toBe('1000.0s'));
  it('formats 100ms', () => expect(formatDuration(100)).toBe('100ms'));
  it('formats 2999ms (boundary)', () => expect(formatDuration(2999)).toBe('3.0s'));
  it('formats 1001ms', () => expect(formatDuration(1001)).toBe('1.0s'));
  it('formats 1234ms', () => expect(formatDuration(1234)).toBe('1.2s'));
  it('formats 9999ms', () => expect(formatDuration(9999)).toBe('10.0s'));
  it('formats 50ms', () => expect(formatDuration(50)).toBe('50ms'));
  it('formats 750ms', () => expect(formatDuration(750)).toBe('750ms'));
  it('formats 15000ms', () => expect(formatDuration(15000)).toBe('15.0s'));
});

// ══════════════════════════════════════════════════════════════════════════
//  UNIT TESTS: formatTime
// ══════════════════════════════════════════════════════════════════════════

describe('formatTime', () => {
  it('returns a non-empty string for valid ISO', () => {
    expect(formatTime(new Date().toISOString()).length).toBeGreaterThan(0);
  });

  it('includes hour and minute', () => {
    const d = new Date(2025, 5, 15, 14, 30, 45);
    const result = formatTime(d.toISOString());
    expect(result).toContain('14');
    expect(result).toContain('30');
  });

  it('includes day', () => {
    const d = new Date(2025, 0, 7, 9, 0, 0);
    const result = formatTime(d.toISOString());
    expect(result).toContain('07');
  });

  it('handles midnight', () => {
    const d = new Date(2025, 3, 1, 0, 0, 0);
    const result = formatTime(d.toISOString());
    expect(result).toContain('00');
  });

  it('handles end of day', () => {
    const d = new Date(2025, 11, 31, 23, 59, 59);
    const result = formatTime(d.toISOString());
    expect(result).toContain('23');
    expect(result).toContain('59');
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  UNIT TESTS: getTimeThreshold
// ══════════════════════════════════════════════════════════════════════════

describe('getTimeThreshold', () => {
  it('1h threshold is ~1 hour ago', () => {
    const threshold = new Date(getTimeThreshold('1h'));
    const diff = Date.now() - threshold.getTime();
    expect(diff).toBeGreaterThan(3500000); // ~59min
    expect(diff).toBeLessThan(3700000); // ~61min
  });

  it('6h threshold is ~6 hours ago', () => {
    const threshold = new Date(getTimeThreshold('6h'));
    const diff = Date.now() - threshold.getTime();
    expect(diff).toBeGreaterThan(21000000);
    expect(diff).toBeLessThan(22000000);
  });

  it('24h threshold is ~24 hours ago', () => {
    const threshold = new Date(getTimeThreshold('24h'));
    const diff = Date.now() - threshold.getTime();
    expect(diff).toBeGreaterThan(86000000);
    expect(diff).toBeLessThan(87000000);
  });

  it('7d threshold is ~7 days ago', () => {
    const threshold = new Date(getTimeThreshold('7d'));
    const diff = Date.now() - threshold.getTime();
    expect(diff).toBeGreaterThan(604000000);
    expect(diff).toBeLessThan(605000000);
  });

  it('returns valid ISO string', () => {
    const result = getTimeThreshold('24h');
    expect(() => new Date(result)).not.toThrow();
    expect(new Date(result).getTime()).not.toBeNaN();
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  UNIT TESTS: computeStats
// ══════════════════════════════════════════════════════════════════════════

describe('computeStats', () => {
  it('returns zeros for empty array', () => {
    const stats = computeStats([]);
    expect(stats).toEqual({ verySlow: 0, slow: 0, errors: 0, avgDuration: 0 });
  });

  it('counts very_slow correctly', () => {
    const rows = makeRows(5, { severity: 'very_slow' });
    expect(computeStats(rows).verySlow).toBe(5);
  });

  it('counts slow correctly', () => {
    const rows = makeRows(3, { severity: 'slow' });
    expect(computeStats(rows).slow).toBe(3);
  });

  it('counts errors correctly', () => {
    const rows = makeRows(7, { severity: 'error' });
    expect(computeStats(rows).errors).toBe(7);
  });

  it('calculates average duration', () => {
    const rows = [
      makeRow({ duration_ms: 1000 }),
      makeRow({ duration_ms: 3000 }),
    ];
    expect(computeStats(rows).avgDuration).toBe(2000);
  });

  it('rounds average duration', () => {
    const rows = [
      makeRow({ duration_ms: 1000 }),
      makeRow({ duration_ms: 1001 }),
      makeRow({ duration_ms: 1002 }),
    ];
    expect(computeStats(rows).avgDuration).toBe(1001);
  });

  it('handles mixed severities', () => {
    const rows = [
      makeRow({ severity: 'slow' }),
      makeRow({ severity: 'very_slow' }),
      makeRow({ severity: 'error' }),
      makeRow({ severity: 'slow' }),
      makeRow({ severity: 'normal' }),
    ];
    const stats = computeStats(rows);
    expect(stats.slow).toBe(2);
    expect(stats.verySlow).toBe(1);
    expect(stats.errors).toBe(1);
  });

  it('handles single row', () => {
    const rows = [makeRow({ duration_ms: 5000, severity: 'slow' })];
    const stats = computeStats(rows);
    expect(stats.slow).toBe(1);
    expect(stats.avgDuration).toBe(5000);
  });

  it('handles 200 rows', () => {
    const rows = makeRows(200, { severity: 'slow', duration_ms: 100 });
    const stats = computeStats(rows);
    expect(stats.slow).toBe(200);
    expect(stats.avgDuration).toBe(100);
  });

  it('ignores unknown severity in named counts', () => {
    const rows = makeRows(3, { severity: 'unknown_severity' });
    const stats = computeStats(rows);
    expect(stats.slow).toBe(0);
    expect(stats.verySlow).toBe(0);
    expect(stats.errors).toBe(0);
  });

  it('avg with zero durations', () => {
    const rows = makeRows(5, { duration_ms: 0 });
    expect(computeStats(rows).avgDuration).toBe(0);
  });

  it('avg with very high durations', () => {
    const rows = makeRows(2, { duration_ms: 500000 });
    expect(computeStats(rows).avgDuration).toBe(500000);
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  UNIT TESTS: computeTopOffenders
// ══════════════════════════════════════════════════════════════════════════

describe('computeTopOffenders', () => {
  it('returns empty for empty array', () => {
    expect(computeTopOffenders([])).toEqual([]);
  });

  it('groups by table_name', () => {
    const rows = [
      makeRow({ table_name: 'companies' }),
      makeRow({ table_name: 'companies' }),
      makeRow({ table_name: 'contacts' }),
    ];
    const result = computeTopOffenders(rows);
    expect(result[0][0]).toBe('companies');
    expect(result[0][1].count).toBe(2);
    expect(result[1][0]).toBe('contacts');
    expect(result[1][1].count).toBe(1);
  });

  it('prefers rpc_name over table_name', () => {
    const rows = [makeRow({ rpc_name: 'get_data', table_name: 'companies' })];
    const result = computeTopOffenders(rows);
    expect(result[0][0]).toBe('get_data');
  });

  it('uses "unknown" when both are null', () => {
    const rows = [makeRow({ rpc_name: null, table_name: null })];
    const result = computeTopOffenders(rows);
    expect(result[0][0]).toBe('unknown');
  });

  it('sorts by count descending', () => {
    const rows = [
      ...makeRows(1, { table_name: 'A' }),
      ...makeRows(5, { table_name: 'B' }),
      ...makeRows(3, { table_name: 'C' }),
    ];
    const result = computeTopOffenders(rows);
    expect(result[0][0]).toBe('B');
    expect(result[1][0]).toBe('C');
    expect(result[2][0]).toBe('A');
  });

  it('limits to 8 entries', () => {
    const tables = 'ABCDEFGHIJ'.split('');
    const rows = tables.flatMap(t => makeRows(2, { table_name: t }));
    const result = computeTopOffenders(rows);
    expect(result.length).toBe(8);
  });

  it('calculates maxMs correctly', () => {
    const rows = [
      makeRow({ table_name: 'X', duration_ms: 100 }),
      makeRow({ table_name: 'X', duration_ms: 9000 }),
      makeRow({ table_name: 'X', duration_ms: 500 }),
    ];
    const result = computeTopOffenders(rows);
    expect(result[0][1].maxMs).toBe(9000);
  });

  it('calculates totalMs correctly', () => {
    const rows = [
      makeRow({ table_name: 'Y', duration_ms: 100 }),
      makeRow({ table_name: 'Y', duration_ms: 200 }),
    ];
    const result = computeTopOffenders(rows);
    expect(result[0][1].totalMs).toBe(300);
  });

  it('handles single table', () => {
    const rows = makeRows(10, { table_name: 'solo' });
    const result = computeTopOffenders(rows);
    expect(result.length).toBe(1);
    expect(result[0][0]).toBe('solo');
    expect(result[0][1].count).toBe(10);
  });

  it('handles mixed rpc and table names', () => {
    const rows = [
      makeRow({ rpc_name: 'fn_a', table_name: null }),
      makeRow({ rpc_name: null, table_name: 'tbl_b' }),
      makeRow({ rpc_name: 'fn_a', table_name: 'tbl_c' }), // rpc_name takes precedence
    ];
    const result = computeTopOffenders(rows);
    expect(result[0][0]).toBe('fn_a');
    expect(result[0][1].count).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  UNIT TESTS: TelemetryRow factory / data integrity
// ══════════════════════════════════════════════════════════════════════════

describe('TelemetryRow data integrity', () => {
  it('makeRow generates unique IDs', () => {
    const ids = new Set(makeRows(100).map(r => r.id));
    expect(ids.size).toBe(100);
  });

  it('makeRow defaults are valid', () => {
    const r = makeRow();
    expect(r.operation).toBe('SELECT');
    expect(r.table_name).toBe('companies');
    expect(r.severity).toBe('slow');
    expect(r.duration_ms).toBe(4500);
    expect(r.created_at).toBeTruthy();
  });

  it('overrides work correctly', () => {
    const r = makeRow({ operation: 'INSERT', severity: 'error', duration_ms: 99 });
    expect(r.operation).toBe('INSERT');
    expect(r.severity).toBe('error');
    expect(r.duration_ms).toBe(99);
  });

  it('nullable fields default to null', () => {
    const r = makeRow();
    expect(r.rpc_name).toBeNull();
    expect(r.error_message).toBeNull();
    expect(r.user_id).toBeNull();
  });

  it('record_count can be overridden', () => {
    const r = makeRow({ record_count: 500 });
    expect(r.record_count).toBe(500);
  });

  it('query_limit can be overridden', () => {
    const r = makeRow({ query_limit: 1000 });
    expect(r.query_limit).toBe(1000);
  });

  it('query_offset can be overridden', () => {
    const r = makeRow({ query_offset: 50 });
    expect(r.query_offset).toBe(50);
  });

  it('count_mode can be overridden', () => {
    const r = makeRow({ count_mode: 'estimated' });
    expect(r.count_mode).toBe('estimated');
  });

  it('error_message can be set', () => {
    const r = makeRow({ error_message: 'timeout' });
    expect(r.error_message).toBe('timeout');
  });

  it('user_id can be set', () => {
    const r = makeRow({ user_id: 'abc-123' });
    expect(r.user_id).toBe('abc-123');
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  INTEGRATION: Severity classification thresholds
// ══════════════════════════════════════════════════════════════════════════

describe('Severity classification thresholds', () => {
  // These test the UI color logic from the page
  function getSeverityColor(duration_ms: number): string {
    if (duration_ms >= 8000) return 'text-destructive';
    if (duration_ms >= 3000) return 'text-yellow-600';
    return '';
  }

  it('< 3000ms = no color class', () => {
    expect(getSeverityColor(0)).toBe('');
    expect(getSeverityColor(1000)).toBe('');
    expect(getSeverityColor(2999)).toBe('');
  });

  it('>= 3000ms = yellow', () => {
    expect(getSeverityColor(3000)).toBe('text-yellow-600');
    expect(getSeverityColor(5000)).toBe('text-yellow-600');
    expect(getSeverityColor(7999)).toBe('text-yellow-600');
  });

  it('>= 8000ms = destructive', () => {
    expect(getSeverityColor(8000)).toBe('text-destructive');
    expect(getSeverityColor(10000)).toBe('text-destructive');
    expect(getSeverityColor(999999)).toBe('text-destructive');
  });

  // Boundary tests
  it('2999ms is normal', () => expect(getSeverityColor(2999)).toBe(''));
  it('3000ms is slow', () => expect(getSeverityColor(3000)).toBe('text-yellow-600'));
  it('7999ms is slow', () => expect(getSeverityColor(7999)).toBe('text-yellow-600'));
  it('8000ms is very_slow', () => expect(getSeverityColor(8000)).toBe('text-destructive'));
});

// ══════════════════════════════════════════════════════════════════════════
//  INTEGRATION: Severity badge mapping
// ══════════════════════════════════════════════════════════════════════════

describe('Severity badge mapping', () => {
  function getBadgeText(severity: string): string {
    switch (severity) {
      case 'very_slow': return '🔴 Muito Lenta';
      case 'slow': return '🟡 Lenta';
      case 'error': return '❌ Erro';
      default: return severity;
    }
  }

  it('maps very_slow', () => expect(getBadgeText('very_slow')).toBe('🔴 Muito Lenta'));
  it('maps slow', () => expect(getBadgeText('slow')).toBe('🟡 Lenta'));
  it('maps error', () => expect(getBadgeText('error')).toBe('❌ Erro'));
  it('passes through normal', () => expect(getBadgeText('normal')).toBe('normal'));
  it('passes through empty', () => expect(getBadgeText('')).toBe(''));
  it('passes through custom', () => expect(getBadgeText('custom')).toBe('custom'));
});

// ══════════════════════════════════════════════════════════════════════════
//  STRESS TESTS: Large datasets
// ══════════════════════════════════════════════════════════════════════════

describe('Large dataset stress tests', () => {
  it('computeStats handles 500 rows', () => {
    const rows = makeRows(500, { severity: 'slow', duration_ms: 3500 });
    const stats = computeStats(rows);
    expect(stats.slow).toBe(500);
    expect(stats.avgDuration).toBe(3500);
  });

  it('computeTopOffenders handles 1000 rows across 20 tables', () => {
    const tables = Array.from({ length: 20 }, (_, i) => `table_${i}`);
    const rows = tables.flatMap(t => makeRows(50, { table_name: t }));
    const result = computeTopOffenders(rows);
    expect(result.length).toBe(8);
  });

  it('computeStats with all severity types', () => {
    const rows = [
      ...makeRows(100, { severity: 'slow' }),
      ...makeRows(50, { severity: 'very_slow' }),
      ...makeRows(30, { severity: 'error' }),
      ...makeRows(200, { severity: 'normal' }),
    ];
    const stats = computeStats(rows);
    expect(stats.slow).toBe(100);
    expect(stats.verySlow).toBe(50);
    expect(stats.errors).toBe(30);
  });

  it('handles rows with diverse durations', () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({ duration_ms: i * 100 })
    );
    const stats = computeStats(rows);
    // avg of 0, 100, 200, ..., 9900 = 4950
    expect(stats.avgDuration).toBe(4950);
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  EDGE CASES
// ══════════════════════════════════════════════════════════════════════════

describe('Edge cases', () => {
  it('formatDuration with negative ms returns string', () => {
    const result = formatDuration(-100);
    expect(typeof result).toBe('string');
  });

  it('computeStats with all zero durations', () => {
    const rows = makeRows(10, { duration_ms: 0 });
    expect(computeStats(rows).avgDuration).toBe(0);
  });

  it('computeTopOffenders with identical entries', () => {
    const rows = makeRows(50, { table_name: 'same_table', duration_ms: 1000 });
    const result = computeTopOffenders(rows);
    expect(result.length).toBe(1);
    expect(result[0][1].count).toBe(50);
    expect(result[0][1].maxMs).toBe(1000);
    expect(result[0][1].totalMs).toBe(50000);
  });

  it('handles operation types', () => {
    const ops = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'RPC'];
    for (const op of ops) {
      const row = makeRow({ operation: op });
      expect(row.operation).toBe(op);
    }
  });

  it('time threshold ordering is correct', () => {
    const t1h = new Date(getTimeThreshold('1h')).getTime();
    const t6h = new Date(getTimeThreshold('6h')).getTime();
    const t24h = new Date(getTimeThreshold('24h')).getTime();
    const t7d = new Date(getTimeThreshold('7d')).getTime();
    expect(t1h).toBeGreaterThan(t6h);
    expect(t6h).toBeGreaterThan(t24h);
    expect(t24h).toBeGreaterThan(t7d);
  });

  it('cleanup threshold is 7 days ago', () => {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const diff = Date.now() - threshold.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(Math.abs(diff - sevenDaysMs)).toBeLessThan(1000);
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  FILTER LOGIC TESTS
// ══════════════════════════════════════════════════════════════════════════

describe('Filter logic', () => {
  it('severity filter "all" includes everything', () => {
    const rows = [
      makeRow({ severity: 'slow' }),
      makeRow({ severity: 'very_slow' }),
      makeRow({ severity: 'error' }),
      makeRow({ severity: 'normal' }),
    ];
    const filtered = rows; // "all" = no filter
    expect(filtered.length).toBe(4);
  });

  it('severity filter "slow" filters correctly', () => {
    const rows = [
      makeRow({ severity: 'slow' }),
      makeRow({ severity: 'very_slow' }),
      makeRow({ severity: 'error' }),
    ];
    const filtered = rows.filter(r => r.severity === 'slow');
    expect(filtered.length).toBe(1);
  });

  it('severity filter "very_slow" filters correctly', () => {
    const rows = [
      makeRow({ severity: 'slow' }),
      makeRow({ severity: 'very_slow' }),
      makeRow({ severity: 'very_slow' }),
    ];
    const filtered = rows.filter(r => r.severity === 'very_slow');
    expect(filtered.length).toBe(2);
  });

  it('severity filter "error" filters correctly', () => {
    const rows = [
      makeRow({ severity: 'error' }),
      makeRow({ severity: 'slow' }),
    ];
    const filtered = rows.filter(r => r.severity === 'error');
    expect(filtered.length).toBe(1);
  });

  it('time filter excludes old rows', () => {
    const now = Date.now();
    const rows = [
      makeRow({ created_at: new Date(now - 30 * 60 * 1000).toISOString() }), // 30min ago
      makeRow({ created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() }), // 2h ago
    ];
    const threshold = new Date(now - 60 * 60 * 1000).toISOString(); // 1h
    const filtered = rows.filter(r => r.created_at >= threshold);
    expect(filtered.length).toBe(1);
  });

  it('time filter 7d includes week-old rows', () => {
    const now = Date.now();
    const rows = [
      makeRow({ created_at: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString() }),
      makeRow({ created_at: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString() }),
    ];
    const threshold = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const filtered = rows.filter(r => r.created_at >= threshold);
    expect(filtered.length).toBe(1);
  });

  it('combined severity + time filter', () => {
    const now = Date.now();
    const rows = [
      makeRow({ severity: 'slow', created_at: new Date(now - 30 * 60 * 1000).toISOString() }),
      makeRow({ severity: 'error', created_at: new Date(now - 30 * 60 * 1000).toISOString() }),
      makeRow({ severity: 'slow', created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString() }),
    ];
    const threshold = new Date(now - 60 * 60 * 1000).toISOString();
    const filtered = rows.filter(r => r.severity === 'slow' && r.created_at >= threshold);
    expect(filtered.length).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  TABLE DISPLAY LOGIC
// ══════════════════════════════════════════════════════════════════════════

describe('Table display logic', () => {
  it('shows rpc_name when available', () => {
    const r = makeRow({ rpc_name: 'my_func', table_name: 'my_table' });
    expect(r.rpc_name || r.table_name || '-').toBe('my_func');
  });

  it('falls back to table_name when rpc_name is null', () => {
    const r = makeRow({ rpc_name: null, table_name: 'my_table' });
    expect(r.rpc_name || r.table_name || '-').toBe('my_table');
  });

  it('shows dash when both are null', () => {
    const r = makeRow({ rpc_name: null, table_name: null });
    expect(r.rpc_name || r.table_name || '-').toBe('-');
  });

  it('shows record_count or dash', () => {
    expect(makeRow({ record_count: 42 }).record_count ?? '-').toBe(42);
    expect(makeRow({ record_count: null }).record_count ?? '-').toBe('-');
  });

  it('shows query_limit or dash', () => {
    expect(makeRow({ query_limit: 100 }).query_limit ?? '-').toBe(100);
    expect(makeRow({ query_limit: null }).query_limit ?? '-').toBe('-');
  });

  it('shows query_offset or dash', () => {
    expect(makeRow({ query_offset: 0 }).query_offset ?? '-').toBe(0);
    expect(makeRow({ query_offset: null }).query_offset ?? '-').toBe('-');
  });

  it('shows count_mode or dash', () => {
    expect(makeRow({ count_mode: 'exact' }).count_mode || '-').toBe('exact');
    expect(makeRow({ count_mode: null }).count_mode || '-').toBe('-');
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  SORTING / ORDERING
// ══════════════════════════════════════════════════════════════════════════

describe('Row ordering', () => {
  it('rows sorted by created_at desc', () => {
    const now = Date.now();
    const rows = [
      makeRow({ created_at: new Date(now - 3000).toISOString() }),
      makeRow({ created_at: new Date(now - 1000).toISOString() }),
      makeRow({ created_at: new Date(now - 2000).toISOString() }),
    ];
    const sorted = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
    expect(sorted[0].created_at).toBe(rows[1].created_at);
    expect(sorted[2].created_at).toBe(rows[0].created_at);
  });

  it('top offenders sorted by count desc', () => {
    const rows = [
      ...makeRows(1, { table_name: 'few' }),
      ...makeRows(10, { table_name: 'many' }),
      ...makeRows(5, { table_name: 'medium' }),
    ];
    const result = computeTopOffenders(rows);
    expect(result[0][0]).toBe('many');
    expect(result[1][0]).toBe('medium');
    expect(result[2][0]).toBe('few');
  });
});
