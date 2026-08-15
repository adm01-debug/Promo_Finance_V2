import { describe, it, expect } from 'vitest';
import { computeStats, computeTopOffenders, formatDuration, formatTime, getTimeThreshold, makeRow, makeRows } from './admin-telemetria-test-utils';

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
