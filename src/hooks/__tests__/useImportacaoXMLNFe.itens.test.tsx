/**
 * Testes — useImportacaoXMLNFe: itens da nota no payload (etapa 45)
 *
 * A etapa 45 fez os itens subirem na mesma chamada de `registrar_nfe_com_creditos`
 * que grava a nota e os créditos. Antes, a nota importada por XML ficava sem
 * itens e não havia como conferir os totais IBS/CBS (rejeição 1091) nem apurar
 * crédito por item nessa via.
 *
 * O payload é contrato com a RPC: cada chave precisa existir na tabela de itens
 * e chegar no formato que a coluna guarda (fração decimal para os `p*`). Um erro
 * aqui é silencioso — a RPC grava NULL e o item fica sem o grupo fiscal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { mockFrom, mockRpc, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom, rpc: mockRpc, auth: { getUser: mockGetUser } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { useImportacaoXMLNFe } from '../useImportacaoXMLNFe';

const FIXTURES = resolve(__dirname, '../../../supabase/functions/_shared/sefaz/__fixtures__');

function arquivo(nome: string): File {
  const xml = readFileSync(resolve(FIXTURES, nome), 'utf8');
  return { name: nome, text: () => Promise.resolve(xml) } as unknown as File;
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  mockRpc.mockResolvedValue({ data: { id: 'nf-1' }, error: null });
  mockFrom.mockImplementation(() => {
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'single', 'limit', 'lte', 'or']) {
      chain[m] = vi.fn(() => chain);
    }
    chain.then = (r: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(r);
    return chain;
  });
});

async function importar(nome: string) {
  const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
  await act(async () => {
    await result.current.processarArquivos([arquivo(nome)] as unknown as FileList);
  });
  await waitFor(() => expect(result.current.nfesParsed).toHaveLength(1));

  await act(async () => {
    await result.current.importarNFes.mutateAsync();
  });

  const [funcao, payload] = mockRpc.mock.calls[0] as [string, Record<string, unknown>];
  expect(funcao).toBe('registrar_nfe_com_creditos');
  return payload;
}

describe('useImportacaoXMLNFe — itens no payload da RPC (etapa 45)', () => {
  it('manda um item por det da nota, com o grupo IBS/CBS em fração decimal', async () => {
    const payload = await importar('procNFe-ibscbs-2026.xml');

    const itens = payload.p_itens as Array<Record<string, unknown>>;
    expect(itens).toHaveLength(1);

    const item = itens[0];
    expect(item.n_item).toBe(1);
    expect(item.c_prod).toBe('P1');
    expect(item.ncm).toBe('12345678');
    expect(item.cfop).toBe('5102');
    expect(item.v_prod).toBeCloseTo(100, 2);

    // O XML manda percentual (11.30); a coluna guarda fração (0.113).
    expect(item.p_ibs_uf).toBeCloseTo(0.113, 6);
    expect(item.p_ibs_mun).toBeCloseTo(0.05, 6);
    expect(item.p_cbs).toBeCloseTo(0.09, 6);
    expect(item.v_ibs_uf).toBeCloseTo(5.65, 2);
    expect(item.v_cbs).toBeCloseTo(9, 2);
    expect(item.p_red_aliq).toBeCloseTo(0.5, 6);
    expect(item.p_aliq_efet).toBeCloseTo(0.0565, 6);
  });

  it('não manda v_ibs: a RPC deriva de v_ibs_uf + v_ibs_mun pela constraint', async () => {
    const payload = await importar('procNFe-ibscbs-2026.xml');

    const item = (payload.p_itens as Array<Record<string, unknown>>)[0];
    expect(item).not.toHaveProperty('v_ibs');
  });

  it('preserva a alíquota específica do IS (pISEspec) em ad_rem_is, sem dividir por 100', async () => {
    // pISEspec é R$ por unidade, não percentual: o parser entrega 0.50 do XML e
    // a coluna `ad_rem_is` é numeric(15,4). Sem esse mapeamento o item ficava
    // com NULL mesmo tendo a alíquota específica no documento.
    const payload = await importar('procNFe-ibscbs-2026.xml');

    const item = (payload.p_itens as Array<Record<string, unknown>>)[0];
    expect(item.ad_rem_is).toBeCloseTo(0.5, 6);
    expect(item.p_is).toBeCloseTo(0.01, 6);
    expect(item.v_is).toBeCloseTo(1, 2);
  });
});
