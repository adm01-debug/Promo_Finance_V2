/**
 * Política de arredondamento RT — ABNT NBR 5891 / NT 2025.002 v1.51+
 *
 * Regras:
 * - Base de cálculo: 2 casas decimais
 * - Alíquota efetiva: 4 casas decimais
 * - Resultado tributário: 2 casas decimais (uma única operação)
 * - Empate (x.5): arredonda para o par mais próximo (banker's rounding)
 */

/** Arredonda para N casas decimais com banker's rounding */
export function arredondar(valor: number, casas = 2): number {
  const fator = Math.pow(10, casas);
  const valorShift = valor * fator;
  const piso = Math.floor(valorShift);
  const resto = valorShift - piso;

  // Empate exato (x.5): arredonda para par
  if (Math.abs(resto - 0.5) < 1e-10) {
    return (piso % 2 === 0 ? piso : piso + 1) / fator;
  }
  return Math.round(valorShift) / fator;
}

/** Arredonda base de cálculo: 2 casas decimais */
export const arredondarBase = (v: number): number => arredondar(v, 2);

/** Arredonda alíquota efetiva: 4 casas decimais */
export const arredondarAliquota = (v: number): number => arredondar(v, 4);

/**
 * Calcula tributo com arredondamento oficial:
 * round2( round2(base) × round4(aliquota/100) )
 *
 * Uso: calcularComArredondamento(valorBase, 0.9) → CBS 2026
 */
export function calcularComArredondamento(base: number, aliquotaPercentual: number): number {
  const baseRound = arredondarBase(base);
  const aliqDecimal = arredondarAliquota(aliquotaPercentual / 100);
  return arredondar(baseRound * aliqDecimal, 2);
}
