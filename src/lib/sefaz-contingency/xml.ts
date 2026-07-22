import { TIPO_EMISSAO } from './constants';
import type { ContingencyMode, NFeData } from './types';

export function generateContingencyXml(
  _nfeData: NFeData,
  mode: ContingencyMode,
  chaveAcesso: string,
): string {
  const tpEmis = TIPO_EMISSAO[mode]?.code || '1';
  const dhCont = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00" Id="NFe${chaveAcesso}">
    <ide>
      <tpEmis>${tpEmis}</tpEmis>
      <dhCont>${dhCont}</dhCont>
      <xJust>Emissão em contingência - ${TIPO_EMISSAO[mode]?.description || 'Modo offline'}</xJust>
      <!-- Demais campos da NF-e -->
    </ide>
    <!-- Conteúdo completo da NF-e em contingência -->
  </infNFe>
</NFe>`;
}
