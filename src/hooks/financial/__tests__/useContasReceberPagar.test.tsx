/**
 * Testes de integração para useContasReceber, useContasPagar e suas
 * variantes paginadas. Valida:
 *  - Chamada correta da view tipada (`vw_contas_*_painel`).
 *  - Ordenação por `data_vencimento` ascendente.
 *  - Limite de 1000 registros.
 *  - Filtro por `empresa_id` quando informado (e ausência quando 'all'/undefined).
 *  - Paginação: cálculo correto de `range(from, to)` e `totalPages`.
 *  - Mapeamento coerente das colunas tipadas (`ContasReceberPainelRow` / `ContasPagarPainelRow`).
 *  - Propagação de erro do backend.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// -------------------- Chainable Supabase mock --------------------

type QueryCall = {
  table: string;
  select?: { columns: string; opts?: unknown };
  order?: { column: string; opts?: unknown };
  limit?: number;
  range?: [number, number];
  eq: Array<[string, unknown]>;
  or?: string;
  head?: boolean;
};

const calls: QueryCall[] = [];
type NextResp = { data?: unknown; error?: unknown; count?: number };
let nextResponses: NextResp[] = [];

function makeBuilder(table: string): any {
  const call: QueryCall = { table, eq: [] };
  calls.push(call);
  const chain: any = {
    select(columns: string, opts?: any) {
      call.select = { columns, opts };
      if (opts?.head) call.head = true;
      return chain;
    },
    order(column: string, opts?: any) {
      call.order = { column, opts };
      return chain;
    },
    limit(n: number) {
      call.limit = n;
      return chain;
    },
    range(from: number, to: number) {
      call.range = [from, to];
      return chain;
    },
    eq(col: string, val: unknown) {
      call.eq.push([col, val]);
      return chain;
    },
    or(expr: string) {
      call.or = expr;
      return chain;
    },
    then(resolve: (v: NextResp) => unknown, reject?: (e: unknown) => unknown) {
      const resp = nextResponses.shift() ?? { data: [], error: null, count: 0 };
      return Promise.resolve(resp).then(resolve, reject);
    },
  };
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => makeBuilder(table),
  },
}));

vi.mock('@/lib/supabase-dynamic', () => ({
  supabaseDyn: {
    from: (table: string) => makeBuilder(table),
  },
  sel: (v: string) => v,
}));

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/sound-feedback', () => ({ sounds: { success: vi.fn(), error: vi.fn() } }));

// -------------------- Imports (após mocks) --------------------

import { useContasReceber, useContasReceberPaginated } from '../useContasReceber';
import { useContasPagar, useContasPagarPaginated } from '../useContasPagar';
import type { ContasReceberPainelRow, ContasPagarPainelRow } from '../views.types';

// -------------------- Wrapper --------------------

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  calls.length = 0;
  nextResponses = [];
});

// -------------------- ContasReceber (view) --------------------

describe('useContasReceber', () => {
  it('consulta a view vw_contas_receber_painel ordenando por data_vencimento asc e limit 1000', async () => {
    const row: Partial<ContasReceberPainelRow> = {
      id: 'r1',
      cliente_nome_display: 'ACME',
      valor: 100,
      data_vencimento: '2026-01-15',
      status: 'pendente',
    };
    nextResponses.push({ data: [row], error: null });

    const { result } = renderHook(() => useContasReceber(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe('vw_contas_receber_painel');
    expect(calls[0].order).toEqual({ column: 'data_vencimento', opts: { ascending: true } });
    expect(calls[0].limit).toBe(1000);
    expect(calls[0].eq).toEqual([]);
    expect(result.current.data?.[0].cliente_nome_display).toBe('ACME');
  });

  it("filtra por empresa_id quando informado e ignora quando 'all'", async () => {
    nextResponses.push({ data: [], error: null });
    const { result } = renderHook(() => useContasReceber('emp-42'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(calls[0].eq).toEqual([['empresa_id', 'emp-42']]);

    calls.length = 0;
    nextResponses.push({ data: [], error: null });
    const { result: r2 } = renderHook(() => useContasReceber('all'), { wrapper: wrapper() });
    await waitFor(() => expect(r2.current.isSuccess).toBe(true));
    expect(calls[0].eq).toEqual([]);
  });

  it('propaga erro do backend', async () => {
    nextResponses.push({ data: null, error: new Error('boom') });
    const { result } = renderHook(() => useContasReceber(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('boom');
  });
});

// -------------------- ContasPagar (view) --------------------

describe('useContasPagar', () => {
  it('consulta a view vw_contas_pagar_painel via supabaseDyn com sel(*), order asc e limit 1000', async () => {
    const row: Partial<ContasPagarPainelRow> = {
      id: 'p1',
      fornecedor_nome_display: 'Fornecedor X',
      valor: 200,
      status: 'pendente',
    };
    nextResponses.push({ data: [row], error: null });

    const { result } = renderHook(() => useContasPagar('emp-1'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(calls[0].table).toBe('vw_contas_pagar_painel');
    expect(calls[0].select?.columns).toBe('*');
    expect(calls[0].order).toEqual({ column: 'data_vencimento', opts: { ascending: true } });
    expect(calls[0].limit).toBe(1000);
    expect(calls[0].eq).toEqual([['empresa_id', 'emp-1']]);
    expect(result.current.data?.[0].fornecedor_nome_display).toBe('Fornecedor X');
  });
});

// -------------------- Paginação: contas_receber --------------------

describe('useContasReceberPaginated', () => {
  it('calcula range corretamente e retorna totalPages baseado no count', async () => {
    // ordem esperada de chamadas (Promise.all): countQuery, dataQuery.
    // Ambas partem da mesma tabela `contas_receber`.
    nextResponses.push({ count: 42, data: null, error: null }); // count
    nextResponses.push({ data: [{ id: 'a' }, { id: 'b' }], error: null }); // data

    const { result } = renderHook(
      () => useContasReceberPaginated({ page: 3, pageSize: 10 }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [countCall, dataCall] = calls.filter((c) => c.table === 'contas_receber');
    expect(countCall.head).toBe(true);
    expect(countCall.select?.opts).toMatchObject({ count: 'exact', head: true });
    expect(dataCall.range).toEqual([20, 29]); // (page-1)*pageSize .. from + pageSize -1
    expect(dataCall.order).toEqual({ column: 'data_vencimento', opts: { ascending: true } });

    expect(result.current.data?.totalCount).toBe(42);
    expect(result.current.data?.totalPages).toBe(5);
    expect(result.current.data?.data).toHaveLength(2);
  });

  it('aplica filtros de status, centro de custo, empresa, conta bancária e busca', async () => {
    nextResponses.push({ count: 0, data: null, error: null });
    nextResponses.push({ data: [], error: null });

    const { result } = renderHook(
      () =>
        useContasReceberPaginated({
          page: 1,
          pageSize: 25,
          search: 'foo',
          status: 'pendente',
          centroCustoId: 'cc-1',
          empresaId: 'emp-1',
          contaBancariaId: 'cb-1',
        }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const dataCall = calls.filter((c) => c.table === 'contas_receber')[1];
    expect(dataCall.or).toContain('cliente_nome.ilike.%foo%');
    expect(dataCall.eq).toEqual(
      expect.arrayContaining([
        ['status', 'pendente'],
        ['centro_custo_id', 'cc-1'],
        ['empresa_id', 'emp-1'],
        ['conta_bancaria_id', 'cb-1'],
      ]),
    );
  });

  it("ignora filtros com valor 'all'", async () => {
    nextResponses.push({ count: 0, data: null, error: null });
    nextResponses.push({ data: [], error: null });

    const { result } = renderHook(
      () =>
        useContasReceberPaginated({
          page: 1,
          pageSize: 25,
          status: 'all',
          centroCustoId: 'all',
          empresaId: 'all',
          contaBancariaId: 'all',
        }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const dataCall = calls.filter((c) => c.table === 'contas_receber')[1];
    expect(dataCall.eq).toEqual([]);
  });
});

// -------------------- Paginação: contas_pagar --------------------

describe('useContasPagarPaginated', () => {
  it('calcula range e totalPages para páginas subsequentes', async () => {
    nextResponses.push({ count: 101, data: null, error: null });
    nextResponses.push({ data: [{ id: 'x' }], error: null });

    const { result } = renderHook(
      () => useContasPagarPaginated({ page: 2, pageSize: 50 }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const dataCall = calls.filter((c) => c.table === 'contas_pagar')[1];
    expect(dataCall.range).toEqual([50, 99]);
    expect(result.current.data?.totalPages).toBe(3); // ceil(101/50)
  });

  it('usa fornecedor_nome no filtro de busca', async () => {
    nextResponses.push({ count: 0, data: null, error: null });
    nextResponses.push({ data: [], error: null });

    const { result } = renderHook(
      () => useContasPagarPaginated({ page: 1, pageSize: 10, search: 'acme' }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const dataCall = calls.filter((c) => c.table === 'contas_pagar')[1];
    expect(dataCall.or).toContain('fornecedor_nome.ilike.%acme%');
  });

  it('propaga erro quando a query de count falha', async () => {
    nextResponses.push({ count: null, data: null, error: new Error('count-fail') });
    nextResponses.push({ data: [], error: null });

    const { result } = renderHook(
      () => useContasPagarPaginated({ page: 1, pageSize: 10 }),
      { wrapper: wrapper() },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('count-fail');
  });
});
