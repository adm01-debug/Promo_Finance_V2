import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buscarFontesContabeis, janela12Competencias } from '../fontes-contabeis';

type LinhaNota = {
  valor_total: number | null;
  status: string | null;
  cliente_nome?: string | null;
  cliente_cnpj?: string | null;
  data_emissao?: string | null;
};
type LinhaPagar = {
  valor: number | null;
  status: string | null;
  fornecedor_id?: string | null;
  fornecedor_nome?: string | null;
  categoria?: string | null;
  categoria_nome?: string | null;
  descricao?: string | null;
  data_emissao?: string | null;
};

type LinhaFolha = {
  valor_total?: number | null;
  total_folha?: number | null;
  salarios?: number | null;
  encargos?: number | null;
  beneficios?: number | null;
  pro_labore?: number | null;
  mes_referencia?: string | null;
};

let notas: LinhaNota[] = [];
let titulos: Array<{ valor: number | null }> = [];
let pagar: LinhaPagar[] = [];
let folha: LinhaFolha[] = [];
let erro: unknown = null;
/** Quando true, toda pagina vem cheia — simula mais de 100 mil linhas no servidor. */
let paginaSempreCheia = false;
const intervalos: Array<{ tabela: string; de: number; ate: number }> = [];
/** Filtros de data pedidos ao PostgREST — prova a janela de competência da folha. */
const filtros: Array<{ tabela: string; coluna: string; valor: string }> = [];

interface ConsultaFake {
  select: () => ConsultaFake;
  eq: () => ConsultaFake;
  is: () => ConsultaFake;
  neq: () => ConsultaFake;
  gte: (coluna: string, valor: string) => ConsultaFake;
  lt: (coluna: string, valor: string) => ConsultaFake;
  order: () => ConsultaFake;
  range: (de: number, ate: number) => Promise<{ data: unknown[]; error: unknown }>;
}

function linhasDa(tabela: string): unknown[] {
  if (tabela === 'notas_fiscais') return notas;
  if (tabela === 'contas_receber') return titulos;
  if (tabela === 'folha_pagamento') return folha;
  // `contas_pagar` nao recebe o filtro de status no mock: a consulta real ja
  // exclui cancelados no servidor (`.neq('status','cancelado')`).
  return pagar.filter((l) => (l.status ?? '').toLowerCase() !== 'cancelado');
}

function consulta(tabela: string): ConsultaFake {
  // Predicados desta consulta: linhas sem a coluna filtrada passam direto, então
  // o filtro de `mes_referencia` só afeta a tabela que realmente a tem.
  const predicados: Array<(l: Record<string, unknown>) => boolean> = [];
  const comparar = (coluna: string, valor: string, op: 'gte' | 'lt') => {
    filtros.push({ tabela, coluna, valor });
    predicados.push((l) =>
      !(coluna in l)
        ? true
        : op === 'gte'
          ? String(l[coluna] ?? '') >= valor
          : String(l[coluna] ?? '') < valor
    );
  };
  const api: ConsultaFake = {
    select: () => api,
    eq: () => api,
    is: () => api,
    neq: () => api,
    gte: (coluna, valor) => {
      comparar(coluna, valor, 'gte');
      return api;
    },
    lt: (coluna, valor) => {
      comparar(coluna, valor, 'lt');
      return api;
    },
    order: () => api,
    range: (de, ate) => {
      intervalos.push({ tabela, de, ate });
      if (erro) return Promise.resolve({ data: null, error: erro });
      const linhas = linhasDa(tabela).filter((l) =>
        predicados.every((filtro) => filtro(l as Record<string, unknown>))
      );
      if (paginaSempreCheia) {
        return Promise.resolve({ data: linhas.slice(0, ate - de + 1), error: null });
      }
      return Promise.resolve({ data: linhas.slice(de, ate + 1), error: null });
    },
  };
  return api;
}

vi.mock('@/lib/supabase-dynamic', () => ({
  supabaseDyn: { from: (t: string) => consulta(t) },
}));

beforeEach(() => {
  intervalos.length = 0;
  filtros.length = 0;
  erro = null;
  paginaSempreCheia = false;
  notas = [];
  titulos = [];
  pagar = [];
  folha = [];
});

describe('janela12Competencias', () => {
  it('pega as 12 competencias fechadas anteriores ao mes de apuracao', () => {
    // 26/11/2026 => competencias de 01/11/2025 a 01/11/2026 (nov/2026 fica de fora)
    expect(janela12Competencias(new Date('2026-11-26T12:00:00Z'))).toEqual({
      inicio: '2025-11-01',
      fim: '2026-11-01',
    });
  });

  it('fecha a janela no primeiro dia do mes mesmo em 31 de marco', () => {
    expect(janela12Competencias(new Date('2026-03-31T23:00:00Z'))).toEqual({
      inicio: '2025-03-01',
      fim: '2026-03-01',
    });
  });
});

describe('buscarFontesContabeis', () => {
  it('le todas as paginas do PostgREST em vez de so a primeira', async () => {
    notas = Array.from({ length: 1000 }, () => ({
      valor_total: 100,
      status: 'autorizada',
      cliente_nome: 'Cliente A',
    }));
    notas.push({ valor_total: 250, status: 'autorizada', cliente_nome: 'Cliente B' });

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.faturamento12m).toBe(100250);
    expect(fontes.notasConsideradas).toBe(1001);
    expect(fontes.truncado).toBe(false);
    expect(intervalos.filter((i) => i.tabela === 'notas_fiscais')).toEqual([
      { tabela: 'notas_fiscais', de: 0, ate: 999 },
      { tabela: 'notas_fiscais', de: 1000, ate: 1999 },
    ]);
  });

  it('avisa quando a trava de seguranca trunca a leitura', async () => {
    paginaSempreCheia = true;
    notas = Array.from({ length: 1000 }, () => ({
      valor_total: 10,
      status: 'autorizada',
      cliente_nome: 'Cliente A',
    }));

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.truncado).toBe(true);
    expect(intervalos.filter((i) => i.tabela === 'notas_fiscais')).toHaveLength(100);
  });

  it('descarta notas canceladas e notas sem cliente quando ha venda identificada', async () => {
    notas = [
      { valor_total: 60_000, status: 'autorizada', cliente_nome: 'Cliente A' },
      { valor_total: 40_000, status: 'CANCELADA', cliente_nome: 'Cliente B' },
      { valor_total: 500_000, status: 'autorizada', cliente_nome: null, cliente_cnpj: null },
    ];

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.faturamento12m).toBe(60000);
    expect(fontes.notasConsideradas).toBe(1);
    expect(fontes.fonteFaturamento).toBe('notas_fiscais');
  });

  it('usa todas as notas quando nenhuma tem cliente identificado', async () => {
    notas = [
      { valor_total: 30_000, status: 'autorizada', cliente_nome: null, cliente_cnpj: null },
      { valor_total: 20_000, status: 'autorizada', cliente_nome: '', cliente_cnpj: '' },
    ];

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.faturamento12m).toBe(50000);
    expect(fontes.notasConsideradas).toBe(2);
  });

  it('cai para titulos a receber e depois para sem_dados', async () => {
    titulos = [{ valor: 80_000 }];
    const comTitulos = await buscarFontesContabeis('empresa-1');
    expect(comTitulos.faturamento12m).toBe(80000);
    expect(comTitulos.fonteFaturamento).toBe('contas_receber');
    expect(comTitulos.titulosConsiderados).toBe(1);

    titulos = [];
    const semNada = await buscarFontesContabeis('empresa-1');
    expect(semNada.faturamento12m).toBe(0);
    expect(semNada.fonteFaturamento).toBe('sem_dados');
  });

  it('separa compras com fornecedor da folha e dos impostos', async () => {
    pagar = [
      { valor: 15_000, status: 'pago', fornecedor_id: 'forn-1', fornecedor_nome: 'Fornecedor X' },
      { valor: 9_000, status: 'pago', fornecedor_id: null, fornecedor_nome: 'Fornecedor Y' },
      { valor: 20_000, status: 'pago', categoria: 'Folha de pagamento', descricao: 'Salários' },
      { valor: 3_000, status: 'pago', categoria_nome: 'FGTS', descricao: 'Guia FGTS' },
      {
        valor: 5_000,
        status: 'cancelado',
        fornecedor_id: 'forn-3',
        fornecedor_nome: 'Fornecedor Z',
      },
    ];

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.comprasServicos12m).toBe(24000);
    expect(fontes.folha12m).toBe(23000);
    expect(fontes.fonteFolha).toBe('contas_pagar');
  });

  it('nao conta folha lancada com fornecedor como compra', async () => {
    pagar = [
      { valor: 15_000, status: 'pago', fornecedor_id: 'forn-1', fornecedor_nome: 'Fornecedor X' },
      {
        valor: 20_000,
        status: 'pago',
        fornecedor_id: 'forn-folha',
        fornecedor_nome: 'Contabilidade RH',
        categoria: 'Folha de pagamento',
        descricao: 'Salários',
      },
    ];

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.comprasServicos12m).toBe(15000);
    expect(fontes.folha12m).toBe(20000);
  });

  it('usa a folha mensal do Historico Financeiro com precedencia sobre contas a pagar', async () => {
    pagar = [
      { valor: 20_000, status: 'pago', categoria: 'Folha de pagamento', descricao: 'Salários' },
    ];
    folha = [
      { valor_total: 12_000, total_folha: 12_000 },
      { valor_total: 13_500, total_folha: 13_500 },
    ];

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.folha12m).toBe(25500);
    expect(fontes.fonteFolha).toBe('folha_pagamento');
  });

  it('soma salarios + encargos quando a folha mensal nao tem total', async () => {
    folha = [{ salarios: 10_000, encargos: 3_200, beneficios: 800, pro_labore: 3_500 }];

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.folha12m).toBe(17500);
    expect(fontes.fonteFolha).toBe('folha_pagamento');
  });

  it('apura a remuneracao (salarios + pro-labore) separada dos encargos', async () => {
    folha = [
      { salarios: 10_000, encargos: 3_000, beneficios: 1_000, pro_labore: 4_000 },
      { valor_total: 8_000 },
    ];

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.folha12m).toBe(26000);
    // A competencia sem detalhamento contribui pelo total da linha (8.000), nao por
    // zero: antes o mes sem salarios/pro-labore sumia da base da CPP.
    expect(fontes.remuneracao12m).toBe(22000);
  });

  it('nao conta rescisao de contrato com fornecedor como folha', async () => {
    pagar = [
      {
        valor: 5_000,
        status: 'pago',
        fornecedor_id: 'forn-1',
        fornecedor_nome: 'Construtora X',
        categoria: 'Servicos',
        categoria_nome: 'Servicos terceirizados',
        descricao: 'Rescisao de contrato de fornecimento',
      },
      {
        valor: 9_000,
        status: 'pago',
        fornecedor_id: null,
        fornecedor_nome: null,
        categoria: 'Folha',
        categoria_nome: 'Folha de pagamento',
        descricao: 'Rescisao trabalhista do funcionario',
      },
    ];

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.folha12m).toBe(9000);
    expect(fontes.comprasServicos12m).toBe(5000);
  });

  it('conta rescisao de funcionario sem categoria de folha como folha', async () => {
    pagar = [
      {
        valor: 7_000,
        status: 'pago',
        fornecedor_id: 'forn-1',
        fornecedor_nome: 'Transportadora X',
        categoria: 'Servicos',
        categoria_nome: 'Servicos terceirizados',
        descricao: 'Rescisao do funcionario',
      },
    ];

    const fontes = await buscarFontesContabeis('empresa-1');

    // "Rescisao do funcionario" nao tem a categoria Folha e a preposicao no meio
    // impedia o termo antigo: sem a folha, o Fator R cai e o Simples vai ao Anexo V.
    expect(fontes.folha12m).toBe(7000);
    expect(fontes.comprasServicos12m).toBe(0);
  });

  it('corta notas e contas a pagar na janela de competencias fechadas', async () => {
    vi.useFakeTimers({ now: new Date('2026-11-26T12:00:00Z') });
    const nota = (valor: number, data: string): LinhaNota => ({
      valor_total: valor,
      status: 'autorizada',
      cliente_nome: 'Cliente A',
      data_emissao: data,
    });
    const compra = (valor: number, data: string): LinhaPagar => ({
      valor,
      status: 'pago',
      fornecedor_id: 'forn-1',
      fornecedor_nome: 'Fornecedor A',
      categoria: 'Insumos',
      categoria_nome: 'Mercadorias',
      descricao: 'Compra de insumos',
      data_emissao: data,
    });
    notas = [
      nota(100, '2025-10-31'),
      nota(200, '2025-11-01'),
      nota(400, '2026-11-01'),
      nota(800, '2026-11-26'),
    ];
    pagar = [compra(50, '2025-11-01'), compra(60, '2026-11-01')];

    const fontes = await buscarFontesContabeis('empresa-1');
    vi.useRealTimers();

    // janela = [01/11/2025, 01/11/2026): o mes em aberto (nov/2026) e o mes anterior
    // ao inicio ficam fora, como na folha.
    expect(fontes.faturamento12m).toBe(200);
    expect(fontes.comprasServicos12m).toBe(50);
    for (const tabela of ['notas_fiscais', 'contas_pagar']) {
      expect(filtros.filter((f) => f.tabela === tabela && f.coluna === 'data_emissao')).toEqual([
        { tabela, coluna: 'data_emissao', valor: '2025-11-01' },
        { tabela, coluna: 'data_emissao', valor: '2026-11-01' },
      ]);
    }
  });

  it('cai na folha total quando a folha nao detalha salarios e pro-labore', async () => {
    folha = [{ valor_total: 12_000 }, { total_folha: 13_500 }];

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.folha12m).toBe(25500);
    expect(fontes.remuneracao12m).toBe(25500);
  });

  it('limita a folha as competencias fechadas dos ultimos 12 meses', async () => {
    vi.useFakeTimers({ now: new Date('2026-11-26T12:00:00Z') });
    folha = [
      { valor_total: 10_000, mes_referencia: '2025-10-01' },
      { valor_total: 20_000, mes_referencia: '2025-11-01' },
      { valor_total: 30_000, mes_referencia: '2026-10-01' },
      { valor_total: 40_000, mes_referencia: '2026-11-01' },
      { valor_total: 50_000, mes_referencia: '2026-12-01' },
    ];

    const fontes = await buscarFontesContabeis('empresa-1');
    vi.useRealTimers();

    // entram o limite inferior (nov/2025) e a ultima competencia fechada (out/2026)
    expect(fontes.folha12m).toBe(50000);
    expect(filtros).toContainEqual({
      tabela: 'folha_pagamento',
      coluna: 'mes_referencia',
      valor: '2025-11-01',
    });
    expect(filtros).toContainEqual({
      tabela: 'folha_pagamento',
      coluna: 'mes_referencia',
      valor: '2026-11-01',
    });
  });

  it('nao trata "Folhas de papel A4" como folha salarial', async () => {
    pagar = [
      {
        valor: 5_000,
        status: 'pago',
        fornecedor_id: 'forn-1',
        fornecedor_nome: 'Papelaria',
        descricao: 'Folhas de papel A4',
      },
      {
        valor: 20_000,
        status: 'pago',
        fornecedor_id: 'forn-2',
        fornecedor_nome: 'Contabilidade RH',
        descricao: 'Folha de pagamento dos funcionários',
      },
    ];

    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.comprasServicos12m).toBe(5000);
    expect(fontes.folha12m).toBe(20000);
  });

  it('marca sem_dados quando nao ha folha de nenhuma fonte', async () => {
    const fontes = await buscarFontesContabeis('empresa-1');

    expect(fontes.folha12m).toBe(0);
    expect(fontes.fonteFolha).toBe('sem_dados');
  });

  it('propaga o erro do banco', async () => {
    erro = { message: 'permission denied' };
    await expect(buscarFontesContabeis('empresa-1')).rejects.toEqual({
      message: 'permission denied',
    });
  });
});
