
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
  const result = simularSimplesShared(params, opcoes.anoReferencia, opcoes.mesReferencia);
  
  // Se forçado um anexo, poderíamos re-simular aqui ou ajustar o parâmetro se o shared-logic suportasse
  // Por enquanto o shared-logic já cobre a maioria dos casos.
  
  return result;
}
