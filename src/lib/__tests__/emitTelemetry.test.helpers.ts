import type { TelemetryOpts } from './emitTelemetry.test.types';

/**
 * Tests for the emitTelemetry logic used in the external-data edge function.
 * Since edge functions run in Deno, we replicate the core logic here for
 * comprehensive unit testing in the Vitest environment.
 */

// ── Replicated emitTelemetry severity logic ─────────────────────────────

export const SLOW_THRESHOLD_MS = 3000;

export const VERY_SLOW_THRESHOLD_MS = 8000;

export function classifySeverity(opts: TelemetryOpts): string {
  if (opts.error_message) return 'error';
  if (opts.duration_ms >= VERY_SLOW_THRESHOLD_MS) return 'very_slow';
  if (opts.duration_ms >= SLOW_THRESHOLD_MS) return 'slow';
  return 'normal';
}

export function shouldPersist(opts: TelemetryOpts): boolean {
  return classifySeverity(opts) !== 'normal';
}

export function buildTelemetryRecord(opts: TelemetryOpts) {
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
