/**
 * Correlation ID (Sprint 3.2 — auditoria sênior).
 *
 * Gera um `x-request-id` por interação de usuário e o propaga em breadcrumbs
 * de telemetria e headers de Edge Functions. O objetivo é permitir traçar uma
 * request individual do click no botão até o log da Edge Function e a query
 * SQL correspondente.
 *
 * Uso:
 *   import { getCorrelationId, newCorrelationId, withCorrelationHeader } from '@/lib/correlation-id';
 *
 *   const id = newCorrelationId('salvar-conta');       // por ação
 *   supabase.functions.invoke('...', {
 *     headers: withCorrelationHeader(id, extraHeaders),
 *   });
 */

const HEADER_NAME = 'x-request-id';
let currentId: string | null = null;

function generateId(prefix?: string): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}:${rnd}` : rnd;
}

/** Gera um novo correlation-id (e o define como atual) para a próxima ação. */
export function newCorrelationId(prefix?: string): string {
  currentId = generateId(prefix);
  return currentId;
}

/** Retorna o correlation-id atual, criando um novo se ainda não existir. */
export function getCorrelationId(): string {
  if (!currentId) currentId = generateId();
  return currentId;
}

/** Combina o correlation-id com outros headers para `functions.invoke`. */
export function withCorrelationHeader(
  id: string = getCorrelationId(),
  extras: Record<string, string> = {},
): Record<string, string> {
  return { [HEADER_NAME]: id, ...extras };
}

export const CORRELATION_HEADER = HEADER_NAME;
