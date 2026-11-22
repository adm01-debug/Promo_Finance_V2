import { describe, it, expect } from 'vitest';
import { parseItemIbscbs, parseItemIs, parseIbscbsTotais } from '../parse-ibscbs';

const XML_SEM_IBSCBS = `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe><infNFe>
  <det nItem="1"><prod><cProd>P1</cProd><xProd>PRODUTO</xProd><NCM>12345678</NCM><CFOP>5102</CFOP><qCom>1.0000</qCom><vUnCom>100.00</vUnCom><vProd>100.00</vProd></prod>
    <imposto><ICMS><ICMS00><orig>0</orig><CST>00</CST><vBC>100.00</vBC><vICMS>18.00</vICMS></ICMS00></ICMS></imposto>
  </det>
  <total><ICMSTot><vNF>100.00</vNF><vProd>100.00</vProd><vBC>100.00</vBC><vICMS>18.00</vICMS></ICMSTot></total>
</infNFe></NFe></nfeProc>`;

const XML_IBSCBS = `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe><infNFe>
  <det nItem="1"><prod><cProd>P1</cProd><xProd>PRODUTO</xProd><NCM>12345678</NCM><CFOP>5102</CFOP><qCom>1.0000</qCom><vUnCom>100.00</vUnCom><vProd>100.00</vProd></prod>
    <imposto>
      <IS><CSTIS>200</CSTIS><cClassTribIS>000123</cClassTribIS><vBCIS>100.00</vBCIS><pIS>1.00</pIS><pISEspec>0.50</pISEspec><uTrib>UN</uTrib><qTrib>100.0000</qTrib><vIS>1.00</vIS></IS>
      <IBSCBS><CST>200</CST><cClassTrib>000123</cClassTrib>
        <gIBSCBS><vBC>100.00</vBC>
          <gIBSUF><pIBSUF>11.30</pIBSUF><gRed><pRedAliq>50.00</pRedAliq><pAliqEfet>5.65</pAliqEfet></gRed><vIBSUF>5.65</vIBSUF></gIBSUF>
          <gIBSMun><pIBSMun>5.00</pIBSMun><gRed><pRedAliq>30.00</pRedAliq><pAliqEfet>3.50</pAliqEfet></gRed><vIBSMun>5.00</vIBSMun></gIBSMun>
          <gCBS><pCBS>9.00</pCBS><gRed><pRedAliq>10.00</pRedAliq><pAliqEfet>8.10</pAliqEfet></gRed><vCBS>9.00</vCBS></gCBS>
          <vIBS>10.65</vIBS>
        </gIBSCBS>
      </IBSCBS>
    </imposto>
  </det>
  <total><ICMSTot><vNF>100.00</vNF><vProd>100.00</vProd><vBC>100.00</vBC><vICMS>18.00</vICMS></ICMSTot>
    <IBSCBSTot><vBCIBSCBS>100.00</vBCIBSCBS>
      <gIBS><gIBSUF><vIBSUF>5.65</vIBSUF></gIBSUF><gIBSMun><vIBSMun>5.00</vIBSMun></gIBSMun><vIBS>10.65</vIBS></gIBS>
      <gCBS><vCBS>9.00</vCBS></gCBS>
    </IBSCBSTot>
    <ISTot><vIS>1.00</vIS></ISTot>
  </total>
</infNFe></NFe></nfeProc>`;

function docDe(xml: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'application/xml');
}

describe('parse-ibscbs (etapa 41)', () => {
  it('retorna undefined para item sem grupo IBSCBS', () => {
    const doc = docDe(XML_SEM_IBSCBS);
    const det = doc.querySelector('det') as Element;
    expect(parseItemIbscbs(det)).toBeUndefined();
    expect(parseItemIs(det)).toBeUndefined();
  });

  it('lê o grupo IBSCBS do item com percentuais convertidos para fração', () => {
    const doc = docDe(XML_IBSCBS);
    const grupo = parseItemIbscbs(doc.querySelector('det') as Element);
    expect(grupo).toBeDefined();
    expect(grupo?.cst).toBe('200');
    expect(grupo?.cClassTrib).toBe('000123');
    expect(grupo?.vBC).toBeCloseTo(100.0, 6);
    expect(grupo?.pIBSUF).toBeCloseTo(0.113, 6);
    expect(grupo?.vIBSUF).toBeCloseTo(5.65, 6);
    expect(grupo?.pIBSMun).toBeCloseTo(0.05, 6);
    expect(grupo?.vIBSMun).toBeCloseTo(5.0, 6);
    expect(grupo?.pCBS).toBeCloseTo(0.09, 6);
    expect(grupo?.vCBS).toBeCloseTo(9.0, 6);
    expect(grupo?.vIBS).toBeCloseTo(10.65, 6);
    // Cada tributo tem o seu gRed (leiaute TCIBS): os três devem ser preservados.
    expect(grupo?.gRedUF?.pRedAliq).toBeCloseTo(0.5, 6);
    expect(grupo?.gRedUF?.pAliqEfet).toBeCloseTo(0.0565, 6);
    expect(grupo?.gRedMun?.pRedAliq).toBeCloseTo(0.3, 6);
    expect(grupo?.gRedMun?.pAliqEfet).toBeCloseTo(0.035, 6);
    expect(grupo?.gRedCBS?.pRedAliq).toBeCloseTo(0.1, 6);
    expect(grupo?.gRedCBS?.pAliqEfet).toBeCloseTo(0.081, 6);
  });

  it('lê o grupo IS do item', () => {
    const doc = docDe(XML_IBSCBS);
    const is = parseItemIs(doc.querySelector('det') as Element);
    expect(is).toBeDefined();
    expect(is?.cstIs).toBe('200');
    expect(is?.cClassTribIs).toBe('000123');
    expect(is?.vBCIs).toBeCloseTo(100.0, 6);
    expect(is?.pIs).toBeCloseTo(0.01, 6);
    expect(is?.vIs).toBeCloseTo(1.0, 6);
    // pISEspec é alíquota por valor (R$/unidade): NÃO é percentual, não divide por 100.
    expect(is?.pIsEspec).toBeCloseTo(0.5, 6);
    expect(is?.uTrib).toBe('UN');
    expect(is?.qTrib).toBeCloseTo(100.0, 6);
  });

  it('lê os totais de IBSCBS e IS da nota', () => {
    const doc = docDe(XML_IBSCBS);
    const totais = parseIbscbsTotais(doc.querySelector('infNFe') as Element);
    expect(totais.vBCIBSCBS).toBeCloseTo(100.0, 6);
    expect(totais.vIBS).toBeCloseTo(10.65, 6);
    expect(totais.vCBS).toBeCloseTo(9.0, 6);
    expect(totais.vIBS_UF).toBeCloseTo(5.65, 6);
    expect(totais.vIBS_Mun).toBeCloseTo(5.0, 6);
    expect(totais.vIS).toBeCloseTo(1.0, 6);
  });

  it('retorna totais vazios quando a nota não tem IBSCBSTot/ISTot', () => {
    const doc = docDe(XML_SEM_IBSCBS);
    const totais = parseIbscbsTotais(doc.querySelector('infNFe') as Element);
    expect(totais.vBCIBSCBS).toBeUndefined();
    expect(totais.vIBS).toBeUndefined();
    expect(totais.vIS).toBeUndefined();
  });

  it('preserva gRed isolado de um único tributo sem inventar os demais', () => {
    const xml = XML_IBSCBS.replace(
      '<gIBSMun><pIBSMun>5.00</pIBSMun><gRed><pRedAliq>30.00</pRedAliq><pAliqEfet>3.50</pAliqEfet></gRed><vIBSMun>5.00</vIBSMun></gIBSMun>',
      '<gIBSMun><pIBSMun>5.00</pIBSMun><vIBSMun>5.00</vIBSMun></gIBSMun>'
    ).replace(
      '<gCBS><pCBS>9.00</pCBS><gRed><pRedAliq>10.00</pRedAliq><pAliqEfet>8.10</pAliqEfet></gRed><vCBS>9.00</vCBS></gCBS>',
      '<gCBS><pCBS>9.00</pCBS><vCBS>9.00</vCBS></gCBS>'
    );
    const grupo = parseItemIbscbs(docDe(xml).querySelector('det') as Element);
    expect(grupo?.gRedUF?.pRedAliq).toBeCloseTo(0.5, 6);
    expect(grupo?.gRedMun).toBeUndefined();
    expect(grupo?.gRedCBS).toBeUndefined();
  });

  it('não cria gRed quando o grupo não traz nenhum dos dois campos', () => {
    const xml = XML_IBSCBS.replace(
      '<gRed><pRedAliq>50.00</pRedAliq><pAliqEfet>5.65</pAliqEfet></gRed>',
      '<gRed></gRed>'
    );
    const grupo = parseItemIbscbs(docDe(xml).querySelector('det') as Element);
    expect(grupo?.gRedUF).toBeUndefined();
  });
});
