// MOTOR TRIBUTÁRIO — Tipos compartilhados

export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';

export type AnexoSimples = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface FaturamentoMes {
  ano: number;
  mes: number;
  receita_bruta: number;
  receita_servicos?: number;
  receita_revenda?: number;
  receita_industria?: number;
  receita_exportacao?: number;
}

export interface FolhaMes {
  ano: number;
  mes: number;
  salarios: number;
  pro_labore: number;
  encargos: number;
  total_folha: number;
}

export interface ParametrosSimulacao {
  faturamentoAnual: number;
  faturamentoMensal?: FaturamentoMes[];
  folhaMensal?: FolhaMes[];
  folhaAnual?: number;
  margemLucro: number; // % (0-100)
  percentualServicos: number; // % (0-100)
  percentualRevenda?: number;
  percentualIndustria?: number;
  percentualExportacao?: number;
  comprasComCredito?: number;
  despesasOperacionais?: number;
  uf?: string;
  atividadePrincipal?: string;
  /** Alíquota ICMS efetiva (0..1), default 0.18. */
  aliquotaICMS?: number;
  /** Alíquota ISS efetiva (0..1), default 0.05. */
  aliquotaISS?: number;
  /** Sublimite estadual de receita bruta (LC 123/2006, arts. 19 e 20). Default R$ 3.600.000. */
  sublimiteEstadual?: number;
  /** ISS retido na fonte (valor anual) deduzido da parcela de ISS do DAS. */
  issRetidoFonte?: number;
  /** Alíquota RAT/FAP (0..1) aplicada à CPP patronal fora do DAS (Anexo IV). Default 0.02. */
  aliquotaRAT?: number;

}

export interface ResultadoCenario {
  regime: RegimeTributario;
  nome: string;
  elegivel: boolean;
  motivoInelegibilidade?: string;
  // Tributos federais
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  cpp: number; // INSS patronal (Simples)
  // Tributos estaduais/municipais
  icms: number;
  iss: number;
  // Reforma tributária (transição)
  cbs: number;
  ibs: number;
  // Totais
  totalTributos: number;
  cargaEfetiva: number; // % sobre faturamento
  aliquotaNominal?: number;
  // Detalhes específicos
  rbt12?: number;
  fatorR?: number;
  anexoAplicavel?: AnexoSimples;
  faixaAplicavel?: number;
  /** True quando o RBT12 ultrapassou o sublimite estadual (ICMS/ISS fora do DAS). */
  sublimiteExcedido?: boolean;
  icmsForaDAS?: number;
  issForaDAS?: number;
  issRetidoDeduzido?: number;
  /** CPP patronal recolhida fora do DAS (Anexo IV do Simples Nacional). */
  cppForaDAS?: number;

  observacoes: string[];
}

export interface ResultadoDecisao {
  cenarios: ResultadoCenario[];
  recomendado: ResultadoCenario;
  segundoLugar?: ResultadoCenario;
  economiaAnualVsAtual?: number;
  alertas: string[];
  justificativa: string;
  justificativaIA?: string | null;
  auditLogId?: string | null;
  fromCache?: boolean;
}
