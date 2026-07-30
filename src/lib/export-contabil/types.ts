export interface EmpresaHeader {
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
}

export interface PartidaExport {
  data: string;
  numero: number | null;
  historico: string;
  conta_codigo: string;
  conta_nome: string;
  debito: number;
  credito: number;
}

export interface RazaoContaExport {
  conta_id: string;
  codigo: string;
  nome: string;
  saldo_inicial: number;
  movs: PartidaExport[];
}

export interface PeriodoCtx {
  empresa?: EmpresaHeader;
  dataInicio: string;
  dataFim: string;
}

export interface AuditoriaCFCExportData {
  scoreConformidade: number;
  totalContas: number;
  totalAnaliticas: number;
  comReferencial: number;
  semReferencial: number;
  formatoInvalido: Array<{ codigo: string; descricao: string; codigo_referencial: string | null; natureza: string }>;
  prefixoIncorreto: Array<{
    conta: { codigo: string; descricao: string; codigo_referencial: string | null; natureza: string };
    esperado: string[];
    sugestao: string | null;
  }>;
  duplicidades: Array<{ codigo_referencial: string; contas: Array<{ codigo: string; descricao: string }> }>;
}
