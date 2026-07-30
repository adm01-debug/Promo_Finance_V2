// CALCULADORA DE TRIBUTOS - REFORMA TRIBUTÁRIA
// Barrel: mantém compatibilidade da API pública após modularização.

export type {
  DadosOperacao,
  ResultadoCalculo,
  DadosCredito,
  ResultadoCredito,
  DadosSimulacao,
  ResultadoSimulacao,
} from './reforma-tributaria/types';

export {
  determinarFaseTransicao,
  obterAliquotasTransicao,
  aplicarRegimeEspecial,
  obterAliquotaIS,
  verificarIsencao,
} from './reforma-tributaria/regras';

export { calcularTributosReforma } from './reforma-tributaria/calcular-tributos';
export { calcularCreditos } from './reforma-tributaria/creditos';
export { simularComparativo } from './reforma-tributaria/simulador';
