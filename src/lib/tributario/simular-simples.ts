
import type { ParametrosSimulacao, ResultadoCenario, AnexoSimples } from './types';
import { simularSimples as simularSimplesShared } from './shared-logic';

export interface OpcoesSimples {
  anoReferencia: number;
  mesReferencia: number;
  forcarAnexo?: AnexoSimples;
}

/**
 * Simula carga tributária no Simples Nacional usando a lógica compartilhada.
 */
export function simularSimples(
  params: ParametrosSimulacao,
  opcoes: OpcoesSimples,
): ResultadoCenario {
  return simularSimplesShared(
    params,
    opcoes.anoReferencia,
    opcoes.mesReferencia,
    opcoes.forcarAnexo,
  );
}
