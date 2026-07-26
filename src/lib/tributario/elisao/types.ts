// MOTOR DE ELISÃO FISCAL — Tipos

export type RegimeAplicavel = 'simples' | 'presumido' | 'real';
export type RiscoElisao = 'baixo' | 'medio' | 'alto';

export interface ContextoEmpresa {
  empresa_id: string;
  regime_atual: RegimeAplicavel;
  rbt12: number;
  faturamento_anual: number;
  receita_exportacao?: number;
  receita_importacao?: number;
  patrimonio_liquido?: number;
  lucro_liquido?: number;
  folha_total_anual?: number;
  despesas_pd?: number;
  beneficio_icms_anual?: number;
  dividendos_pf_anual?: number;
  carga_tributaria_atual?: number;
  cnae?: string;
  /** UF da unidade principal — usada nos incentivos regionais SUDENE/SUDAM. */
  uf?: string;
  /** Participação da receita industrial no faturamento (0-100). */
  percentual_industria?: number;
  /** Saldo de lucros apurados até 31/12/2025 ainda não distribuídos. */
  lucros_acumulados_ate_2025?: number;
  /** Indica se já existe ata de deliberação de distribuição registrada. */
  deliberacao_lucros_registrada?: boolean;
  /** Créditos anuais de PIS/COFINS identificados como não aproveitados. */
  creditos_pis_cofins_nao_aproveitados?: number;
  /** Investimento anual em máquinas e equipamentos novos. */
  investimento_maquinas_anual?: number;
}

export interface OportunidadeDetectada {
  estrategia: string;
  nome: string;
  aplicavel: boolean;
  economia_estimada: number;
  economia_min: number;
  economia_max: number;
  base_legal: string;
  risco: RiscoElisao;
  justificativa: string;
  proximos_passos: string[];
  observacoes?: string;
}

export const TJLP_ANUAL = 0.0712; // TJLP Banco Central — atualizar periodicamente
export const SUBLIMITE_SIMPLES = 3_600_000;
export const TETO_SIMPLES = 4_800_000;
export const TETO_DIVIDENDOS_IRPFM = 600_000; // Lei 15.270/2025

/** Encerramento da janela de deliberação de lucros isentos (Lei 15.270/2025). */
export const DATA_LIMITE_DELIBERACAO_LUCROS = new Date('2025-12-31T23:59:59-03:00');
/** IRRF sobre dividendos a partir de 2026 (Lei 15.270/2025). */
export const ALIQUOTA_IRRF_DIVIDENDOS = 0.10;
/** Prazo prescricional para repetição/compensação de indébito (CTN art. 168). */
export const ANOS_PRESCRICAO_CREDITO = 5;
/** Proxy conservador de crédito anual de PIS/COFINS não aproveitado sobre a receita. */
export const TAXA_CREDITO_NAO_APROVEITADO_ESTIMADA = 0.003;
/** IRPJ 15% + adicional 10% + CSLL 9% no Lucro Real. */
export const ALIQUOTA_IRPJ_CSLL_COMBINADA = 0.34;
/** Alíquota básica do IRPJ, base do incentivo regional. */
export const ALIQUOTA_IRPJ_BASICA = 0.15;
/** Redução do IRPJ sobre o lucro da exploração em área incentivada. */
export const REDUCAO_IRPJ_REGIONAL = 0.75;
/** Custo de oportunidade anual do capital, usado em ganhos de antecipação. */
export const CUSTO_OPORTUNIDADE_ANUAL = 0.12;
/** UFs na área de atuação da SUDENE. */
export const UFS_SUDENE: readonly string[] = ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE', 'MG', 'ES'];
/** UFs na Amazônia Legal (SUDAM). */
export const UFS_SUDAM: readonly string[] = ['AC', 'AP', 'AM', 'MT', 'PA', 'RO', 'RR', 'TO', 'MA'];
