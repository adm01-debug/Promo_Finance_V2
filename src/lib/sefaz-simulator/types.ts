// Tipos e catálogo de status SEFAZ compartilhados pelos handlers do simulador.

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

export const SEFAZ_STATUS = {
  '100': 'Autorizado o uso da NF-e',
  '101': 'Cancelamento de NF-e homologado',
  '102': 'Inutilização de número homologado',
  '103': 'Lote recebido com sucesso',
  '104': 'Lote processado',
  '105': 'Lote em processamento',
  '106': 'Lote não localizado',
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
