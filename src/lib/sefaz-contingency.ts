// Barrel de compatibilidade — API pública preservada via re-exports.
// Implementação decomposta em src/lib/sefaz-contingency/*.
export * from './sefaz-contingency/types';
export {
  TIPO_EMISSAO,
  MOTIVOS_CONTINGENCIA,
} from './sefaz-contingency/constants';
export {
  getContingencyState,
  getSefazHealthStatus,
  updateSefazHealthStatus,
} from './sefaz-contingency/storage';
export {
  activateContingency,
  deactivateContingency,
  registerCommunicationFailure,
  registerCommunicationSuccess,
  addPendingNFe,
  updatePendingNFe,
  removePendingNFe,
  checkSefazHealth,
  getContingencyStats,
} from './sefaz-contingency/state';
export {
  getAutoContingencyConfig,
  saveAutoContingencyConfig,
  addContingencyRule,
  updateContingencyRule,
  deleteContingencyRule,
  evaluateContingencyRules,
  shouldAutoDeactivate,
  runAutoContingencyCheck,
} from './sefaz-contingency/rules';
export { generateContingencyXml } from './sefaz-contingency/xml';
