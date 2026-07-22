import { format, parseISO } from 'date-fns';

export interface RegistroSPED {
  tipo: string;
  campos: string[];
}

export interface DadosEmpresa {
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  uf?: string;
  codMunicipio?: string;
}

export interface OperacaoTributavel {
  id: string;
  tipo_operacao: string;
  documento_numero?: string;
  documento_chave?: string;
  data_operacao: string;
  valor_operacao: number;
  cbs_aliquota: number;
  cbs_valor: number;
  ibs_aliquota: number;
  ibs_valor: number;
  is_aliquota: number;
  is_valor: number;
  participante_cnpj?: string;
  participante_nome?: string;
  cfop?: string;
  ncm?: string;
  descricao?: string;
}

export interface CreditoTributario {
  id: string;
  tipo_tributo: string;
  tipo_credito: string;
  competencia_origem: string;
  valor_base: number;
  aliquota: number;
  valor_credito: number;
  status: string;
  fornecedor_cnpj?: string;
  documento_numero?: string;
}

export interface ApuracaoTributaria {
  competencia: string;
  cbs_debitos: number;
  cbs_creditos: number;
  cbs_a_pagar: number;
  ibs_debitos: number;
  ibs_creditos: number;
  ibs_a_pagar: number;
  is_debitos: number;
  is_a_pagar: number;
}

export function formatarValorSPED(valor: number, casasDecimais: number = 2): string {
  return valor.toFixed(casasDecimais).replace('.', ',');
}

export function formatarDataSPED(data: string | Date): string {
  const d = typeof data === 'string' ? parseISO(data) : data;
  return format(d, 'ddMMyyyy');
}

export function formatarCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '').padStart(14, '0');
}

export function gerarLinhaSPED(registro: RegistroSPED): string {
  return `|${registro.tipo}|${registro.campos.join('|')}|`;
}
