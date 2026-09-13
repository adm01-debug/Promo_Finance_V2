/**
 * Testes — useImportacaoXMLNFe: créditos CBS/IBS (Etapa 19)
 *
 * Os dois inserts em `creditos_tributarios` tinham o resultado descartado,
 * enquanto `totalCBS`/`totalIBS` eram incrementados logo abaixo e a nota era
 * marcada como `importado`. O resumo da importação anunciava crédito que não
 * existia no banco — e `notas_fiscais.chave_acesso` é UNIQUE, então a
 * reimportação batia em 23505 e a nota ficava sem crédito para sempre.
 *
 * Os dois créditos passaram a ir num único insert (o PostgREST executa o array
 * como um comando só) e a falha desfaz a nota, devolvendo a chave para retry.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Resultado = { data: unknown; error: unknown; count?: number | null };

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom, auth: { getUser: mockGetUser } },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { useImportacaoXMLNFe } from '../useImportacaoXMLNFe';

/** NF-e mínima: o parser só precisa de infNFe/ide/emit/total. */
const XML_NFE = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc><NFe><infNFe Id="NFe35260312345678000199550010000000011000000017">
  <ide><nNF>1</nNF><serie>1</serie><dhEmi>2026-03-31T22:30:00-03:00</dhEmi><natOp>Compra</natOp></ide>
  <emit><CNPJ>12345678000199</CNPJ><xNome>Fornecedor SA</xNome></emit>
  <dest><CNPJ>98765432000188</CNPJ></dest>
  <total><ICMSTot><vNF>1000.00</vNF><vProd>1000.00</vProd><vBC>1000.00</vBC><vICMS>180.00</vICMS></ICMSTot></total>
</infNFe></NFe></nfeProc>`;

type Escrita = { tabela: string; metodo: string; payload: unknown };

function criarChain(resultado: Resultado, registro: Escrita[], tabela: string) {
  const chain: Record<string, unknown> = {};
  for (const metodo of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'single']) {
    chain[metodo] = vi.fn((...args: unknown[]) => {
      if (['insert', 'update', 'delete'].includes(metodo)) {
        registro.push({ tabela, metodo, payload: args[0] });
      }
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

function arquivoXML(): File {
  return { name: 'nfe.xml', text: () => Promise.resolve(XML_NFE) } as unknown as File;
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
});

async function montaHook(respostas: Record<string, Resultado[]>) {
  const escritas = montaCliente(respostas);
  const { result } = renderHook(() => useImportacaoXMLNFe(), { wrapper });

  await act(async () => {
    await result.current.processarArquivos([arquivoXML()] as unknown as FileList);
  });
  await waitFor(() => expect(result.current.nfesParsed).toHaveLength(1));

  return { result, escritas };
}

const NOTA_OK: Resultado = { data: { id: 'nf-1' }, error: null };

describe('importarNFes — créditos CBS/IBS', () => {
  it('grava CBS e IBS num único insert e contabiliza depois de confirmado', async () => {
    const { result, escritas } = await montaHook({
      notas_fiscais: [NOTA_OK],
      creditos_tributarios: [{ data: [{ id: 'c1' }, { id: 'c2' }], error: null }],
    });

    let resumo!: Awaited<ReturnType<typeof result.current.importarNFes.mutateAsync>>;
    await act(async () => {
      resumo = await result.current.importarNFes.mutateAsync();
    });

    const inserts = escritas.filter(
      (e) => e.tabela === 'creditos_tributarios' && e.metodo === 'insert'
    );
    expect(inserts).toHaveLength(1);
    expect(inserts[0].payload).toHaveLength(2);
    expect(resumo.sucesso).toBe(1);
    expect(resumo.creditosGerados.total).toBeGreaterThan(0);
  });

  it('usa a data local da emissão, não a conversão para UTC', async () => {
    // Emissão 31/03 às 22:30 (-03:00). `toISOString()` levava para 01/04 em
    // UTC, divergindo do `competencia_origem` calculado com getters locais.
    const { result, escritas } = await montaHook({
      notas_fiscais: [NOTA_OK],
      creditos_tributarios: [{ data: [{ id: 'c1' }, { id: 'c2' }], error: null }],
    });

    await act(async () => {
      await result.current.importarNFes.mutateAsync();
    });

    const [credito] = (
      escritas.find((e) => e.tabela === 'creditos_tributarios')!.payload as Array<{
        data_origem: string;
        competencia_origem: string;
      }>
    ).slice(0, 1);

    expect(credito.data_origem.slice(0, 7)).toBe(credito.competencia_origem);
  });

  it('não contabiliza crédito que o banco recusou', async () => {
    const { result } = await montaHook({
      notas_fiscais: [NOTA_OK, { data: [{ id: 'nf-1' }], error: null }],
      creditos_tributarios: [{ data: null, error: { code: '42501', message: 'sem permissão' } }],
    });

    let resumo!: Awaited<ReturnType<typeof result.current.importarNFes.mutateAsync>>;
    await act(async () => {
      resumo = await result.current.importarNFes.mutateAsync();
    });

    expect(resumo.sucesso).toBe(0);
    expect(resumo.erros).toBe(1);
    expect(resumo.creditosGerados.total).toBe(0);
  });

  it('desfaz a nota quando o crédito falha, liberando a chave para reimportação', async () => {
    const { result, escritas } = await montaHook({
      notas_fiscais: [NOTA_OK, { data: [{ id: 'nf-1' }], error: null }],
      creditos_tributarios: [{ data: null, error: { code: '42501', message: 'sem permissão' } }],
    });

    await act(async () => {
      await result.current.importarNFes.mutateAsync();
    });

    expect(escritas.some((e) => e.tabela === 'notas_fiscais' && e.metodo === 'delete')).toBe(true);
  });

  it('diz o que ficou no banco quando o próprio rollback falha', async () => {
    const { result } = await montaHook({
      notas_fiscais: [NOTA_OK, { data: [], error: null }], // delete não atinge linha
      creditos_tributarios: [{ data: null, error: { code: '42501', message: 'sem permissão' } }],
    });

    let resumo!: Awaited<ReturnType<typeof result.current.importarNFes.mutateAsync>>;
    await act(async () => {
      resumo = await result.current.importarNFes.mutateAsync();
    });

    expect(resumo.nfesProcessadas[0].mensagemErro).toMatch(/permaneceu no banco/);
    expect(resumo.nfesProcessadas[0].mensagemErro).toMatch(/Remova-a antes de reimportar/);
  });

  it('falha quando o insert em lote grava menos créditos do que os enviados', async () => {
    const { result } = await montaHook({
      notas_fiscais: [NOTA_OK, { data: [{ id: 'nf-1' }], error: null }],
      creditos_tributarios: [{ data: [{ id: 'c1' }], error: null }],
    });

    let resumo!: Awaited<ReturnType<typeof result.current.importarNFes.mutateAsync>>;
    await act(async () => {
      resumo = await result.current.importarNFes.mutateAsync();
    });

    expect(resumo.erros).toBe(1);
    expect(resumo.nfesProcessadas[0].mensagemErro).toMatch(/1 de 2 registros/);
  });
});
