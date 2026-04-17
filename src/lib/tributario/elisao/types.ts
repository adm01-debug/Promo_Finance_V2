// ============================================
// MOTOR DE ELISÃO FISCAL — Tipos
// ============================================

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
