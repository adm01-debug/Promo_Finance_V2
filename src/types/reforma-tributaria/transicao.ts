import { CRONOGRAMA_OFICIAL } from '@/lib/reforma-tributaria/cronograma-oficial';

export interface AliquotasTransicao {
  ano: number;
  cbs: number;
  ibs: number;
  /** Alíquota (% da base) do IBS estadual — 0,1% em 2026 (100% do IBS), metade de `ibs` a partir de 2027. */
  ibsUf: number;
  /** Alíquota (% da base) do IBS municipal — 0% em 2026, metade de `ibs` a partir de 2027. */
  ibsMun: number;
  icmsResidual: number;
  issResidual: number;
  pisResidual: number;
  cofinsResidual: number;
}

/**
 * Derivado de `CRONOGRAMA_OFICIAL` (fonte única — etapa 7 do plano de
 * conformidade RT). Não adicione valores aqui: edite
 * `src/lib/reforma-tributaria/cronograma-oficial.ts`.
 */
export const ALIQUOTAS_TRANSICAO: AliquotasTransicao[] = CRONOGRAMA_OFICIAL.map((linha) => ({
  ano: linha.ano,
  cbs: linha.cbs,
  ibs: linha.ibsUf + linha.ibsMun,
  ibsUf: linha.ibsUf,
  ibsMun: linha.ibsMun,
  icmsResidual: linha.icmsResidual,
  issResidual: linha.issResidual,
  pisResidual: linha.pisResidual,
  cofinsResidual: linha.cofinsResidual,
}));
