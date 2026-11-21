import { CRONOGRAMA_OFICIAL } from '@/lib/reforma-tributaria/cronograma-oficial';

export interface AliquotasTransicao {
  ano: number;
  cbs: number;
  ibs: number;
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
  icmsResidual: linha.icmsResidual,
  issResidual: linha.issResidual,
  pisResidual: linha.pisResidual,
  cofinsResidual: linha.cofinsResidual,
}));
