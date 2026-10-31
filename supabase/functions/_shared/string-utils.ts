/**
 * Utilitários genéricos de string compartilhados entre edge functions.
 * Mantidos aqui para evitar duplicação: o mesmo helper existia inline em
 * ci-security-gate-log, mcp-query e n8n-callback.
 */

/**
 * Compara dois strings de forma timing-safe (sem curto-circuito) para evitar
 * ataques de timing em comparações de segredos/tokens.
 *
 * Usa TextEncoder para segurança Unicode: um único code point pode resultar
 * em múltiplos bytes em UTF-8, e a comparação byte-a-byte é o que protege.
 *
 * @param left  String a comparar (aceita null — tratado como string vazia).
 * @param right String de referência.
 */
export function timingSafeEqual(left: string | null, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left ?? '');
  const b = encoder.encode(right);
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}