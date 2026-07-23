// MOTOR CALCULADORA TRIBUTÁRIA — API pública

export * from './types';
export { calcularLucroReal } from './lucro-real';
export { calcularLucroPresumido } from './lucro-presumido';
export { calcularSimplesNacional } from './simples-nacional';
export { calcularReformaTributaria } from './reforma-tributaria';

import type { InputCalculadora, ResultadoCalculadora, ResultadoRegime } from './types';
import { calcularLucroReal } from './lucro-real';
import { calcularLucroPresumido } from './lucro-presumido';
import { calcularSimplesNacional } from './simples-nacional';
import { calcularReformaTributaria } from './reforma-tributaria';

export function calcularTodosRegimes(input: InputCalculadora): ResultadoCalculadora {
  const cenarios: ResultadoRegime[] = [];
  if (input.simples) cenarios.push(calcularSimplesNacional(input.simples));
  if (input.lucroPresumido) cenarios.push(calcularLucroPresumido(input.lucroPresumido));
  if (input.lucroReal) cenarios.push(calcularLucroReal(input.lucroReal));
  if (input.reforma) cenarios.push(calcularReformaTributaria(input.reforma));

  const elegiveis = cenarios.filter((c) => c.elegivel && c.regime !== 'reforma');
  const melhorCenario = elegiveis.length > 0
    ? elegiveis.reduce((a, b) => (a.totalAPagar <= b.totalAPagar ? a : b))
    : null;
  const piorCenario = elegiveis.length > 0
    ? elegiveis.reduce((a, b) => (a.totalAPagar >= b.totalAPagar ? a : b))
    : null;
  const economiaAnualVsPior = melhorCenario && piorCenario ? piorCenario.totalAPagar - melhorCenario.totalAPagar : 0;

  return {
    input,
    cenarios,
    melhorCenario,
    economiaAnualVsPior,
    geradoEm: new Date().toISOString(),
  };
}
