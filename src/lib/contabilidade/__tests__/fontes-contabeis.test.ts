import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buscarFontesContabeis, janela12m } from '../fontes-contabeis';

type LinhaNota = {
  valor_total: number | null;
  status: string | null;
  cliente_nome?: string | null;
  cliente_cnpj?: string | null;
};
type LinhaPagar = {
  valor: number | null;
  status: string | null;
  fornecedor_id?: string | null;
  fornecedor_nome?: string | null;
  categoria?: string | null;
  categoria_nome?: string | null;
  descricao?: string | null;
};

type LinhaFolha = {
  valor_total?: number | null;
  total_folha?: number | null;
  salarios?: number | null;
  encargos?: number | null;
  beneficios?: number | null;
  pro_labore?: number | null;
};

let notas: LinhaNota[] = [];
let titulos: Array<{ valor: number | null }> = [];
let pagar: LinhaPagar[] = [];
let folha: LinhaFolha[] = [];
let erro: unknown = null;
/** Quando true, toda pagina vem cheia — simula mais de 100 mil linhas no servidor. */
let paginaSempreCheia = false;
const intervalos: Array<{ tabela: string; de: number; ate: number }> = [];

interface ConsultaFake {
  select: () => ConsultaFake;
  eq: () => ConsultaFake;
  is: () => ConsultaFake;
  neq: () => ConsultaFake;
  gte: () => ConsultaFake;
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
  const api: ConsultaFake = {
    select: () => api,
    eq: () => api,
    is: () => api,
    neq: () => api,
    gte: () => api,
    order: () => api,
    range: (de, ate) => {
      intervalos.push({ tabela, de, ate });
      if (erro) return Promise.resolve({ data: null, error: erro });
      if (paginaSempreCheia) {
        const todas = linhasDa(tabela);
        return Promise.resolve({ data: todas.slice(0, ate - de + 1), error: null });
      }
      return Promise.resolve({ data: linhasDa(tabela).slice(de, ate + 1), error: null });
    },
  };
  return api;
}

vi.mock('@/lib/supabase-dynamic', () => ({
  supabaseDyn: { from: (t: string) => consulta(t) },
}));

beforeEach(() => {
  intervalos.length = 0;
  erro = null;
  paginaSempreCheia = false;
  notas = [];
  titulos = [];
  pagar = [];
  folha = [];
});

describe('janela12m', () => {
  it('devolve a data de corte em ISO (AAAA-MM-DD)', () => {
    expect(janela12m(new Date('2026-11-26T12:00:00Z'))).toBe('2025-11-26');
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
