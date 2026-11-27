// OFX/OFC/CSV bank statement — shared types

export interface TransacaoOFX {
  id: string;
  tipo: 'credito' | 'debito';
  data: Date;
  valor: number;
  descricao: string;
  numeroReferencia?: string;
  tipoTransacao?: string;
  checkNum?: string;
  memo?: string;
  /**
   * Conta de origem da transação (banco/agência/conta), preenchida pelo parser
   * quando o arquivo declara a conta. Um OFX pode trazer vários blocos de extrato,
   * e o FITID só é único dentro da conta que o emitiu — por isso a origem vive na
   * transação, e não no extrato inteiro.
   */
  origemConta?: string;
}

export interface ContaOFX {
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  moeda: string;
  saldoInicial?: number;
  saldoFinal?: number;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface ExtratoOFX {
  conta: ContaOFX;
  transacoes: TransacaoOFX[];
  dataImportacao: Date;
  nomeArquivo: string;
  formato: 'OFX' | 'OFC' | 'CSV' | 'OPEN_FINANCE';
}

export interface ResultadoImportacao {
  sucesso: boolean;
  extrato?: ExtratoOFX;
  erro?: string;
  avisos: string[];
}
