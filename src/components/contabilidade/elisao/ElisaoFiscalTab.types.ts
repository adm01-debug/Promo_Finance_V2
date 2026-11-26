export type DetalhesSimulacaoElisao = {
  fontes?: {
    faturamento12m?: number;
    comprasServicos12m?: number;
    folha12m?: number;
    notasConsideradas?: number;
    titulosConsiderados?: number;
    fonteFaturamento?: string;
    janelaInicio?: string;
    truncado?: boolean;
  };
  resultado?: {
    totalAntigo?: number;
    totalNovo?: number;
    cargaAntigaPercentual?: number;
    cargaNovaPercentual?: number;
    impacto?: 'economia' | 'aumento' | 'neutro';
    observacoes?: string[];
    icmsAntigo?: number;
    issAntigo?: number;
    pisAntigo?: number;
    cofinsAntigo?: number;
    cbsNovo?: number;
    ibsNovo?: number;
    isNovo?: number;
    creditosTotalRecuperaveis?: number;
    diferencaAbsoluta?: number;
  };
  aliquotas?: { atual_percentual?: number; simulada_percentual?: number };
  /** ICMS/ISS/PIS/COFINS ainda devidos no ano de transição (somados à carga simulada). */
  residuais_transicao?: {
    icms?: number;
    iss?: number;
    pis?: number;
    cofins?: number;
    total?: number;
  };
  carga_simulada_base?: number;
  avisos?: string[];
};

export type SimulacaoElisao = {
  id: string;
  ano_referencia: number;
  regime_atual: string | null;
  regime_simulado: string | null;
  carga_atual: number;
  carga_simulada: number;
  economia_estimada: number;
  premissas: { nome?: string } | null;
  detalhes: DetalhesSimulacaoElisao | null;
  created_at: string;
  updated_at: string;
};

export type AuditoriaLogElisao = {
  id: string;
  nota_fiscal_id: string;
  created_at: string;
  ncm?: string;
  elisao_regras_creditos?: { tipo_credito?: string } | null;
  metodologia_applied?: string;
  valor_credito_calculado: number;
  status_validacao?: string;
};

export type TarefaElisao = {
  id: string;
  status?: string;
  tipo_oportunidade?: string;
  prazo: string;
  titulo?: string;
  descricao?: string;
  checklist?: Array<{ done?: boolean }>;
  valor_envolvido?: number;
};

export interface ElisaoTabProps {
  empresaId: string;
}
