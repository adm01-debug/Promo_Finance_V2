// =====================================================
// Geradores de DFC (método indireto) e DMPL
// A partir de lançamentos contábeis e plano de contas
// =====================================================

import type { ContaPlano, LancamentoECD } from './sped-ecd-generator';

export interface DfcLinha {
  grupo: 'operacional' | 'investimento' | 'financiamento';
  descricao: string;
  valor: number;
}

export interface DfcResult {
  lucro_liquido: number;
  ajustes: DfcLinha[];
  variacoes: DfcLinha[];
  fluxo_operacional: number;
  fluxo_investimento: number;
  fluxo_financiamento: number;
  variacao_caixa: number;
  caixa_inicial: number;
  caixa_final: number;
  linhas: DfcLinha[];
}

const sumPartidas = (
  lancs: LancamentoECD[],
  predicate: (codigo: string) => boolean,
  signMap: (tipo: 'D' | 'C') => number = (t) => (t === 'C' ? 1 : -1),
): number =>
  lancs
    .flatMap((l) => l.partidas)
    .filter((p) => predicate(p.conta_codigo))
    .reduce((s, p) => s + signMap(p.tipo) * p.valor, 0);

/**
 * Gera DFC pelo método indireto.
 * Heurística baseada em natureza/código do plano de contas.
 */
export function gerarDFC(
  plano: ContaPlano[],
  lancs: LancamentoECD[],
  caixaInicial: number,
): DfcResult {
  const codigoPorNatureza = (n: string) =>
    new Set(plano.filter((p) => p.natureza === n).map((p) => p.codigo));

  const codReceitas = codigoPorNatureza('receita');
  const codDespesas = codigoPorNatureza('despesa');

  // Lucro líquido = receitas - despesas
  const receitas = sumPartidas(lancs, (c) => codReceitas.has(c));
  const despesas = sumPartidas(
    lancs,
    (c) => codDespesas.has(c),
    (t) => (t === 'D' ? 1 : -1),
  );
  const lucroLiquido = receitas - despesas;

  // Ajustes (depreciação, amortização) - identifica por nome
  const codDepreciacao = new Set(
    plano
      .filter((p) =>
        /deprec|amortiz|exaust/i.test(p.nome ?? ''),
      )
      .map((p) => p.codigo),
  );
  const depreciacao = sumPartidas(
    lancs,
    (c) => codDepreciacao.has(c),
    (t) => (t === 'D' ? 1 : -1),
  );

  // Variações em capital de giro: clientes, estoques, fornecedores
  const matchCodes = (re: RegExp) =>
    new Set(
      plano.filter((p) => re.test(p.nome ?? '')).map((p) => p.codigo),
    );
  const varClientes = -sumPartidas(
    lancs,
    (c) => matchCodes(/clientes|duplicat.*receber/i).has(c),
    (t) => (t === 'D' ? 1 : -1),
  );
  const varEstoques = -sumPartidas(
    lancs,
    (c) => matchCodes(/estoque/i).has(c),
    (t) => (t === 'D' ? 1 : -1),
  );
  const varFornec = sumPartidas(
    lancs,
    (c) => matchCodes(/fornecedor/i).has(c),
    (t) => (t === 'C' ? 1 : -1),
  );

  // Investimento: imobilizado / intangível
  const codInvest = matchCodes(/imobiliz|intang|investiment/i);
  const fluxoInvest = -sumPartidas(
    lancs,
    (c) => codInvest.has(c),
    (t) => (t === 'D' ? 1 : -1),
  );

  // Financiamento: empréstimos, capital social, dividendos
  const codFinanc = matchCodes(/emprestim|financiamento|capital social|dividendo/i);
  const fluxoFinanc = sumPartidas(
    lancs,
    (c) => codFinanc.has(c),
    (t) => (t === 'C' ? 1 : -1),
  );

  const ajustes: DfcLinha[] = [
    { grupo: 'operacional', descricao: 'Depreciação/Amortização', valor: depreciacao },
  ];
  const variacoes: DfcLinha[] = [
    { grupo: 'operacional', descricao: '(Aumento)/Redução de Clientes', valor: varClientes },
    { grupo: 'operacional', descricao: '(Aumento)/Redução de Estoques', valor: varEstoques },
    { grupo: 'operacional', descricao: 'Aumento/(Redução) de Fornecedores', valor: varFornec },
  ];

  const fluxoOper =
    lucroLiquido + depreciacao + varClientes + varEstoques + varFornec;

  const variacaoCaixa = fluxoOper + fluxoInvest + fluxoFinanc;
  const caixaFinal = caixaInicial + variacaoCaixa;

  const linhas: DfcLinha[] = [
    { grupo: 'operacional', descricao: 'Lucro Líquido do Exercício', valor: lucroLiquido },
    ...ajustes,
    ...variacoes,
    { grupo: 'investimento', descricao: 'Aquisição de Imobilizado/Intangível', valor: fluxoInvest },
    { grupo: 'financiamento', descricao: 'Captação/Pagamento de Financiamentos', valor: fluxoFinanc },
  ];

  return {
    lucro_liquido: lucroLiquido,
    ajustes,
    variacoes,
    fluxo_operacional: fluxoOper,
    fluxo_investimento: fluxoInvest,
    fluxo_financiamento: fluxoFinanc,
    variacao_caixa: variacaoCaixa,
    caixa_inicial: caixaInicial,
    caixa_final: caixaFinal,
    linhas,
  };
}

// =====================================================
// DMPL - Demonstração das Mutações do Patrimônio Líquido
// =====================================================

export interface DmplColuna {
  capital_social: number;
  reservas_capital: number;
  reservas_lucros: number;
  lucros_acumulados: number;
  ajustes_avaliacao: number;
  total: number;
}

export interface DmplLinha {
  descricao: string;
  movimentos: Partial<DmplColuna>;
}

export interface DmplResult {
  saldo_inicial: DmplColuna;
  movimentos: DmplLinha[];
  saldo_final: DmplColuna;
}

const ZERO_COL: DmplColuna = {
  capital_social: 0,
  reservas_capital: 0,
  reservas_lucros: 0,
  lucros_acumulados: 0,
  ajustes_avaliacao: 0,
  total: 0,
};

function classificarPL(nome: string): keyof Omit<DmplColuna, 'total'> | null {
  const n = nome.toLowerCase();
  if (/capital social/.test(n)) return 'capital_social';
  if (/reserva.*capital/.test(n)) return 'reservas_capital';
  if (/reserva.*lucro|reserva legal|estatutaria/.test(n)) return 'reservas_lucros';
  if (/lucro.*acumulado|prejuizo.*acumulado/.test(n)) return 'lucros_acumulados';
  if (/ajuste.*avaliacao|outros resultados abrangentes/.test(n))
    return 'ajustes_avaliacao';
  return null;
}

export function gerarDMPL(
  plano: ContaPlano[],
  lancs: LancamentoECD[],
  saldoInicialPorConta: Record<string, number>,
  lucroLiquidoExercicio: number,
): DmplResult {
  const contasPL = plano.filter((p) => p.natureza === 'patrimonio');

  const saldo_inicial: DmplColuna = { ...ZERO_COL };
  const saldo_final: DmplColuna = { ...ZERO_COL };

  for (const c of contasPL) {
    const col = classificarPL(c.nome ?? '');
    if (!col) continue;
    const ini = saldoInicialPorConta[c.codigo] ?? 0;
    const mov = sumPartidas(
      lancs,
      (cd) => cd === c.codigo,
      (t) => (t === 'C' ? 1 : -1),
    );
    saldo_inicial[col] += ini;
    saldo_final[col] += ini + mov;
  }

  // Lucro do exercício transita por lucros_acumulados
  saldo_final.lucros_acumulados += lucroLiquidoExercicio;

  saldo_inicial.total =
    saldo_inicial.capital_social +
    saldo_inicial.reservas_capital +
    saldo_inicial.reservas_lucros +
    saldo_inicial.lucros_acumulados +
    saldo_inicial.ajustes_avaliacao;

  saldo_final.total =
    saldo_final.capital_social +
    saldo_final.reservas_capital +
    saldo_final.reservas_lucros +
    saldo_final.lucros_acumulados +
    saldo_final.ajustes_avaliacao;

  const movimentos: DmplLinha[] = [
    {
      descricao: 'Lucro Líquido do Exercício',
      movimentos: { lucros_acumulados: lucroLiquidoExercicio, total: lucroLiquidoExercicio },
    },
  ];

  return { saldo_inicial, movimentos, saldo_final };
}
