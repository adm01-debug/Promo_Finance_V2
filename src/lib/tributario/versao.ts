/**
 * Versionamento do motor tributário.
 *
 * Toda simulação persistida grava a versão vigente. Quando o motor evolui
 * (novas tabelas, correções de alíquota, novos encargos), o snapshot antigo
 * permanece imutável e a UI consegue apontar divergência ("drift") entre o
 * resultado histórico e o recálculo atual.
 *
 * Regra de bump:
 * - MAJOR: mudança de contrato de `ParametrosSimulacao`/`ResultadoCenario`.
 * - MINOR: nova regra fiscal (ex.: CPP Anexo IV, FPAS/Terceiros).
 * - PATCH: correção de cálculo sem nova regra.
 */
export const VERSAO_MOTOR_TRIBUTARIO = '3.7.2' as const;

export type VersaoMotorTributario = typeof VERSAO_MOTOR_TRIBUTARIO;

/** Compara versões semânticas simples (x.y.z). Retorna -1, 0 ou 1. */
export function compararVersaoMotor(a: string, b: string): number {
  const parse = (v: string): number[] =>
    v
      .split('.')
      .map((p) => Number.parseInt(p, 10))
      .map((n) => (Number.isFinite(n) ? n : 0));
  const [pa, pb] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i += 1) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return da > db ? 1 : -1;
  }
  return 0;
}

/** True quando o snapshot foi gerado por uma versão anterior à corrente. */
export function versaoDesatualizada(versaoSnapshot: string | null | undefined): boolean {
  if (!versaoSnapshot) return true;
  return compararVersaoMotor(versaoSnapshot, VERSAO_MOTOR_TRIBUTARIO) < 0;
}
