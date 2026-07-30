// MOTOR DE FOLHA — Tipos (Etapa B: encargos patronais precisos com RAT/FAP)
// Todos os valores em BRL; alíquotas em decimal (0.02 = 2%).

/** Grau de risco do estabelecimento (Anexo V do RPS — Decreto 3.048/99). */
export type GrauRisco = 'leve' | 'medio' | 'grave';

/** Alíquota RAT (SAT) por grau de risco. */
export const RAT_POR_GRAU: Record<GrauRisco, number> = {
  leve: 0.01,
  medio: 0.02,
  grave: 0.03,
};

/** Código FPAS que determina o pacote de contribuições a Terceiros (Sistema S). */
export interface CodigoFpas {
  fpas: string;
  descricao: string;
  /** Alíquota total de Terceiros em decimal (ex.: 0.058). */
  aliquotaTerceiros: number;
  /** Composição analítica (Salário-Educação, INCRA, SENAI/SENAC, SESI/SESC, SEBRAE). */
  composicao: Record<string, number>;
}

/** Entrada para apuração dos encargos patronais sobre a folha. */
export interface InputEncargosPatronais {
  /** Base de cálculo (remuneração sujeita a contribuição) no período. */
  folha: number;
  /** Pró-labore: integra CPP (20%), mas NÃO integra RAT, Terceiros nem FGTS. */
  proLabore?: number;
  /** Grau de risco preponderante do CNAE. */
  grauRisco?: GrauRisco;
  /** Override direto do RAT nominal (decimal). Prevalece sobre grauRisco. */
  aliquotaRat?: number;
  /** Fator Acidentário de Prevenção — 0,5000 a 2,0000 (Lei 10.666/03, art. 10). */
  fap?: number;
  /** Código FPAS para determinar Terceiros. Default '515' (indústria/comércio). */
  fpas?: string;
  /** Override direto de Terceiros (decimal). Prevalece sobre fpas. */
  aliquotaTerceiros?: number;
  /** Empresa optante pelo Simples Nacional (Anexos I a III): CPP e Terceiros no DAS. */
  simplesNacional?: boolean;
  /** Empresa imune/isenta de contribuição patronal (entidades beneficentes). */
  imunePatronal?: boolean;
  /** Inclui FGTS (8%) no total de encargos. Default true. */
  incluirFgts?: boolean;
}

export interface LinhaEncargo {
  rubrica: string;
  base: number;
  aliquota: number;
  valor: number;
  fundamento: string;
}

export interface ResultadoEncargosPatronais {
  baseCpp: number;
  baseRatTerceiros: number;
  /** RAT nominal antes do FAP. */
  ratNominal: number;
  fap: number;
  /** RAT ajustado = RAT nominal × FAP (limitado a [0,005; 0,06]). */
  ratAjustado: number;
  aliquotaTerceiros: number;
  cpp: number;
  rat: number;
  terceiros: number;
  fgts: number;
  /** CPP + RAT + Terceiros (sem FGTS). */
  totalInss: number;
  /** totalInss + FGTS (quando incluído). */
  totalEncargos: number;
  /** Percentual de encargos sobre a folha total. */
  percentualSobreFolha: number;
  linhas: LinhaEncargo[];
  alertas: string[];
}

/** Comparativo CPP sobre folha × CPRB (desoneração — Lei 12.546/11). */
export interface InputCprb {
  receitaBruta: number;
  aliquotaCprb: number;
  encargos: InputEncargosPatronais;
}

export interface ResultadoCprb {
  cprb: number;
  aliquotaCprb: number;
  receitaBruta: number;
  /** CPP patronal (20%) que seria devido na folha. */
  cppFolha: number;
  /** Encargos que permanecem devidos mesmo na desoneração (RAT + Terceiros + FGTS). */
  encargosRemanescentes: number;
  totalDesonerado: number;
  totalOnerado: number;
  economia: number;
  recomendacao: 'cprb' | 'folha';
  alertas: string[];
}
