/**
 * Lógica pura de deduplicação de eventos para `useSavedFilterAlerts`.
 *
 * Existem duas defesas contra disparos duplicados:
 *
 * 1. **In-session (Set `seen`)**: evita re-processar o mesmo `row.id` quando
 *    o realtime entrega o evento mais de uma vez (reconexão, race etc).
 *    O Set vive na memória do hook e é zerado a cada refresh — por isso ele
 *    não basta sozinho.
 *
 * 2. **Cross-refresh (`last_seen_at` no banco)**: ao notificar, chamamos
 *    `markSeen` que persiste o timestamp da assinatura. Após um refresh,
 *    qualquer registro com `rowTs <= last_seen_at` é rejeitado, eliminando
 *    o re-disparo de eventos antigos mesmo com o Set vazio.
 *
 * Extraído como helper puro para permitir testes determinísticos sem precisar
 * montar todo o pipeline de realtime/React Query.
 */

export interface DedupCheckInput {
  /** ID estável do registro (`anomalias_detectadas.id`, etc.). */
  rowId: string;
  /** Timestamp do evento (ISO ou ms). */
  rowTimestamp: string | number;
  /**
   * Marca de "visto até" da assinatura — qualquer evento com timestamp
   * menor ou igual já foi processado em sessão anterior.
   */
  lastSeenAt: string | number;
  /** Conjunto in-memory de IDs já tratados nesta sessão. */
  seen: Set<string>;
}

export type DedupReason = "duplicate_in_session" | "older_than_last_seen" | null;

export interface DedupCheckResult {
  /** True quando o evento deve gerar notificação. */
  shouldDispatch: boolean;
  /** Motivo da rejeição (null quando aceita) — útil para logs/auditoria. */
  reason: DedupReason;
}

/**
 * Decide se um evento de realtime deve gerar notificação para uma assinatura.
 * **Não** muta o Set `seen` — chamador é responsável por adicionar o `rowId`
 * após despachar com sucesso. Isso permite que o teste use a função em modo
 * "dry run" e inspecione decisões sem efeitos colaterais.
 */
export function checkShouldDispatch(input: DedupCheckInput): DedupCheckResult {
  if (input.seen.has(input.rowId)) {
    return { shouldDispatch: false, reason: "duplicate_in_session" };
  }
  const rowTs =
    typeof input.rowTimestamp === "number"
      ? input.rowTimestamp
      : new Date(input.rowTimestamp).getTime();
  const seenTs =
    typeof input.lastSeenAt === "number"
      ? input.lastSeenAt
      : new Date(input.lastSeenAt).getTime();
  if (Number.isFinite(rowTs) && Number.isFinite(seenTs) && rowTs <= seenTs) {
    return { shouldDispatch: false, reason: "older_than_last_seen" };
  }
  return { shouldDispatch: true, reason: null };
}

/**
 * Clamp defensivo dos parâmetros anti-spam — espelha o trigger
 * `validate_saved_filter_subscription_rules` no banco. Centralizado para
 * evitar que UI envie payload que o banco vai rejeitar.
 */
export function clampRateLimit(input: {
  max?: number | null;
  windowMin?: number | null;
}): { max: number; windowMin: number } {
  // Distingue ausência (null/undefined/NaN) de 0 — apenas o primeiro caso
  // recebe o default; 0 é valor explícito que deve ser clampado para o
  // mínimo permitido (1), espelhando o trigger do banco.
  const rawMax = Number(input.max);
  const rawWin = Number(input.windowMin);
  const max = Math.min(
    100,
    Math.max(1, Math.round(Number.isFinite(rawMax) ? rawMax : 5)),
  );
  const windowMin = Math.min(
    1440,
    Math.max(1, Math.round(Number.isFinite(rawWin) ? rawWin : 10)),
  );
  return { max, windowMin };
}
