
import type { ParametrosSimulacao, ResultadoCenario } from './types';
import { simularReal as simularRealShared } from './shared-logic';

export function simularReal(params: ParametrosSimulacao): ResultadoCenario {
  return simularRealShared(params);
}
