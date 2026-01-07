// Simulador realista da SEFAZ para desenvolvimento/testes
// Simula delays, validações e respostas autênticas do webservice

import { logger } from '@/lib/logger';
export interface SefazRequest {
  tipo: 'autorizacao' | 'consulta' | 'cancelamento' | 'inutilizacao';
  xml?: string;
  chaveAcesso?: string;
  protocolo?: string;
  justificativa?: string;
  nfeData?: NFEData;
  inutilizacao?: {
    cnpj: string;
    serie: string;
    numeroInicial: number;
    numeroFinal: number;
    justificativa: string;
    ano: string;
  };
}

export interface NFEData {
  numero: number;
  serie: number;
  naturezaOperacao: string;
  dataEmissao: Date;
  emitente: {
    cnpj: string;
    razaoSocial: string;
    inscricaoEstadual: string;
    uf: string;
  };
  destinatario: {
    cpfCnpj: string;
    nome: string;
    endereco?: string;
  };
  itens: Array<{
    codigo: string;
    descricao: string;
    ncm: string;
    cfop: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }>;
  valorTotal: number;
}

export interface SefazResponse {
  success: boolean;
  cStat: string;
  xMotivo: string;
  chaveAcesso?: string;
  protocolo?: string;
  dataRecebimento?: string;
  numeroRecibo?: string;
  xml?: string;
  errors?: string[];
}

// Códigos de status reais da SEFAZ
const SEFAZ_STATUS = {
  // Autorização
  '100': 'Autorizado o uso da NF-e',
  '101': 'Cancelamento de NF-e homologado',
  '102': 'Inutilização de número homologado',
  '103': 'Lote recebido com sucesso',
  '104': 'Lote processado',
  '105': 'Lote em processamento',
  '106': 'Lote não localizado',
  
  // Rejeições comuns
  '204': 'Duplicidade de NF-e',
  '205': 'NF-e está denegada na base de dados da SEFAZ',
  '206': 'NF-e já está inutilizada na base de dados da SEFAZ',
  '207': 'CNPJ do emitente inválido',
  '208': 'CNPJ do destinatário inválido',
  '209': 'IE do emitente inválida',
  '210': 'IE do destinatário inválida',
  '225': 'Falha no Schema XML da NF-e',
  '226': 'Código da UF do emitente diverge da UF autorizadora',
  '227': 'Erro na Chave de Acesso - Campo Id - falta a literal NFe',
  '228': 'Data de emissão muito atrasada',
  '233': 'CNPJ do destinatário não informado',
  '234': 'Informação do destinatário insuficiente',
  '301': 'Uso Denegado: Irregularidade fiscal do emitente',
  '302': 'Uso Denegado: Irregularidade fiscal do destinatário',
  '539': 'Duplicidade de NF-e, com diferença na Chave de Acesso',
  '593': 'Chave de acesso inválida',
  '999': 'Erro não catalogado',
};

// Gera chave de acesso NFe (44 dígitos)
function gerarChaveAcesso(dados: NFEData): string {
  const uf = getCodigoUF(dados.emitente.uf);
  const dataEmissao = new Date(dados.dataEmissao);
  const aamm = `${String(dataEmissao.getFullYear()).slice(2)}${String(dataEmissao.getMonth() + 1).padStart(2, '0')}`;
  const cnpj = dados.emitente.cnpj.replace(/\D/g, '');
  const mod = '55'; // NFe
  const serie = String(dados.serie).padStart(3, '0');
  const numero = String(dados.numero).padStart(9, '0');
  const tpEmis = '1'; // Normal
  const cNF = String(Math.floor(Math.random() * 99999999)).padStart(8, '0');
  
  const chaveBase = `${uf}${aamm}${cnpj}${mod}${serie}${numero}${tpEmis}${cNF}`;
  const dv = calcularDV(chaveBase);
  
  return `${chaveBase}${dv}`;
}

function getCodigoUF(uf: string): string {
  const ufs: Record<string, string> = {
    'AC': '12', 'AL': '27', 'AM': '13', 'AP': '16', 'BA': '29',
    'CE': '23', 'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21',
    'MG': '31', 'MS': '50', 'MT': '51', 'PA': '15', 'PB': '25',
    'PE': '26', 'PI': '22', 'PR': '41', 'RJ': '33', 'RN': '24',
    'RO': '11', 'RR': '14', 'RS': '43', 'SC': '42', 'SE': '28',
    'SP': '35', 'TO': '17'
  };
  return ufs[uf] || '35';
}

function calcularDV(chave: string): string {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  let pesoIndex = 0;
  
  for (let i = chave.length - 1; i >= 0; i--) {
    soma += parseInt(chave[i]) * pesos[pesoIndex % 8];
    pesoIndex++;
  }
  
  const resto = soma % 11;
  return resto < 2 ? '0' : String(11 - resto);
}

// Gera protocolo de autorização
function gerarProtocolo(uf: string): string {
  const codigoUF = getCodigoUF(uf);
  const ano = new Date().getFullYear().toString().slice(2);
  const sequencial = String(Math.floor(Math.random() * 9999999999)).padStart(10, '0');
  return `${codigoUF}${ano}${sequencial}`;
}

// Gera número de recibo
function gerarRecibo(uf: string): string {
  const codigoUF = getCodigoUF(uf);
  const sequencial = String(Math.floor(Math.random() * 999999999999999)).padStart(15, '0');
  return `${codigoUF}${sequencial}`;
}

// Valida dados da NFe
function validarNFE(dados: NFEData): { valid: boolean; errors: string[]; cStat?: string } {
  const errors: string[] = [];
  
  // Validação do CNPJ do emitente
  if (!dados.emitente.cnpj || dados.emitente.cnpj.replace(/\D/g, '').length !== 14) {
    errors.push('CNPJ do emitente inválido');
    return { valid: false, errors, cStat: '207' };
  }
  
  // Validação do CPF/CNPJ do destinatário
  const docDest = dados.destinatario.cpfCnpj.replace(/\D/g, '');
  if (!docDest || (docDest.length !== 11 && docDest.length !== 14)) {
    errors.push('CPF/CNPJ do destinatário inválido');
    return { valid: false, errors, cStat: '208' };
  }
  
  // Validação da IE do emitente
  if (!dados.emitente.inscricaoEstadual) {
    errors.push('Inscrição Estadual do emitente não informada');
    return { valid: false, errors, cStat: '209' };
  }
  
  // Validação de itens
  if (!dados.itens || dados.itens.length === 0) {
    errors.push('NF-e sem itens');
    return { valid: false, errors, cStat: '225' };
  }
  
  // Validação de NCM
  for (const item of dados.itens) {
    if (!item.ncm || item.ncm.replace(/\D/g, '').length !== 8) {
      errors.push(`NCM inválido para o item: ${item.descricao}`);
      return { valid: false, errors, cStat: '225' };
    }
  }
  
  // Validação de data de emissão (não pode ser muito antiga)
  const diasAtras = Math.floor((Date.now() - new Date(dados.dataEmissao).getTime()) / (1000 * 60 * 60 * 24));
  if (diasAtras > 30) {
    errors.push('Data de emissão muito atrasada (mais de 30 dias)');
    return { valid: false, errors, cStat: '228' };
  }
  
  return { valid: true, errors: [] };
}

// Simula delay de rede/processamento
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Gera XML simplificado da NFe
function gerarXMLAutorizado(dados: NFEData, chaveAcesso: string, protocolo: string): string {
  const dataRecebimento = new Date().toISOString();
  
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
        <${dados.destinatario.cpfCnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'}>${dados.destinatario.cpfCnpj.replace(/\D/g, '')}</${dados.destinatario.cpfCnpj.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'}>
        <xNome>${dados.destinatario.nome}</xNome>
        <indIEDest>9</indIEDest>
      </dest>
      ${dados.itens.map((item, index) => `
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
      </det>`).join('')}
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

// Função principal do simulador
export async function processarSefaz(request: SefazRequest): Promise<SefazResponse> {
  logger.debug('[SEFAZ Simulator] Processando requisição:', request.tipo);
  
  // Simula delay de rede (1-3 segundos)
  await delay(1000 + Math.random() * 2000);
  
  switch (request.tipo) {
    case 'autorizacao':
      return processarAutorizacao(request);
    case 'consulta':
      return processarConsulta(request);
    case 'cancelamento':
      return processarCancelamento(request);
    case 'inutilizacao':
      return processarInutilizacao(request);
    default:
      return {
        success: false,
        cStat: '999',
        xMotivo: 'Tipo de requisição não suportado'
      };
  }
}

async function processarAutorizacao(request: SefazRequest): Promise<SefazResponse> {
  if (!request.nfeData) {
    return {
      success: false,
      cStat: '225',
      xMotivo: 'Dados da NF-e não informados',
      errors: ['Dados da NF-e são obrigatórios para autorização']
    };
  }
  
  // Valida os dados
  const validacao = validarNFE(request.nfeData);
  if (!validacao.valid) {
    logger.debug('[SEFAZ Simulator] Validação falhou:', validacao.errors);
    return {
      success: false,
      cStat: validacao.cStat || '225',
      xMotivo: SEFAZ_STATUS[validacao.cStat as keyof typeof SEFAZ_STATUS] || validacao.errors[0],
      errors: validacao.errors
    };
  }
  
  // Simula 5% de chance de rejeição aleatória para realismo
  if (Math.random() < 0.05) {
    const rejections = ['204', '539', '593'];
    const randomReject = rejections[Math.floor(Math.random() * rejections.length)];
    logger.debug('[SEFAZ Simulator] Rejeição aleatória:', randomReject);
    return {
      success: false,
      cStat: randomReject,
      xMotivo: SEFAZ_STATUS[randomReject as keyof typeof SEFAZ_STATUS],
      errors: [SEFAZ_STATUS[randomReject as keyof typeof SEFAZ_STATUS]]
    };
  }
  
  // Gera dados de autorização
  const chaveAcesso = gerarChaveAcesso(request.nfeData);
  const protocolo = gerarProtocolo(request.nfeData.emitente.uf);
  const recibo = gerarRecibo(request.nfeData.emitente.uf);
  const dataRecebimento = new Date().toISOString();
  const xmlAutorizado = gerarXMLAutorizado(request.nfeData, chaveAcesso, protocolo);
  
  logger.debug('[SEFAZ Simulator] NFe autorizada:', { chaveAcesso, protocolo });
  
  return {
    success: true,
    cStat: '100',
    xMotivo: SEFAZ_STATUS['100'],
    chaveAcesso,
    protocolo,
    dataRecebimento,
    numeroRecibo: recibo,
    xml: xmlAutorizado
  };
}

async function processarConsulta(request: SefazRequest): Promise<SefazResponse> {
  if (!request.chaveAcesso) {
    return {
      success: false,
      cStat: '593',
      xMotivo: 'Chave de acesso não informada'
    };
  }
  
  // Simula consulta bem-sucedida
  await delay(500 + Math.random() * 1000);
  
  return {
    success: true,
    cStat: '100',
    xMotivo: 'Autorizado o uso da NF-e',
    chaveAcesso: request.chaveAcesso,
    protocolo: gerarProtocolo('SP'),
    dataRecebimento: new Date().toISOString()
  };
}

async function processarCancelamento(request: SefazRequest): Promise<SefazResponse> {
  if (!request.chaveAcesso) {
    return {
      success: false,
      cStat: '593',
      xMotivo: 'Chave de acesso não informada'
    };
  }
  
  if (!request.justificativa || request.justificativa.length < 15) {
    return {
      success: false,
      cStat: '999',
      xMotivo: 'Justificativa deve ter no mínimo 15 caracteres',
      errors: ['Justificativa insuficiente']
    };
  }
  
  await delay(1000 + Math.random() * 1500);
  
  return {
    success: true,
    cStat: '101',
    xMotivo: SEFAZ_STATUS['101'],
    chaveAcesso: request.chaveAcesso,
    protocolo: gerarProtocolo('SP'),
    dataRecebimento: new Date().toISOString()
  };
}

async function processarInutilizacao(request: SefazRequest): Promise<SefazResponse> {
  await delay(800 + Math.random() * 1200);
  
  return {
    success: true,
    cStat: '102',
    xMotivo: SEFAZ_STATUS['102'],
    protocolo: gerarProtocolo('SP'),
    dataRecebimento: new Date().toISOString()
  };
}

// Exporta status para uso externo
export { SEFAZ_STATUS };
