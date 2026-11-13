// LOGICA TRIBUTARIA COMPARTILHADA

// Motor tributário dividido em módulos (max-lines); este arquivo é o barril público.
export * from './motor/base';
export * from './motor/simples';
export * from './motor/lucro';
// Helpers extraídos para módulos irmãos (modularização max-lines) e
// re-exportados daqui para preservar a superfície pública do módulo.
export * from './anexos';
export * from './parametros';
export * from './encargos-folha';
export * from './apuracao';
