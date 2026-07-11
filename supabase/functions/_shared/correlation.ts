/**
 * Correlation ID helper para Edge Functions (Sprint 3.2 — auditoria sênior).
 *
 * Lê o header `x-request-id` propagado pelo client Supabase e o expõe para
 * uso em logs estruturados e/ou `SET LOCAL app.request_id` em queries SQL.
 *
 * Gera um id efêmero quando ausente (webhooks externos, chamadas curl).
 */

export const CORRELATION_HEADER = 'x-request-id';

export function getRequestId(req: Request): string {
  const fromHeader = req.headers.get(CORRELATION_HEADER);
  if (fromHeader && fromHeader.length <= 200) return fromHeader;
  return `srv:${crypto.randomUUID()}`;
}

/** Retorna headers de resposta ecoando o request-id — útil para debug. */
export function correlationResponseHeaders(requestId: string): Record<string, string> {
  return { [CORRELATION_HEADER]: requestId };
}
