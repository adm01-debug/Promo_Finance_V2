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

export const CATEGORIA_LABEL: Record<CategoriaIndice, string> = {
  liquidez: 'Liquidez',
  endividamento: 'Endividamento',
  rentabilidade: 'Rentabilidade',
  atividade: 'Prazos e atividade',
  estrutura: 'Estrutura de capital',
};

const EPS = 1e-9;

export function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** Divisão segura: retorna `null` quando o divisor é nulo ou o resultado não é finito. */
export function safeDiv(numerador: number, divisor: number): number | null {
  const n = Number(numerador);
  const d = Number(divisor);
  if (!Number.isFinite(n) || !Number.isFinite(d)) return null;
  if (Math.abs(d) < EPS) return null;
  const r = n / d;
  return Number.isFinite(r) ? r : null;
}

/**
 * Classificação por limiares. `maiorMelhor` inverte o sentido da comparação.
 * Monotônica por construção: o resultado só melhora quando o valor melhora.
 */
export function classificar(
  valor: number | null,
  limiares: { bom: number; atencao: number },
  maiorMelhor = true,
): FaixaIndice {
  if (valor === null || !Number.isFinite(valor)) return 'indefinido';
  if (maiorMelhor) {
    if (valor >= limiares.bom) return 'bom';
    if (valor >= limiares.atencao) return 'atencao';
    return 'critico';
  }
  if (valor <= limiares.bom) return 'bom';
  if (valor <= limiares.atencao) return 'atencao';
  return 'critico';
}

interface Def {
  chave: string;
  rotulo: string;
  categoria: CategoriaIndice;
  formato: FormatoIndice;
  formula: string;
  interpretacao: string;
  calc: (a: AgregadosContabeis) => { valor: number | null; motivo?: string };
  faixa?: (valor: number | null) => FaixaIndice;
}

/** Helper: razão com motivo padronizado quando o divisor é zero. */
function razao(n: number, d: number, nomeDivisor: string) {
  const v = safeDiv(n, d);
  return v === null ? { valor: null, motivo: `${nomeDivisor} igual a zero no período` } : { valor: v };
}

function pct(n: number, d: number, nomeDivisor: string) {
  const v = safeDiv(n, d);
  return v === null ? { valor: null, motivo: `${nomeDivisor} igual a zero no período` } : { valor: v * 100 };
}

const DEFS: Def[] = [
  // ── Liquidez ────────────────────────────────────────────────────────────
  {
    chave: 'liquidez_corrente',
    rotulo: 'Liquidez corrente',
    categoria: 'liquidez',
    formato: 'indice',
    formula: 'Ativo circulante ÷ Passivo circulante',
    interpretacao: 'Capacidade de honrar as obrigações de curto prazo.',
    calc: (a) => razao(a.ativoCirculante, a.passivoCirculante, 'Passivo circulante'),
    faixa: (v) => classificar(v, { bom: 1.5, atencao: 1 }),
  },
  {
    chave: 'liquidez_seca',
    rotulo: 'Liquidez seca',
    categoria: 'liquidez',
    formato: 'indice',
    formula: '(Ativo circulante − Estoques) ÷ Passivo circulante',
    interpretacao: 'Liquidez desconsiderando a realização de estoques.',
    calc: (a) => razao(a.ativoCirculante - a.estoques, a.passivoCirculante, 'Passivo circulante'),
    faixa: (v) => classificar(v, { bom: 1, atencao: 0.7 }),
  },
  {
    chave: 'liquidez_imediata',
    rotulo: 'Liquidez imediata',
    categoria: 'liquidez',
    formato: 'indice',
    formula: 'Disponibilidades ÷ Passivo circulante',
    interpretacao: 'Parcela das dívidas de curto prazo coberta por caixa.',
    calc: (a) => razao(a.disponibilidades, a.passivoCirculante, 'Passivo circulante'),
    faixa: (v) => classificar(v, { bom: 0.3, atencao: 0.15 }),
  },
  {
    chave: 'liquidez_geral',
    rotulo: 'Liquidez geral',
    categoria: 'liquidez',
    formato: 'indice',
    formula: '(AC + Realizável LP) ÷ (PC + Exigível LP)',
    interpretacao: 'Solvência considerando também o longo prazo.',
    calc: (a) =>
      razao(
        a.ativoCirculante + a.realizavelLp,
        a.passivoCirculante + a.passivoNaoCirculante,
        'Passivo total',
      ),
    faixa: (v) => classificar(v, { bom: 1.2, atencao: 1 }),
  },

  // ── Endividamento ───────────────────────────────────────────────────────
  {
    chave: 'endividamento_geral',
    rotulo: 'Endividamento geral',
    categoria: 'endividamento',
    formato: 'percentual',
    formula: '(PC + Exigível LP) ÷ Ativo total',
    interpretacao: 'Proporção do ativo financiada por capital de terceiros.',
    calc: (a) => pct(a.passivoCirculante + a.passivoNaoCirculante, a.ativoTotal, 'Ativo total'),
    faixa: (v) => classificar(v, { bom: 50, atencao: 70 }, false),
  },
  {
    chave: 'composicao_endividamento',
    rotulo: 'Composição do endividamento',
    categoria: 'endividamento',
    formato: 'percentual',
    formula: 'Passivo circulante ÷ (PC + Exigível LP)',
    interpretacao: 'Quanto da dívida vence no curto prazo.',
    calc: (a) =>
      pct(a.passivoCirculante, a.passivoCirculante + a.passivoNaoCirculante, 'Passivo total'),
    faixa: (v) => classificar(v, { bom: 40, atencao: 60 }, false),
  },
  {
    chave: 'imobilizacao_pl',
    rotulo: 'Imobilização do PL',
    categoria: 'endividamento',
    formato: 'percentual',
    formula: 'Imobilizado ÷ Patrimônio líquido',
    interpretacao: 'Parcela do capital próprio aplicada em ativos fixos.',
    calc: (a) => pct(a.imobilizado, a.patrimonioLiquido, 'Patrimônio líquido'),
    faixa: (v) => classificar(v, { bom: 50, atencao: 80 }, false),
  },
  {
    chave: 'garantia_capital_proprio',
    rotulo: 'Garantia do capital próprio',
    categoria: 'endividamento',
    formato: 'indice',
    formula: 'Patrimônio líquido ÷ (PC + Exigível LP)',
    interpretacao: 'Cobertura das dívidas pelo capital dos sócios.',
    calc: (a) =>
      razao(a.patrimonioLiquido, a.passivoCirculante + a.passivoNaoCirculante, 'Passivo total'),
    faixa: (v) => classificar(v, { bom: 1, atencao: 0.5 }),
  },

  // ── Rentabilidade ───────────────────────────────────────────────────────
  {
    chave: 'margem_bruta',
    rotulo: 'Margem bruta',
    categoria: 'rentabilidade',
    formato: 'percentual',
    formula: '(Receita líquida − CMV) ÷ Receita líquida',
    interpretacao: 'Resultado após os custos diretos.',
    calc: (a) => pct(a.receitaLiquida - a.cmv, a.receitaLiquida, 'Receita líquida'),
    faixa: (v) => classificar(v, { bom: 30, atencao: 15 }),
  },
  {
    chave: 'margem_liquida',
    rotulo: 'Margem líquida',
    categoria: 'rentabilidade',
    formato: 'percentual',
    formula: 'Lucro líquido ÷ Receita líquida',
    interpretacao: 'Quanto sobra de cada real faturado.',
    calc: (a) => pct(a.lucroLiquido, a.receitaLiquida, 'Receita líquida'),
    faixa: (v) => classificar(v, { bom: 10, atencao: 3 }),
  },
  {
    chave: 'roa',
    rotulo: 'Retorno sobre o ativo (ROA)',
    categoria: 'rentabilidade',
    formato: 'percentual',
    formula: 'Lucro líquido ÷ Ativo total',
    interpretacao: 'Eficiência do ativo em gerar resultado.',
    calc: (a) => pct(a.lucroLiquido, a.ativoTotal, 'Ativo total'),
    faixa: (v) => classificar(v, { bom: 8, atencao: 3 }),
  },
  {
    chave: 'roe',
    rotulo: 'Retorno sobre o PL (ROE)',
    categoria: 'rentabilidade',
    formato: 'percentual',
    formula: 'Lucro líquido ÷ Patrimônio líquido',
    interpretacao: 'Retorno do capital investido pelos sócios.',
    calc: (a) => pct(a.lucroLiquido, a.patrimonioLiquido, 'Patrimônio líquido'),
    faixa: (v) => classificar(v, { bom: 12, atencao: 5 }),
  },
  {
    chave: 'giro_ativo',
    rotulo: 'Giro do ativo',
    categoria: 'rentabilidade',
    formato: 'indice',
    formula: 'Receita líquida ÷ Ativo total',
    interpretacao: 'Volume de vendas gerado por real de ativo.',
    calc: (a) => razao(a.receitaLiquida, a.ativoTotal, 'Ativo total'),
    faixa: (v) => classificar(v, { bom: 1, atencao: 0.5 }),
  },

  // ── Atividade ───────────────────────────────────────────────────────────
  {
    chave: 'pmr',
    rotulo: 'Prazo médio de recebimento',
    categoria: 'atividade',
    formato: 'dias',
    formula: '(Clientes ÷ Receita líquida) × dias do período',
    interpretacao: 'Dias médios entre a venda e o recebimento.',
    calc: (a) => {
      const r = safeDiv(a.clientes, a.receitaLiquida);
      return r === null
        ? { valor: null, motivo: 'Receita líquida igual a zero no período' }
        : { valor: r * a.diasPeriodo };
    },
    faixa: (v) => classificar(v, { bom: 30, atencao: 60 }, false),
  },
  {
    chave: 'pmp',
    rotulo: 'Prazo médio de pagamento',
    categoria: 'atividade',
    formato: 'dias',
    formula: '(Fornecedores ÷ CMV) × dias do período',
    interpretacao: 'Dias médios de prazo obtido junto a fornecedores.',
    calc: (a) => {
      const r = safeDiv(a.fornecedores, a.cmv);
      return r === null ? { valor: null, motivo: 'CMV igual a zero no período' } : { valor: r * a.diasPeriodo };
    },
    faixa: (v) => classificar(v, { bom: 45, atencao: 20 }),
  },
  {
    chave: 'pme',
    rotulo: 'Prazo médio de estocagem',
    categoria: 'atividade',
    formato: 'dias',
    formula: '(Estoques ÷ CMV) × dias do período',
    interpretacao: 'Dias médios de permanência do estoque.',
    calc: (a) => {
      const r = safeDiv(a.estoques, a.cmv);
      return r === null ? { valor: null, motivo: 'CMV igual a zero no período' } : { valor: r * a.diasPeriodo };
    },
    faixa: (v) => classificar(v, { bom: 30, atencao: 60 }, false),
  },
  {
    chave: 'ciclo_operacional',
    rotulo: 'Ciclo operacional',
    categoria: 'atividade',
    formato: 'dias',
    formula: 'PME + PMR',
    interpretacao: 'Da compra do estoque ao recebimento da venda.',
    calc: (a) => {
      const pme = safeDiv(a.estoques, a.cmv);
      const pmr = safeDiv(a.clientes, a.receitaLiquida);
      if (pme === null || pmr === null) {
        return { valor: null, motivo: 'CMV ou receita líquida igual a zero no período' };
      }
      return { valor: (pme + pmr) * a.diasPeriodo };
    },
    faixa: (v) => classificar(v, { bom: 60, atencao: 120 }, false),
  },
  {
    chave: 'ciclo_financeiro',
    rotulo: 'Ciclo financeiro',
    categoria: 'atividade',
    formato: 'dias',
    formula: 'Ciclo operacional − PMP',
    interpretacao: 'Dias que a empresa financia a própria operação.',
    calc: (a) => {
      const pme = safeDiv(a.estoques, a.cmv);
      const pmr = safeDiv(a.clientes, a.receitaLiquida);
      const pmp = safeDiv(a.fornecedores, a.cmv);
      if (pme === null || pmr === null || pmp === null) {
        return { valor: null, motivo: 'CMV ou receita líquida igual a zero no período' };
      }
      return { valor: (pme + pmr - pmp) * a.diasPeriodo };
    },
    faixa: (v) => classificar(v, { bom: 30, atencao: 90 }, false),
  },

  // ── Estrutura ───────────────────────────────────────────────────────────
  {
    chave: 'ccl',
    rotulo: 'Capital circulante líquido',
    categoria: 'estrutura',
    formato: 'moeda',
    formula: 'Ativo circulante − Passivo circulante',
    interpretacao: 'Folga financeira de curto prazo.',
    calc: (a) => ({ valor: a.ativoCirculante - a.passivoCirculante }),
    faixa: (v) => (v === null ? 'indefinido' : v > 0 ? 'bom' : v === 0 ? 'atencao' : 'critico'),
  },
  {
    chave: 'ncg',
    rotulo: 'Necessidade de capital de giro',
    categoria: 'estrutura',
    formato: 'moeda',
    formula: '(Clientes + Estoques) − Fornecedores',
    interpretacao: 'Recursos exigidos pelo ciclo operacional.',
    calc: (a) => ({ valor: a.clientes + a.estoques - a.fornecedores }),
    faixa: () => 'neutro',
  },
  {
    chave: 'saldo_tesouraria',
    rotulo: 'Saldo em tesouraria',
    categoria: 'estrutura',
    formato: 'moeda',
    formula: 'CCL − NCG',
    interpretacao: 'Positivo indica caixa próprio financiando o giro.',
    calc: (a) => ({
      valor: a.ativoCirculante - a.passivoCirculante - (a.clientes + a.estoques - a.fornecedores),
    }),
    faixa: (v) => (v === null ? 'indefinido' : v >= 0 ? 'bom' : 'critico'),
  },
];

/** Calcula todos os indicadores a partir dos agregados já consolidados. */
export function calcularIndices(a: AgregadosContabeis): Indicador[] {
  return DEFS.map((d) => {
    const { valor, motivo } = d.calc(a);
    const seguro = valor === null || !Number.isFinite(valor) ? null : round2(valor);
    return {
      chave: d.chave,
      rotulo: d.rotulo,
      categoria: d.categoria,
      formato: d.formato,
      valor: seguro,
      faixa: seguro === null ? 'indefinido' : (d.faixa?.(seguro) ?? 'neutro'),
      formula: d.formula,
      interpretacao: d.interpretacao,
      ...(seguro === null ? { motivo: motivo ?? 'Base contábil insuficiente' } : {}),
    };
  });
}

/** Variação percentual entre dois períodos; `null` quando indefinida. */
export function variacao(atual: number | null, anterior: number | null): number | null {
  if (atual === null || anterior === null) return null;
  const v = safeDiv(atual - anterior, Math.abs(anterior));
  return v === null ? null : round2(v * 100);
}

export function formatarIndice(valor: number | null, formato: FormatoIndice): string {
  if (valor === null) return '—';
  switch (formato) {
    case 'percentual':
      return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    case 'dias':
      return `${Math.round(valor).toLocaleString('pt-BR')} d`;
    case 'moeda':
      return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    default:
      return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export const AGREGADOS_ZERO: AgregadosContabeis = {
  ativoTotal: 0,
  ativoCirculante: 0,
  ativoNaoCirculante: 0,
  realizavelLp: 0,
  imobilizado: 0,
  disponibilidades: 0,
  clientes: 0,
  estoques: 0,
  passivoCirculante: 0,
  passivoNaoCirculante: 0,
  fornecedores: 0,
  patrimonioLiquido: 0,
  receitaBruta: 0,
  deducoesReceita: 0,
  receitaLiquida: 0,
  cmv: 0,
  lucroLiquido: 0,
  diasPeriodo: 30,
};
