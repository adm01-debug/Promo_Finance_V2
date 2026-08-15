// ENCARGOS SOBRE A FOLHA (CPP patronal, RAT/FAP e Terceiros)
// Extraído de `shared-logic.ts` (modularização max-lines). Ciclo de tipo apenas.
import type { ParametrosSimulacao } from './shared-logic';

/**
 * Alíquota RAT/FAP aplicada à folha (fração). Limitada a 6% — teto legal do
 * RAT (3%) multiplicado pelo FAP máximo (2,0), conforme Lei 8.212/1991 e
 * Decreto 3.048/1999.
 */
export function ratFap(p: ParametrosSimulacao): number {
  return Math.min(0.06, Math.max(0, p.aliquotaRAT ?? 0.02));
}

/**
 * Contribuições a Terceiros (Sistema S / INCRA / Salário-Educação / SEBRAE).
 * Padrão 5,8% para o FPAS 507 (comércio/indústria/serviços em geral). Empresas
 * do Simples Nacional são isentas, por isso só se aplica a Presumido e Real.
 */
export function terceiros(p: ParametrosSimulacao): number {
  const base = p.aliquotaTerceiros ?? terceirosPorCnaeMotor(p);
  return Math.min(0.08, Math.max(0, base));
}

/**
 * Alíquota de Contribuições a Terceiros por divisão CNAE (fração).
 * Espelha `src/lib/tributario/folha/fpas-terceiros.ts` (validado por teste de
 * coerência). Divisões ausentes usam o padrão 5,8% (FPAS 507).
 */
export const TERCEIROS_POR_DIVISAO_CNAE: Readonly<Record<string, number>> = {
  '01': 0.052, '02': 0.052, '03': 0.052,
  '64': 0.052, '65': 0.052, '66': 0.052,
  '84': 0.025,
  '85': 0.027,
};

export const TERCEIROS_PADRAO = 0.058;

/** Divisão (2 primeiros dígitos) do CNAE, ou null quando inválido. */
export function divisaoCnaeMotor(cnae?: string | null): string | null {
  if (!cnae) return null;
  const digitos = String(cnae).replace(/\D/g, '');
  if (digitos.length < 2) return null;
  return digitos.slice(0, 2);
}

/**
 * Alíquota de terceiros aplicável: prioriza o valor explícito informado nos
 * parâmetros; na ausência, deriva do CNAE principal; por fim usa 5,8%.
 */
export function terceirosPorCnaeMotor(p: ParametrosSimulacao): number {
  const divisao = divisaoCnaeMotor(p.cnaePrincipal);
  if (!divisao) return TERCEIROS_PADRAO;
  return TERCEIROS_POR_DIVISAO_CNAE[divisao] ?? TERCEIROS_PADRAO;
}
