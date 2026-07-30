// REGIME MONOFÁSICO PIS/COFINS — API pública

export * from './types';
export { GRUPOS_MONOFASICOS, GRUPO_MONOFASICO_CATALOGO, GRUPOS_POR_CHAVE, ALIQUOTAS_REGIME_NORMAL, MESES_RECUPERACAO_RETROATIVA } from './grupos';
export {
  classificarNcmMonofasico,
  classificarNcmMonofasicoCanonico,
  definirOverrideMonofasico,
  resetarOverrideMonofasico,
  obterOverrideMonofasico,
  isNcmMonofasico,
  normalizarNcm,
} from './classificar';
export {
  aplicarOverlayMonofasico,
  descreverRejeicoesMonofasico,
  type ResultadoOverlayMonofasico,
} from './overlay-monofasico';
export {
  aliquotasRegimeNormal,
  calcularItemMonofasico,
  calcularMixMonofasico,
  calcularRecuperacaoRetroativa,
} from './calcular';
