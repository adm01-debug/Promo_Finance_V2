// MOTOR TRIBUTÁRIO — Tipos compartilhados

export type RegimeTributario = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';

export type AnexoSimples = 'I' | 'II' | 'III' | 'IV' | 'V';

/** Período de apuração de IRPJ/CSLL (Lei 9.430/96). */
export type PeriodicidadeApuracao = 'trimestral' | 'anual';

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
  /** Contribuições a Terceiros (fração) sobre a folha em Presumido/Real. Default 0.058. */
  aliquotaTerceiros?: number;
  /** CNAE principal (deriva a alíquota de terceiros quando não informada). */
  cnaePrincipal?: string;
  /**
   * Presunção IRPJ sobre receita de serviços (fração). Default 0,32.
   * Transporte de cargas 0,08; passageiros 0,16; hospitalares 0,08 (Lei 9.249/95, art. 15).
   */
  presuncaoIrpjServicos?: number;
  /**
   * Presunção CSLL sobre receita de serviços (fração). Default 0,32.
   * Transporte e serviços hospitalares 0,12 (Lei 9.249/95, art. 20).
   */
  presuncaoCsllServicos?: number;
  /**
   * Aquisições anuais que geram crédito de ICMS (não-cumulatividade,
   * CF/88 art. 155 §2º I). Ausente => rateio de `comprasComCredito` pela
   * participação da receita de mercadorias.
   */
  comprasComCreditoICMS?: number;
  /**
   * Prejuízo fiscal de IRPJ acumulado de períodos anteriores (valor positivo).
   * A compensação é limitada a 30% do lucro real do período (Lei 9.065/95, art. 15).
   */
  prejuizoFiscalAcumulado?: number;
  /**
   * Base de cálculo negativa de CSLL acumulada (valor positivo).
   * Compensação limitada a 30% da base positiva (Lei 9.065/95, art. 16).
   */
  baseNegativaCsllAcumulada?: number;
  /**
   * Período de apuração de IRPJ/CSLL no Lucro Real: 'anual' (estimativa mensal
   * com ajuste anual) ou 'trimestral'. Default 'anual'. No Lucro Presumido a
   * apuração é sempre trimestral por força de lei.
   */
  periodicidadeApuracao?: PeriodicidadeApuracao;
  /**
   * Lucro real por trimestre (4 posições), quando conhecido. Permite avaliar o
   * custo da apuração trimestral em cenários com resultados irregulares.
   */
  lucroTrimestral?: number[];
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
  /** Crédito de ICMS apropriado sobre aquisições (não-cumulatividade). */
  icmsCredito?: number;
  /** Saldo credor de ICMS transportado ao período seguinte. */
  icmsSaldoCredor?: number;
  /** Prejuízo fiscal de IRPJ efetivamente compensado no período (trava de 30%). */
  prejuizoFiscalCompensado?: number;
  /** Saldo de prejuízo fiscal de IRPJ a compensar em períodos futuros. */
  prejuizoFiscalSaldo?: number;
  /** Base negativa de CSLL efetivamente compensada no período (trava de 30%). */
  baseNegativaCsllCompensada?: number;
  /** Saldo de base negativa de CSLL a compensar em períodos futuros. */
  baseNegativaCsllSaldo?: number;
  /** Periodicidade do período de apuração de IRPJ/CSLL efetivamente aplicada. */
  periodicidadeApuracao?: PeriodicidadeApuracao;
  /** Bases de IRPJ por trimestre (quando a apuração é trimestral). */
  irpjBasesTrimestrais?: number[];
  /** Custo adicional de IRPJ decorrente da sazonalidade (trimestral − anual equivalente). */
  efeitoSazonalidadeIrpj?: number;
  /** IRPJ+CSLL que seria devido na periodicidade alternativa (comparativo Real). */
  irpjCsllPeriodicidadeAlternativa?: number;
  /** Economia estimada ao adotar a periodicidade recomendada no Lucro Real. */
  economiaPeriodicidade?: number;

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
