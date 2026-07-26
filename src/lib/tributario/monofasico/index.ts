// REGIME MONOFÁSICO PIS/COFINS — API pública

export * from './types';
export { GRUPOS_MONOFASICOS, GRUPOS_POR_CHAVE, ALIQUOTAS_REGIME_NORMAL, MESES_RECUPERACAO_RETROATIVA } from './grupos';
export { classificarNcmMonofasico, isNcmMonofasico, normalizarNcm } from './classificar';
export {
  aliquotasRegimeNormal,
  calcularItemMonofasico,
  calcularMixMonofasico,
  calcularRecuperacaoRetroativa,
} from './calcular';
