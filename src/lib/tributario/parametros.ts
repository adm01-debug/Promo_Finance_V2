// COERCAO DEFENSIVA DE PARAMETROS DE SIMULACAO
// Extraído de `shared-logic.ts` (modularização max-lines). Ciclo de tipo apenas
// (import type é apagado na compilação): `sanitizarParametros` permanece em
// `shared-logic.ts` por causa do drift-guard com a Edge Function.
import type { ParametrosSimulacao } from './shared-logic';

/** Coerção segura de número: descarta NaN/Infinity/negativos indevidos. */
export function num(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Restringe um valor ao intervalo [min, max]. */
export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/**
 * Fração (0..1) da receita bruta destinada à exportação.
 *
 * A imunidade das exportações é objetiva e alcança PIS/COFINS
 * (CF/88 art. 149 §2º I), ICMS (art. 155 §2º X "a") e ISS
 * (art. 156 §3º II c/c LC 116/2003 art. 2º I). IRPJ e CSLL NÃO são
 * alcançados: o lucro da operação exportadora permanece tributável.
 */
export function fracaoExportacao(p: ParametrosSimulacao): number {
  const v = num(p.percentualExportacao, 0);
  return clamp(Number.isFinite(v) ? v : 0, 0, 100) / 100;
}
