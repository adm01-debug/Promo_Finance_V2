import { describe, it, expect } from 'vitest';

/**
 * Tests for the emitTelemetry logic used in the external-data edge function.
 * Since edge functions run in Deno, we replicate the core logic here for
 * comprehensive unit testing in the Vitest environment.
 */

// ── Replicated emitTelemetry severity logic ─────────────────────────────

const SLOW_THRESHOLD_MS = 3000;
const VERY_SLOW_THRESHOLD_MS = 8000;

interface TelemetryOpts {
  operation: string;
  table_name?: string;
  rpc_name?: string;
  duration_ms: number;
  record_count?: number;
  query_limit?: number;
  query_offset?: number;
  count_mode?: string;
  error_message?: string;
  user_id?: string;
}

function classifySeverity(opts: TelemetryOpts): string {
  if (opts.error_message) return 'error';
  if (opts.duration_ms >= VERY_SLOW_THRESHOLD_MS) return 'very_slow';
  if (opts.duration_ms >= SLOW_THRESHOLD_MS) return 'slow';
  return 'normal';
}

function shouldPersist(opts: TelemetryOpts): boolean {
  return classifySeverity(opts) !== 'normal';
}

function buildTelemetryRecord(opts: TelemetryOpts) {
  return {
    operation: opts.operation,
    table_name: opts.table_name || null,
    rpc_name: opts.rpc_name || null,
    duration_ms: opts.duration_ms,
    record_count: opts.record_count ?? null,
    query_limit: opts.query_limit ?? null,
    query_offset: opts.query_offset ?? null,
    count_mode: opts.count_mode ?? null,
    severity: classifySeverity(opts),
    error_message: opts.error_message || null,
    user_id: opts.user_id || null,
  };
}

// ══════════════════════════════════════════════════════════════════════════
//  SEVERITY CLASSIFICATION
// ══════════════════════════════════════════════════════════════════════════

describe('emitTelemetry: severity classification', () => {
  // Normal range
  it('0ms → normal', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 0 })).toBe('normal'));
  it('1ms → normal', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 1 })).toBe('normal'));
  it('100ms → normal', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 100 })).toBe('normal'));
  it('500ms → normal', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 500 })).toBe('normal'));
  it('1000ms → normal', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 1000 })).toBe('normal'));
  it('2000ms → normal', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 2000 })).toBe('normal'));
  it('2999ms → normal', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 2999 })).toBe('normal'));

  // Slow range
  it('3000ms → slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 3000 })).toBe('slow'));
  it('3001ms → slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 3001 })).toBe('slow'));
  it('4000ms → slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 4000 })).toBe('slow'));
  it('5000ms → slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 5000 })).toBe('slow'));
  it('6000ms → slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 6000 })).toBe('slow'));
  it('7000ms → slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 7000 })).toBe('slow'));
  it('7999ms → slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 7999 })).toBe('slow'));

  // Very slow range
  it('8000ms → very_slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 8000 })).toBe('very_slow'));
  it('8001ms → very_slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 8001 })).toBe('very_slow'));
  it('10000ms → very_slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 10000 })).toBe('very_slow'));
  it('30000ms → very_slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 30000 })).toBe('very_slow'));
  it('60000ms → very_slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 60000 })).toBe('very_slow'));
  it('999999ms → very_slow', () => expect(classifySeverity({ operation: 'SELECT', duration_ms: 999999 })).toBe('very_slow'));

  // Error always wins
  it('error overrides normal duration', () => {
    expect(classifySeverity({ operation: 'SELECT', duration_ms: 100, error_message: 'fail' })).toBe('error');
  });
  it('error overrides slow duration', () => {
    expect(classifySeverity({ operation: 'SELECT', duration_ms: 5000, error_message: 'timeout' })).toBe('error');
  });
  it('error overrides very_slow duration', () => {
    expect(classifySeverity({ operation: 'SELECT', duration_ms: 20000, error_message: 'crash' })).toBe('error');
  });
  it('empty string error_message → not error', () => {
    expect(classifySeverity({ operation: 'SELECT', duration_ms: 100, error_message: '' })).toBe('normal');
  });
  it('undefined error_message → not error', () => {
    expect(classifySeverity({ operation: 'SELECT', duration_ms: 100 })).toBe('normal');
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  PERSISTENCE DECISION (shouldPersist)
// ══════════════════════════════════════════════════════════════════════════

describe('emitTelemetry: shouldPersist', () => {
  it('does not persist normal queries (0ms)', () => expect(shouldPersist({ operation: 'SELECT', duration_ms: 0 })).toBe(false));
  it('does not persist normal queries (100ms)', () => expect(shouldPersist({ operation: 'SELECT', duration_ms: 100 })).toBe(false));
  it('does not persist normal queries (2999ms)', () => expect(shouldPersist({ operation: 'SELECT', duration_ms: 2999 })).toBe(false));
  it('persists slow queries (3000ms)', () => expect(shouldPersist({ operation: 'SELECT', duration_ms: 3000 })).toBe(true));
  it('persists slow queries (5000ms)', () => expect(shouldPersist({ operation: 'SELECT', duration_ms: 5000 })).toBe(true));
  it('persists very_slow queries (8000ms)', () => expect(shouldPersist({ operation: 'SELECT', duration_ms: 8000 })).toBe(true));
  it('persists very_slow queries (20000ms)', () => expect(shouldPersist({ operation: 'SELECT', duration_ms: 20000 })).toBe(true));
  it('persists error queries', () => expect(shouldPersist({ operation: 'SELECT', duration_ms: 50, error_message: 'fail' })).toBe(true));
  it('persists error even at 0ms', () => expect(shouldPersist({ operation: 'SELECT', duration_ms: 0, error_message: 'err' })).toBe(true));
  it('does not persist empty error + normal', () => expect(shouldPersist({ operation: 'SELECT', duration_ms: 100, error_message: '' })).toBe(false));
});

// ══════════════════════════════════════════════════════════════════════════
//  TELEMETRY RECORD BUILDING
// ══════════════════════════════════════════════════════════════════════════

describe('emitTelemetry: buildTelemetryRecord', () => {
  it('builds minimal record', () => {
    const r = buildTelemetryRecord({ operation: 'SELECT', duration_ms: 5000 });
    expect(r).toEqual({
      operation: 'SELECT',
      table_name: null,
      rpc_name: null,
      duration_ms: 5000,
      record_count: null,
      query_limit: null,
      query_offset: null,
      count_mode: null,
      severity: 'slow',
      error_message: null,
      user_id: null,
    });
  });

  it('builds full record', () => {
    const r = buildTelemetryRecord({
      operation: 'SELECT',
      table_name: 'companies (clientes)',
      duration_ms: 9000,
      record_count: 42,
      query_limit: 50,
      query_offset: 100,
      count_mode: 'exact',
      user_id: 'user-123',
    });
    expect(r.operation).toBe('SELECT');
    expect(r.table_name).toBe('companies (clientes)');
    expect(r.severity).toBe('very_slow');
    expect(r.record_count).toBe(42);
    expect(r.query_limit).toBe(50);
    expect(r.query_offset).toBe(100);
    expect(r.count_mode).toBe('exact');
    expect(r.user_id).toBe('user-123');
    expect(r.error_message).toBeNull();
  });

  it('builds error record', () => {
    const r = buildTelemetryRecord({
      operation: 'SELECT',
      duration_ms: 200,
      error_message: 'Connection refused',
    });
    expect(r.severity).toBe('error');
    expect(r.error_message).toBe('Connection refused');
  });

  it('null defaults for optional fields', () => {
    const r = buildTelemetryRecord({ operation: 'RPC', duration_ms: 4000 });
    expect(r.table_name).toBeNull();
    expect(r.rpc_name).toBeNull();
    expect(r.record_count).toBeNull();
    expect(r.query_limit).toBeNull();
    expect(r.query_offset).toBeNull();
    expect(r.count_mode).toBeNull();
    expect(r.user_id).toBeNull();
    expect(r.error_message).toBeNull();
  });

  it('preserves rpc_name', () => {
    const r = buildTelemetryRecord({ operation: 'RPC', rpc_name: 'get_dashboard', duration_ms: 3500 });
    expect(r.rpc_name).toBe('get_dashboard');
  });

  it('record_count of 0 is preserved', () => {
    const r = buildTelemetryRecord({ operation: 'SELECT', duration_ms: 3000, record_count: 0 });
    expect(r.record_count).toBe(0);
  });

  it('query_offset of 0 is preserved', () => {
    const r = buildTelemetryRecord({ operation: 'SELECT', duration_ms: 3000, query_offset: 0 });
    expect(r.query_offset).toBe(0);
  });

  it('query_limit of 200 (max)', () => {
    const r = buildTelemetryRecord({ operation: 'SELECT', duration_ms: 3000, query_limit: 200 });
    expect(r.query_limit).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  OPERATION TYPES
// ══════════════════════════════════════════════════════════════════════════

describe('emitTelemetry: operation types', () => {
  const ops = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'RPC', 'UPSERT'];
  
  it.each(ops)('classifies %s with slow duration as slow', (op) => {
    expect(classifySeverity({ operation: op, duration_ms: 5000 })).toBe('slow');
  });

  it.each(ops)('classifies %s with normal duration as normal', (op) => {
    expect(classifySeverity({ operation: op, duration_ms: 500 })).toBe('normal');
  });

  it.each(ops)('builds record for %s', (op) => {
    const r = buildTelemetryRecord({ operation: op, duration_ms: 3000 });
    expect(r.operation).toBe(op);
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  EDGE FUNCTION CONTEXT: external-data specific telemetry
// ══════════════════════════════════════════════════════════════════════════

describe('emitTelemetry: external-data integration scenarios', () => {
  it('clientes query success - fast', () => {
    const r = buildTelemetryRecord({
      operation: 'SELECT',
      table_name: 'companies (clientes)',
      duration_ms: 800,
      record_count: 25,
      query_limit: 50,
      query_offset: 0,
      count_mode: 'exact',
      user_id: 'user-abc',
    });
    expect(r.severity).toBe('normal');
    expect(shouldPersist({ ...r, duration_ms: 800 })).toBe(false);
  });

  it('clientes query success - slow', () => {
    const opts: TelemetryOpts = {
      operation: 'SELECT',
      table_name: 'companies (clientes)',
      duration_ms: 4500,
      record_count: 200,
      query_limit: 200,
      query_offset: 0,
      count_mode: 'exact',
      user_id: 'user-abc',
    };
    const r = buildTelemetryRecord(opts);
    expect(r.severity).toBe('slow');
    expect(shouldPersist(opts)).toBe(true);
  });

  it('fornecedores query success - very slow', () => {
    const opts: TelemetryOpts = {
      operation: 'SELECT',
      table_name: 'companies (fornecedores)',
      duration_ms: 12000,
      record_count: 150,
      query_limit: 200,
      query_offset: 0,
      count_mode: 'exact',
    };
    const r = buildTelemetryRecord(opts);
    expect(r.severity).toBe('very_slow');
    expect(shouldPersist(opts)).toBe(true);
  });

  it('query error - connection refused', () => {
    const opts: TelemetryOpts = {
      operation: 'SELECT',
      table_name: 'companies (clientes)',
      duration_ms: 100,
      error_message: 'FetchError: connection refused',
      user_id: 'user-xyz',
    };
    const r = buildTelemetryRecord(opts);
    expect(r.severity).toBe('error');
    expect(r.error_message).toBe('FetchError: connection refused');
    expect(shouldPersist(opts)).toBe(true);
  });

  it('query error - timeout', () => {
    const opts: TelemetryOpts = {
      operation: 'SELECT',
      table_name: 'companies (fornecedores)',
      duration_ms: 30000,
      error_message: 'AbortError: signal timed out',
    };
    expect(classifySeverity(opts)).toBe('error');
  });

  it('paginated query - page 3', () => {
    const r = buildTelemetryRecord({
      operation: 'SELECT',
      table_name: 'companies (clientes)',
      duration_ms: 3200,
      record_count: 50,
      query_limit: 50,
      query_offset: 100,
      count_mode: 'exact',
    });
    expect(r.query_offset).toBe(100);
    expect(r.query_limit).toBe(50);
    expect(r.severity).toBe('slow');
  });

  it('search query with results', () => {
    const r = buildTelemetryRecord({
      operation: 'SELECT',
      table_name: 'companies (clientes)',
      duration_ms: 1500,
      record_count: 3,
      query_limit: 50,
      query_offset: 0,
    });
    expect(r.severity).toBe('normal');
    expect(r.record_count).toBe(3);
  });

  it('search query with no results', () => {
    const r = buildTelemetryRecord({
      operation: 'SELECT',
      table_name: 'companies (clientes)',
      duration_ms: 900,
      record_count: 0,
      query_limit: 50,
      query_offset: 0,
    });
    expect(r.severity).toBe('normal');
    expect(r.record_count).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  BOUNDARY TESTS
// ══════════════════════════════════════════════════════════════════════════

describe('emitTelemetry: boundary values', () => {
  // Duration boundaries
  it('2999ms is last normal', () => expect(classifySeverity({ operation: 'S', duration_ms: 2999 })).toBe('normal'));
  it('3000ms is first slow', () => expect(classifySeverity({ operation: 'S', duration_ms: 3000 })).toBe('slow'));
  it('7999ms is last slow', () => expect(classifySeverity({ operation: 'S', duration_ms: 7999 })).toBe('slow'));
  it('8000ms is first very_slow', () => expect(classifySeverity({ operation: 'S', duration_ms: 8000 })).toBe('very_slow'));

  // Edge: negative duration
  it('negative duration → normal', () => expect(classifySeverity({ operation: 'S', duration_ms: -1 })).toBe('normal'));

  // Edge: extremely large duration
  it('MAX_SAFE_INTEGER duration → very_slow', () => {
    expect(classifySeverity({ operation: 'S', duration_ms: Number.MAX_SAFE_INTEGER })).toBe('very_slow');
  });

  // Error priority
  it('error at exactly 3000ms', () => {
    expect(classifySeverity({ operation: 'S', duration_ms: 3000, error_message: 'x' })).toBe('error');
  });
  it('error at exactly 8000ms', () => {
    expect(classifySeverity({ operation: 'S', duration_ms: 8000, error_message: 'x' })).toBe('error');
  });

  // Record count boundaries
  it('record_count 0', () => expect(buildTelemetryRecord({ operation: 'S', duration_ms: 3000, record_count: 0 }).record_count).toBe(0));
  it('record_count 1000', () => expect(buildTelemetryRecord({ operation: 'S', duration_ms: 3000, record_count: 1000 }).record_count).toBe(1000));
  it('record_count undefined → null', () => expect(buildTelemetryRecord({ operation: 'S', duration_ms: 3000 }).record_count).toBeNull());
});

// ══════════════════════════════════════════════════════════════════════════
//  STRESS / BATCH TESTS
// ══════════════════════════════════════════════════════════════════════════

describe('emitTelemetry: stress / batch classification', () => {
  it('classifies 1000 fast queries as normal', () => {
    for (let i = 0; i < 1000; i++) {
      expect(classifySeverity({ operation: 'SELECT', duration_ms: Math.floor(Math.random() * 3000) })).toBe('normal');
    }
  });

  it('classifies 500 slow queries correctly', () => {
    for (let i = 0; i < 500; i++) {
      const ms = 3000 + Math.floor(Math.random() * 5000);
      const sev = classifySeverity({ operation: 'SELECT', duration_ms: ms });
      if (ms >= 8000) expect(sev).toBe('very_slow');
      else expect(sev).toBe('slow');
    }
  });

  it('all error queries classified as error regardless of duration', () => {
    for (let i = 0; i < 200; i++) {
      const ms = Math.floor(Math.random() * 100000);
      expect(classifySeverity({ operation: 'SELECT', duration_ms: ms, error_message: `err-${i}` })).toBe('error');
    }
  });

  it('builds 500 records without throwing', () => {
    for (let i = 0; i < 500; i++) {
      const r = buildTelemetryRecord({
        operation: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'RPC'][i % 5],
        table_name: `table_${i % 10}`,
        duration_ms: i * 10,
        record_count: i,
        query_limit: 50,
        query_offset: i * 50,
      });
      expect(r.operation).toBeTruthy();
      expect(r.duration_ms).toBe(i * 10);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════
//  THRESHOLD CONSTANTS
// ══════════════════════════════════════════════════════════════════════════

describe('emitTelemetry: threshold constants', () => {
  it('SLOW_THRESHOLD_MS is 3000', () => expect(SLOW_THRESHOLD_MS).toBe(3000));
  it('VERY_SLOW_THRESHOLD_MS is 8000', () => expect(VERY_SLOW_THRESHOLD_MS).toBe(8000));
  it('VERY_SLOW > SLOW', () => expect(VERY_SLOW_THRESHOLD_MS).toBeGreaterThan(SLOW_THRESHOLD_MS));
});
