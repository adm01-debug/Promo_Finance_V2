/**
 * Política de retry / backoff / circuit breaker do dispatcher DFe.
 *
 * Módulo puro — sem I/O — para permitir simulação determinística de milhares
 * de cenários (ver `policy_test.ts`).
 */

/** Intervalo base entre execuções bem-sucedidas (15 min). */
export const BASE_INTERVAL_MS = 15 * 60 * 1000;
/** Teto do backoff (4 h). */
export const MAX_BACKOFF_MS = 4 * 60 * 60 * 1000;
/** Falhas consecutivas que abrem o circuit breaker. */
export const CIRCUIT_OPEN_THRESHOLD = 8;
/** Falha reportada pelo puller inexistente (não incrementa retry). */
export const PULLER_MISSING_TAG = "puller-missing";

export interface CursorState {
  cnpj: string;
  retry_count: number;
  next_run_at: number; // epoch ms
  last_error_at: number | null;
  circuit_open: boolean;
  ultima_consulta: number | null;
}

export interface PullOutcome {
  kind: "success" | "failure";
  /** Se true, falha NÃO incrementa retry (ex.: puller ainda não deployado). */
  neutral?: boolean;
  errorTag?: string;
}

/**
 * Calcula backoff em ms para o número atual de tentativas.
 * min(15min * 2^retry, 4h). retry=0 → 15min, retry=1 → 30min, ..., retry=4+ → 4h.
 */
export function backoffMs(retryCount: number): number {
  if (retryCount <= 0) return BASE_INTERVAL_MS;
  const factor = 2 ** Math.min(retryCount, 20);
  return Math.min(BASE_INTERVAL_MS * factor, MAX_BACKOFF_MS);
}

/**
 * Aplica o resultado de uma execução ao cursor e retorna o novo estado.
 * Estado de entrada NÃO é mutado.
 */
export function applyOutcome(
  cursor: CursorState,
  outcome: PullOutcome,
  now: number,
): CursorState {
  if (outcome.kind === "success") {
    return {
      ...cursor,
      retry_count: 0,
      next_run_at: now + BASE_INTERVAL_MS,
      last_error_at: cursor.last_error_at,
      circuit_open: false,
      ultima_consulta: now,
    };
  }

  // Falha neutra: só marca consulta, não penaliza o CNPJ.
  if (outcome.neutral) {
    return { ...cursor, ultima_consulta: now };
  }

  const retry = cursor.retry_count + 1;
  const shouldOpen = retry >= CIRCUIT_OPEN_THRESHOLD;
  return {
    ...cursor,
    retry_count: retry,
    next_run_at: now + backoffMs(retry),
    last_error_at: now,
    circuit_open: shouldOpen,
    ultima_consulta: now,
  };
}

/** Decide se um CNPJ é elegível para execução no instante `now`. */
export function isEligible(cursor: CursorState, now: number): boolean {
  if (cursor.circuit_open) return false;
  if (cursor.next_run_at > now) return false;
  return true;
}
