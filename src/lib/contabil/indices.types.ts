/**
 * Índices econômico-financeiros — núcleo puro.
 *
 * A agregação por grupo é feita no Postgres (`fn_indices_contabeis`); aqui só
 * ocorrem divisões determinísticas sobre os agregados. Nenhuma função lança
 * exceção: divisor nulo/zero resulta em `valor: null` com `motivo` explícito.
 */

export interface AgregadosContabeis {
  ativoTotal: number;
  ativoCirculante: number;
  ativoNaoCirculante: number;
  realizavelLp: number;
  imobilizado: number;
  disponibilidades: number;
  clientes: number;
  estoques: number;
  passivoCirculante: number;
  passivoNaoCirculante: number;
  fornecedores: number;
  patrimonioLiquido: number;
  receitaBruta: number;
  deducoesReceita: number;
  receitaLiquida: number;
  cmv: number;
  lucroLiquido: number;
  diasPeriodo: number;
}

export type CategoriaIndice =
  | 'liquidez'
  | 'endividamento'
  | 'rentabilidade'
  | 'atividade'
  | 'estrutura';

export type FormatoIndice = 'indice' | 'percentual' | 'dias' | 'moeda';

/** Faixa semântica de leitura do indicador. */
export type FaixaIndice = 'bom' | 'atencao' | 'critico' | 'neutro' | 'indefinido';

export interface Indicador {
  chave: string;
  rotulo: string;
  categoria: CategoriaIndice;
  formato: FormatoIndice;
  /** `null` quando não há base contábil suficiente. Nunca `NaN`/`Infinity`. */
  valor: number | null;
  faixa: FaixaIndice;
  formula: string;
  interpretacao: string;
  /** Preenchido apenas quando `valor === null`. */
  motivo?: string;
}

export interface Def {
  chave: string;
  rotulo: string;
  categoria: CategoriaIndice;
  formato: FormatoIndice;
  formula: string;
  interpretacao: string;
  calc: (a: AgregadosContabeis) => { valor: number | null; motivo?: string };
  faixa?: (valor: number | null) => FaixaIndice;
}
