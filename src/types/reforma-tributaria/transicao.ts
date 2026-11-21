import { CRONOGRAMA_OFICIAL } from '@/lib/reforma-tributaria/cronograma-oficial';

export interface AliquotasTransicao {
  ano: number;
  cbs: number;
  ibs: number;
  /** Fração do IBS devida ao estado — varia por ano (100% em 2026, 50/50 a partir de 2027). */
  ibsUf: number;
  /** Fração do IBS devida ao município — 0% em 2026, 50/50 a partir de 2027. */
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
