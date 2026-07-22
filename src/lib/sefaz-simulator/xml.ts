import type { NFEData } from './types';
import { getCodigoUF } from './utils';

export function gerarXMLAutorizado(
  dados: NFEData,
  chaveAcesso: string,
  protocolo: string,
): string {
  const dataRecebimento = new Date().toISOString();
  const docLen = dados.destinatario.cpfCnpj.replace(/\D/g, '').length;
  const tag = docLen === 11 ? 'CPF' : 'CNPJ';

  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
    <infNFe versao="4.00" Id="NFe${chaveAcesso}">
      <ide>
        <cUF>${getCodigoUF(dados.emitente.uf)}</cUF>
        <cNF>${chaveAcesso.slice(35, 43)}</cNF>
        <natOp>${dados.naturezaOperacao}</natOp>
        <mod>55</mod>
        <serie>${dados.serie}</serie>
        <nNF>${dados.numero}</nNF>
        <dhEmi>${new Date(dados.dataEmissao).toISOString()}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${chaveAcesso.slice(-1)}</cDV>
        <tpAmb>2</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
      </ide>
      <emit>
        <CNPJ>${dados.emitente.cnpj.replace(/\D/g, '')}</CNPJ>
        <xNome>${dados.emitente.razaoSocial}</xNome>
        <IE>${dados.emitente.inscricaoEstadual.replace(/\D/g, '')}</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <${tag}>${dados.destinatario.cpfCnpj.replace(/\D/g, '')}</${tag}>
        <xNome>${dados.destinatario.nome}</xNome>
        <indIEDest>9</indIEDest>
      </dest>
      ${dados.itens
        .map(
          (item, index) => `
      <det nItem="${index + 1}">
        <prod>
          <cProd>${item.codigo}</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>${item.descricao}</xProd>
          <NCM>${item.ncm.replace(/\D/g, '')}</NCM>
          <CFOP>${item.cfop}</CFOP>
          <uCom>UN</uCom>
          <qCom>${item.quantidade.toFixed(4)}</qCom>
          <vUnCom>${item.valorUnitario.toFixed(10)}</vUnCom>
          <vProd>${item.valorTotal.toFixed(2)}</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>${item.quantidade.toFixed(4)}</qTrib>
          <vUnTrib>${item.valorUnitario.toFixed(10)}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>${item.valorTotal.toFixed(2)}</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>${(item.valorTotal * 0.18).toFixed(2)}</vICMS>
            </ICMS00>
          </ICMS>
        </imposto>
      </det>`,
        )
        .join('')}
      <total>
        <ICMSTot>
          <vBC>${dados.valorTotal.toFixed(2)}</vBC>
          <vICMS>${(dados.valorTotal * 0.18).toFixed(2)}</vICMS>
          <vProd>${dados.valorTotal.toFixed(2)}</vProd>
          <vNF>${dados.valorTotal.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <pag>
        <detPag>
          <tPag>01</tPag>
          <vPag>${dados.valorTotal.toFixed(2)}</vPag>
        </detPag>
      </pag>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>2</tpAmb>
      <verAplic>SP_NFE_PL_008i2</verAplic>
      <chNFe>${chaveAcesso}</chNFe>
      <dhRecbto>${dataRecebimento}</dhRecbto>
      <nProt>${protocolo}</nProt>
      <digVal>BASE64_DIGEST_VALUE</digVal>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;
}
