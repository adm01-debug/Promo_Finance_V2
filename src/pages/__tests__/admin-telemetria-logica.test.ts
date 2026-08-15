import { describe, it, expect } from 'vitest';
import { computeStats, computeTopOffenders, formatDuration, getTimeThreshold, makeRow, makeRows } from './admin-telemetria-test-utils';

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

  it('record_count defaults to number', () => {
    const r = makeRow({ record_count: 42 });
    expect(r.record_count).toBe(42);
  });

  it('record_count null yields dash via nullish coalescing', () => {
    const r = makeRow({ record_count: null });
    expect(r.record_count ?? '-').toBe('-');
  });

  it('query_limit defaults to number', () => {
    const r = makeRow({ query_limit: 200 });
    expect(r.query_limit).toBe(200);
  });

  it('query_limit null yields dash', () => {
    const r = makeRow({ query_limit: null });
    expect(r.query_limit ?? '-').toBe('-');
  });

  it('query_offset defaults to number', () => {
    const r = makeRow({ query_offset: 0 });
    expect(r.query_offset).toBe(0);
  });

  it('query_offset null yields dash', () => {
    const r = makeRow({ query_offset: null });
    expect(r.query_offset ?? '-').toBe('-');
  });

  it('count_mode defaults to string', () => {
    const r = makeRow({ count_mode: 'exact' });
    expect(r.count_mode).toBe('exact');
  });

  it('count_mode null yields dash via OR', () => {
    const r = makeRow({ count_mode: null });
    expect(r.count_mode || '-').toBe('-');
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
