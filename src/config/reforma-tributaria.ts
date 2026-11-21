/**
 * src/config/reforma-tributaria.ts — parâmetros de referência da Reforma
 * Tributária que a lei ainda não fixou em valor definitivo.
 *
 * `REF_CBS_2027`: o Senado define a alíquota de referência da CBS até
 * 15/12/2026 (ADCT, EC 132/2023). O TCU calculou e publicou 11,3% como
 * metodologia de referência (processo TC 006.529/2026-7) — não é a alíquota
 * legal final. Ver docs/receitafederal/FONTES_NORMATIVAS.md.
 *
 * `REF_IBS`: não há fonte oficial única confirmada nesta sessão (ver
 * discrepância registrada em docs/receitafederal/FONTES_NORMATIVAS.md).
 * Mantido como estimativa herdada até a Resolução do Senado publicar o
 * valor.
 *
 * Ambos são sobrescrevíveis por env para re-simular sem redeploy de código
 * quando o valor legal for publicado (ADR-003, risco "Senado fixa CBS ≠
 * 11,3%").
 */

function overrideNumerico(env: string | undefined, padrao: number): number {
  if (!env) return padrao;
  const parsed = Number(env);
  return Number.isFinite(parsed) ? parsed : padrao;
}

/** % CBS plena a partir de 2027 — origem: simulado (TCU, pendente do Senado). */
export const REF_CBS_2027 = overrideNumerico(import.meta.env.VITE_RT_REF_CBS, 11.3);

/** % IBS plena em 2033 (soma UF+Mun) — origem: simulado, sem fonte confirmada. */
export const REF_IBS = overrideNumerico(import.meta.env.VITE_RT_REF_IBS, 17.7);
