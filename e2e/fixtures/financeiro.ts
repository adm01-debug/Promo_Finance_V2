import type { Page, Route } from '@playwright/test';
import { EMPRESA_OFFLINE, USUARIO_OFFLINE, garantirBaselineOffline } from './sessao';

/**
 * Fixtures do domínio financeiro (contas a pagar e conciliação bancária) para
 * o gate offline da Etapa 31.
 *
 * As datas são derivadas do relógio da máquina, não fixadas em constante: as
 * telas classificam por "vence hoje" e "pago no mês", e uma data cravada faria
 * o mesmo teste virar de veredito na passagem do mês — o modo de falha mais
 * caro que um gate bloqueante pode ter.
 */

// ---------- Datas relativas ----------

function isoDia(deslocamentoEmDias = 0): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + deslocamentoEmDias);
  return d.toISOString().slice(0, 10);
}

/** Hoje ao meio-dia local — evita que o fuso jogue a data para o dia anterior. */
export const HOJE = isoDia(0);
export const ONTEM = isoDia(-1);
export const DAQUI_30_DIAS = isoDia(30);

// ---------- Contas a pagar ----------

export interface ContaPagarFixture {
  id: string;
  descricao: string;
  valor: number;
  valor_pago: number | null;
  data_vencimento: string;
  data_pagamento: string | null;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  fornecedor_nome: string | null;
  empresa_id: string;
  categoria: string | null;
  centro_custo_id: string | null;
  conta_bancaria_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function makeContaPagar(overrides: Partial<ContaPagarFixture> = {}): ContaPagarFixture {
  return {
    id: 'cp-1',
    descricao: 'Conta de energia — matriz',
    valor: 1000,
    valor_pago: null,
    data_vencimento: HOJE,
    data_pagamento: null,
    status: 'pendente',
    fornecedor_nome: 'Energia SA',
    empresa_id: EMPRESA_OFFLINE.id,
    categoria: null,
    centro_custo_id: null,
    conta_bancaria_id: null,
    user_id: USUARIO_OFFLINE.id,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * Cenário de KPI com um representante de cada ramo do cálculo em
 * `useContasPagarLogic`. Os valores são escolhidos para que cada KPI tenha um
 * total único: um erro que trocasse um ramo pelo outro mudaria o número na
 * tela em vez de coincidir.
 *
 * Esperado: Total a Pagar 1.500,00 · Vencido 500,00 · Pago no Mês 300,00 ·
 * Vence Hoje 1.
 */
export function cenarioKpisContasPagar(): ContaPagarFixture[] {
  return [
    makeContaPagar({
      id: 'cp-pendente-hoje',
      descricao: 'Energia — vence hoje',
      valor: 1000,
      data_vencimento: HOJE,
      status: 'pendente',
    }),
    makeContaPagar({
      id: 'cp-vencida',
      descricao: 'Aluguel — em atraso',
      valor: 500,
      data_vencimento: ONTEM,
      status: 'vencido',
      fornecedor_nome: 'Imobiliária Central',
    }),
    makeContaPagar({
      id: 'cp-paga',
      descricao: 'Internet — quitada',
      valor: 300,
      valor_pago: 300,
      data_vencimento: ONTEM,
      data_pagamento: HOJE,
      status: 'pago',
      fornecedor_nome: 'Telecom BR',
    }),
    makeContaPagar({
      id: 'cp-cancelada',
      // Valor propositalmente grande: se o cancelamento deixar de excluir a
      // conta do total, o KPI erra por uma ordem de grandeza, não por pouco.
      descricao: 'Pedido cancelado',
      valor: 90000,
      data_vencimento: DAQUI_30_DIAS,
      status: 'cancelado',
      fornecedor_nome: 'Fornecedor Cancelado',
    }),
  ];
}

/**
 * Intercepta as leituras da tela de Contas a Pagar.
 *
 * `useContasPagarPaginated` dispara duas requisições: a lista, contra a view
 * `vw_contas_pagar_painel`, e uma contagem `HEAD` contra a tabela
 * `contas_pagar`, cujo total o PostgREST devolve no header `Content-Range`.
 * Sem esse header o supabase-js lê `count: null` e o rodapé de paginação
 * mostra zero registros sobre uma lista cheia.
 */
export async function mockContasPagar(
  page: Page,
  { contas = cenarioKpisContasPagar() }: { contas?: ContaPagarFixture[] } = {}
) {
  await garantirBaselineOffline(page);

  await page.route('**/rest/v1/**', async (route: Route) => {
    const url = route.request().url();
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    if (url.includes('vw_contas_pagar_painel')) return json(contas);

    if (url.includes('/contas_pagar')) {
      // `head: true` — corpo vazio, total só no Content-Range.
      if (route.request().method() === 'HEAD') {
        return route.fulfill({
          status: 200,
          headers: {
            'content-type': 'application/json',
            'content-range': `0-${Math.max(contas.length - 1, 0)}/${contas.length}`,
          },
          body: '',
        });
      }
      return json(contas);
    }

    return route.fallback();
  });
}

// ---------- Conciliação bancária ----------

export interface TransacaoBancariaFixture {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'credito' | 'debito';
  conciliada: boolean;
  status: string;
  banco: string | null;
  documento: string | null;
  conta_bancaria_id: string | null;
  empresa_id: string;
  user_id: string;
  created_at: string;
}

export function makeTransacaoBancaria(
  overrides: Partial<TransacaoBancariaFixture> = {}
): TransacaoBancariaFixture {
  return {
    id: 'tx-1',
    descricao: 'PAGAMENTO FORNECEDOR E2E',
    valor: 1500.5,
    data: HOJE,
    tipo: 'debito',
    conciliada: false,
    status: 'pendente',
    banco: 'Banco do Brasil',
    documento: '12345',
    conta_bancaria_id: null,
    empresa_id: EMPRESA_OFFLINE.id,
    user_id: USUARIO_OFFLINE.id,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export interface ContaBancariaFixture {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: string;
  saldo_atual: number;
  ativo: boolean;
  empresa_id: string;
  configuracoes_conciliacao: Record<string, unknown> | null;
}

export const CONTA_BANCARIA_OFFLINE: ContaBancariaFixture = {
  id: '00000000-0000-4000-8000-0000000000c1',
  banco: 'Banco do Brasil',
  agencia: '1234',
  conta: '56789-0',
  tipo: 'corrente',
  saldo_atual: 25000,
  ativo: true,
  empresa_id: EMPRESA_OFFLINE.id,
  configuracoes_conciliacao: { tolerancia_centavos: 0.5, aceite_automatico: false },
};

/**
 * Conta a pagar com o MESMO valor da transação default, para que a Conciliação
 * Manual tenha um candidato de "Valor exato" a selecionar. Sem lançamento
 * compatível o diálogo abre no estado vazio e o botão de confirmar nasce
 * desabilitado — o fluxo de dinheiro nunca seria exercitado.
 */
export function contaPagarConciliavel(
  overrides: Partial<ContaPagarFixture> = {}
): ContaPagarFixture {
  return makeContaPagar({
    id: 'cp-conciliavel',
    descricao: 'NF 4821 — brindes corporativos',
    valor: 1500.5,
    data_vencimento: HOJE,
    status: 'pendente',
    fornecedor_nome: 'Fornecedor Teste LTDA',
    conta_bancaria_id: CONTA_BANCARIA_OFFLINE.id,
    ...overrides,
  });
}

export interface ConciliacaoMockOptions {
  transacoes?: TransacaoBancariaFixture[];
  /** Vira os lançamentos do sistema listados na Conciliação Manual. */
  contasPagar?: ContaPagarFixture[];
  contaBancaria?: ContaBancariaFixture;
}

/**
 * Intercepta as leituras da tela de Conciliação.
 *
 * Além do PostgREST, semeia `pf:current-bank-account-id`. Isso não é detalhe de
 * conveniência: `useTransacoesBancariasSelecionadas` só dispara a consulta
 * quando há banco selecionado, e sem a chave a tela abre com a lista vazia —
 * um teste de conciliação que nunca vê uma transação passa por vacuidade.
 */
export async function mockConciliacao(page: Page, opts: ConciliacaoMockOptions = {}) {
  const {
    transacoes = [makeTransacaoBancaria()],
    contasPagar = [contaPagarConciliavel()],
    contaBancaria = CONTA_BANCARIA_OFFLINE,
  } = opts;

  const transacoesDaConta = transacoes.map((t) => ({
    ...t,
    conta_bancaria_id: t.conta_bancaria_id ?? contaBancaria.id,
  }));

  await page.addInitScript((contaId) => {
    try {
      window.localStorage.setItem('pf:current-bank-account-id', contaId);
    } catch {
      /* storage indisponível — o teste falha na asserção, não aqui */
    }
  }, contaBancaria.id);

  await garantirBaselineOffline(page);

  await page.route('**/rest/v1/**', async (route: Route) => {
    const url = route.request().url();
    const json = (body: unknown) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    const aceitaObjeto = (route.request().headers()['accept'] ?? '').includes('vnd.pgrst.object');

    // Lançamentos do sistema ofertados na Conciliação Manual.
    if (url.includes('vw_contas_pagar_painel')) return json(contasPagar);

    if (url.includes('contas_bancarias')) {
      return aceitaObjeto ? json(contaBancaria) : json([contaBancaria]);
    }

    if (url.includes('transacoes_bancarias')) {
      // `.single()` pede um objeto, não um array — o supabase-js manda
      // `Accept: application/vnd.pgrst.object+json` justamente nesse caso.
      if (aceitaObjeto) {
        const id = /id=eq\.([^&]+)/.exec(url)?.[1];
        const achada = transacoesDaConta.find((t) => t.id === id) ?? transacoesDaConta[0];
        return achada
          ? json(achada)
          : route.fulfill({
              status: 406,
              contentType: 'application/json',
              body: JSON.stringify({ code: 'PGRST116', message: 'sem linhas' }),
            });
      }
      return json(transacoesDaConta);
    }

    return route.fallback();
  });
}
