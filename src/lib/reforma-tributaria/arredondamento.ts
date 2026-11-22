/**
 * Política de arredondamento RT — ABNT NBR 5891 / NT 2025.002 v1.51+
 *
 * Regras:
 * - Base de cálculo: 2 casas decimais
 * - Alíquota efetiva: 4 casas decimais
 * - Resultado tributário: 2 casas decimais (uma única operação)
 * - Empate (x.5): arredonda para o par mais próximo (banker's rounding)
 */

/**
 * Arredonda para N casas decimais com banker's rounding (ABNT NBR 5891).
 *
 * Usa aritmética inteira para evitar falsos empates por representação binária:
 * multiplica por fator×10 → arredonda para inteiro → extrai resto10 (0-9).
 * Comparação `resto10 === 5` é inteira — sem tolerância float necessária.
 *
 * Exemplo: 5792.945 × 100 × 10 = 5792945 (inteiro exato via Math.round);
 * resto10 = 5; inteiro = 579294; par? → trunca → 579294 / 100 = 5792.94 ✓
 */
export function arredondar(valor: number, casas = 2): number {
  const fator = Math.pow(10, casas);
  // Aritmética inteira a 10× a precisão-alvo evita falsos empates por float binário.
  const valorShift10 = Math.round(valor * fator * 10);
  const resto10 = ((valorShift10 % 10) + 10) % 10; // 0-9, correto p/ negativos
  const inteiro = (valorShift10 - resto10) / 10; // truncado na precisão alvo

  // Empate exato (x.5): arredonda para par (banker's rounding)
  if (resto10 === 5) {
    return (inteiro % 2 === 0 ? inteiro : inteiro + 1) / fator;
  }
  return (resto10 < 5 ? inteiro : inteiro + 1) / fator;
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
