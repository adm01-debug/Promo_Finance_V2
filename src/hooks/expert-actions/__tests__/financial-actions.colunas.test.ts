/**
 * Testes — payloads do EXPERT após a migration 20261113163037.
 *
 * Antes, criarContaPagar/criarContaReceber descartavam o autor e a data de
 * emissão, e agendarCobranca guardava a etapa anterior só em `metadata`.
 * Com as colunas criadas, os valores voltam a ser gravados — autoria em
 * `user_id` (coluna já existente em contas_pagar/contas_receber, não
 * `created_by`).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom, auth: { getUser: mockGetUser } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/formatters', () => ({
  formatCurrency: vi.fn(() => 'R$ 0,00'),
  todayISOLocal: vi.fn(() => '2026-11-13'),
}));

import { criarContaPagar, criarContaReceber, agendarCobranca } from '../financial-actions';
import type { ExpertAction } from '../types';

type Resultado = { data: unknown; error: unknown };
type Escrita = { tabela: string; metodo: string; payload: unknown };

function criarChain(resultado: Resultado, escritas: Escrita[], tabela: string) {
  const chain: Record<string, unknown> = {};
  for (const metodo of ['select', 'insert', 'update', 'eq', 'limit', 'maybeSingle']) {
    chain[metodo] = vi.fn((...args: unknown[]) => {
      if (metodo === 'insert' || metodo === 'update') {
        escritas.push({ tabela, metodo, payload: args[0] });
      }
      return chain;
    });
  }
  chain.then = (resolver: (v: Resultado) => unknown) => Promise.resolve(resultado).then(resolver);
  return chain;
}

function montaCliente(respostas: Record<string, Resultado>) {
  const escritas: Escrita[] = [];
  mockFrom.mockImplementation((tabela: string) =>
    criarChain(respostas[tabela] ?? { data: null, error: null }, escritas, tabela)
  );
  return escritas;
}

const queryClient = { invalidateQueries: vi.fn() } as never;
const ACTION = { descricao: 'Teste', valor: 100 } as ExpertAction;

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
});

describe('criarContaPagar', () => {
  it('grava user_id do autor e data_emissao', async () => {
    const escritas = montaCliente({ empresas: { data: { id: 'emp-1' }, error: null } });

    await criarContaPagar(ACTION, queryClient);

    const insert = escritas.find((e) => e.tabela === 'contas_pagar' && e.metodo === 'insert');
    expect(insert?.payload).toMatchObject({
      empresa_id: 'emp-1',
      user_id: 'user-1',
      data_emissao: '2026-11-13',
    });
    expect(insert?.payload).not.toHaveProperty('created_by');
  });
});

describe('criarContaReceber', () => {
  it('grava user_id do autor (e não created_by)', async () => {
    const escritas = montaCliente({ empresas: { data: { id: 'emp-1' }, error: null } });

    await criarContaReceber(ACTION, queryClient);

    const insert = escritas.find((e) => e.tabela === 'contas_receber' && e.metodo === 'insert');
    expect(insert?.payload).toMatchObject({ empresa_id: 'emp-1', user_id: 'user-1' });
    expect(insert?.payload).not.toHaveProperty('created_by');
  });
});

describe('agendarCobranca', () => {
  it('grava etapa_anterior e etapa_nova em colunas próprias', async () => {
    const escritas = montaCliente({
      contas_receber: {
        data: { id: 'cr-1', etapa_cobranca: 'lembrete', valor: 10, clientes: null },
        error: null,
      },
    });

    await agendarCobranca('cr-1');

    const insert = escritas.find((e) => e.tabela === 'historico_cobranca');
    expect(insert?.payload).toEqual({
      conta_receber_id: 'cr-1',
      etapa: 'cobranca',
      etapa_anterior: 'lembrete',
      etapa_nova: 'cobranca',
    });
  });
});
