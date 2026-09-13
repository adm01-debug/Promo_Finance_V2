/**
 * Testes — useImportLancamentosLote (Etapa 20)
 *
 * Quando as partidas falham, o cabeçalho já gravado precisa ser removido. Esse
 * delete compensatório era ele próprio não verificado: se o rollback falhasse
 * (RLS, linha fora de escopo), o razão ficava com um lançamento com
 * `valor_total` e nenhuma partida — desbalanceado e invisível, porque a
 * importação reportava apenas o erro original das partidas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ParsedLancamento } from '@/lib/lancamentos-csv-importer';

type Resultado = { data: unknown; error: unknown };
type Escrita = { tabela: string; metodo: string };

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom, auth: { getUser: mockGetUser } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

import { useImportLancamentosLote } from '../useLancamentosContabeis';

function criarChain(resultado: Resultado, registro: Escrita[], tabela: string) {
  const chain: Record<string, unknown> = {};
  for (const metodo of ['select', 'insert', 'delete', 'eq', 'maybeSingle', 'single']) {
    chain[metodo] = vi.fn(() => {
      if (['insert', 'delete'].includes(metodo)) registro.push({ tabela, metodo });
      return chain;
    });
  }
  chain.then = (resolver: (v: Resultado) => unknown) => Promise.resolve(resultado).then(resolver);
  return chain;
}

function montaCliente(respostas: Record<string, Resultado[]>) {
  const escritas: Escrita[] = [];
  const consumidas: Record<string, number> = {};
  mockFrom.mockImplementation((tabela: string) => {
    const fila = respostas[tabela] ?? [{ data: [], error: null }];
    const i = Math.min(consumidas[tabela] ?? 0, fila.length - 1);
    consumidas[tabela] = (consumidas[tabela] ?? 0) + 1;
    return criarChain(fila[i], escritas, tabela);
  });
  return escritas;
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

const LANCAMENTO: ParsedLancamento = {
  ref: 'L-001',
  data: '2026-04-10',
  historico: 'Compra de material',
  partidas: [
    { conta_id: 'c-1', tipo: 'D', valor: 100 },
    { conta_id: 'c-2', tipo: 'C', valor: 100 },
  ] as ParsedLancamento['partidas'],
  total_debito: 100,
  total_credito: 100,
  balanceado: true,
  warnings: [],
};

async function importa(respostas: Record<string, Resultado[]>) {
  const escritas = montaCliente(respostas);
  const { result } = renderHook(() => useImportLancamentosLote(), { wrapper });
  const relatorio = await result.current.mutateAsync({
    empresa_id: 'emp-1',
    lancamentos: [LANCAMENTO],
  });
  await waitFor(() => expect(result.current.isPending).toBe(false));
  return { relatorio, escritas };
}

describe('useImportLancamentosLote — rollback do cabeçalho órfão', () => {
  it('importa sem remover nada quando as partidas gravam', async () => {
    const { relatorio, escritas } = await importa({
      lancamentos_contabeis: [{ data: { id: 'lanc-1' }, error: null }],
      partidas_contabeis: [{ data: [{ id: 'p-1' }], error: null }],
    });

    expect(relatorio.sucesso).toBe(1);
    expect(relatorio.falhas).toHaveLength(0);
    expect(escritas.some((e) => e.metodo === 'delete')).toBe(false);
  });

  it('remove o cabeçalho quando as partidas falham', async () => {
    const { relatorio, escritas } = await importa({
      lancamentos_contabeis: [
        { data: { id: 'lanc-1' }, error: null },
        { data: [{ id: 'lanc-1' }], error: null },
      ],
      partidas_contabeis: [{ data: null, error: { code: '23503', message: 'conta inexistente' } }],
    });

    expect(relatorio.sucesso).toBe(0);
    expect(relatorio.falhas).toHaveLength(1);
    expect(relatorio.falhas[0].error).toContain('conta inexistente');
    expect(relatorio.falhas[0].error).not.toMatch(/ficou no razão/);
    expect(escritas).toContainEqual({ tabela: 'lancamentos_contabeis', metodo: 'delete' });
  });

  it('denuncia no relatório quando o próprio rollback é recusado', async () => {
    const { relatorio } = await importa({
      lancamentos_contabeis: [
        { data: { id: 'lanc-1' }, error: null },
        { data: null, error: { code: '42501', message: 'sem permissão' } },
      ],
      partidas_contabeis: [{ data: null, error: { code: '23503', message: 'conta inexistente' } }],
    });

    expect(relatorio.falhas).toHaveLength(1);
    expect(relatorio.falhas[0].error).toContain('conta inexistente');
    expect(relatorio.falhas[0].error).toMatch(/lanc-1 ficou no razão sem partidas/);
    expect(relatorio.falhas[0].error).toContain('política RLS');
  });

  it('denuncia no relatório quando o rollback não atinge linha alguma', async () => {
    // Delete com `error: null` e zero linhas: o cabeçalho continua lá (fora do
    // escopo da RLS, por exemplo) e o antigo código dava isso por resolvido.
    const { relatorio } = await importa({
      lancamentos_contabeis: [
        { data: { id: 'lanc-1' }, error: null },
        { data: [], error: null },
      ],
      partidas_contabeis: [{ data: null, error: { code: '23503', message: 'conta inexistente' } }],
    });

    expect(relatorio.falhas[0].error).toMatch(/lanc-1 ficou no razão sem partidas/);
  });

  it('não tenta rollback quando o próprio cabeçalho não foi criado', async () => {
    const { relatorio, escritas } = await importa({
      lancamentos_contabeis: [{ data: null, error: { code: '42501', message: 'sem permissão' } }],
    });

    expect(relatorio.falhas).toHaveLength(1);
    expect(relatorio.falhas[0].error).not.toMatch(/ficou no razão/);
    expect(escritas.some((e) => e.metodo === 'delete')).toBe(false);
  });
});
