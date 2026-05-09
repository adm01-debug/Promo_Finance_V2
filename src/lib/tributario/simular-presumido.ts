
import type { ParametrosSimulacao, ResultadoCenario } from './types';
import { simularPresumido as simularPresumidoShared } from './shared-logic';

export function simularPresumido(params: ParametrosSimulacao): ResultadoCenario {
  return simularPresumidoShared(params);
}
