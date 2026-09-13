/**
 * Testes — useImportacaoXMLNFe: créditos CBS/IBS (Etapas 19 e 21)
 *
 * Etapa 19: os inserts em `creditos_tributarios` tinham o resultado descartado
 * enquanto `totalCBS`/`totalIBS` eram incrementados logo abaixo. O resumo da
 * importação anunciava crédito que não existia no banco — e
 * `notas_fiscais.chave_acesso` é UNIQUE, então a reimportação batia em 23505 e
 * a nota ficava sem crédito para sempre. A correção foi um delete compensatório
 * da nota quando o crédito falhava.
 *
 * Etapa 21 dispensa a compensação. Nota e créditos entram numa transação só
 * (`registrar_nfe_com_creditos`): o crédito falhar desfaz a nota pelo próprio
 * ROLLBACK, sem estado intermediário e sem o segundo delete — que também podia
 * falhar, e para o qual existia uma mensagem de "remova manualmente".
 *
 * A função ainda valida cada chave do payload contra `information_schema`:
 * deriva de schema levanta `colunas_inexistentes_em_notas_fiscais` em vez de
 * descartar o campo em silêncio. `natureza_operacao` e `created_by`, que o
 * types.ts canônico não lista, são exatamente os casos em risco.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Resultado = { data: unknown; error: unknown; count?: number | null };

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
  mockRpc.mockResolvedValue({ data: { id: 'nf-1' }, error: null });
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

describe('importarNFes — créditos CBS/IBS', () => {
  it('grava nota e créditos numa chamada só, e contabiliza depois de confirmado', async () => {
    const { result, escritas } = await montaHook({});

    let resumo!: Awaited<ReturnType<typeof result.current.importarNFes.mutateAsync>>;
    await act(async () => {
      resumo = await result.current.importarNFes.mutateAsync();
    });

    expect(mockRpc).toHaveBeenCalledTimes(1);
    const [nome, payload] = mockRpc.mock.calls[0] as [string, Record<string, unknown>];
    expect(nome).toBe('registrar_nfe_com_creditos');
    expect(payload.p_creditos).toHaveLength(2);

    // Nenhuma escrita direta em tabela: era a segunda requisição que abria a
    // janela entre a nota gravada e o crédito ausente.
    expect(escritas).toEqual([]);
    expect(resumo.sucesso).toBe(1);
    expect(resumo.creditosGerados.total).toBeGreaterThan(0);
  });

  it('manda natureza_operacao e created_by para a função decidir, não os descarta', async () => {
    // A função confere as chaves contra `information_schema.columns`. Omitir
    // aqui o que o types.ts não lista esconderia a deriva em vez de expô-la.
    const { result } = await montaHook({});

    await act(async () => {
      await result.current.importarNFes.mutateAsync();
    });

    const nota = (mockRpc.mock.calls[0][1] as { p_nota: Record<string, unknown> }).p_nota;
    expect(nota).toMatchObject({
      // O parser tira o prefixo `NFe` do atributo `Id`: o que vai para o banco
      // são os 44 dígitos, que é o formato da coluna UNIQUE.
      chave_acesso: '35260312345678000199550010000000011000000017',
      natureza_operacao: 'Compra',
      created_by: 'user-1',
    });
  });

  it('usa a data local da emissão, não a conversão para UTC', async () => {
    // Emissão 31/03 às 22:30 (-03:00). `toISOString()` levava para 01/04 em
    // UTC, divergindo do `competencia_origem` calculado com getters locais.
    const { result } = await montaHook({});

    await act(async () => {
      await result.current.importarNFes.mutateAsync();
    });

    const [credito] = (
      mockRpc.mock.calls[0][1] as {
        p_creditos: Array<{ data_origem: string; competencia_origem: string }>;
      }
    ).p_creditos;

    expect(credito.data_origem.slice(0, 7)).toBe(credito.competencia_origem);
  });

  it('não contabiliza crédito quando a função recusa a gravação', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: '42501', message: 'sem permissão' },
    });
    const { result } = await montaHook({});

    let resumo!: Awaited<ReturnType<typeof result.current.importarNFes.mutateAsync>>;
    await act(async () => {
      resumo = await result.current.importarNFes.mutateAsync();
    });

    expect(resumo.sucesso).toBe(0);
    expect(resumo.erros).toBe(1);
    expect(resumo.creditosGerados.total).toBe(0);
  });

  it('não tenta compensar nada: a falha é desfeita pelo ROLLBACK', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: '23514', message: 'valor_credito invalido' },
    });
    const { result, escritas } = await montaHook({});

    let resumo!: Awaited<ReturnType<typeof result.current.importarNFes.mutateAsync>>;
    await act(async () => {
      resumo = await result.current.importarNFes.mutateAsync();
    });

    expect(escritas.some((e) => e.metodo === 'delete')).toBe(false);
    // A mensagem de "permaneceu no banco / remova antes de reimportar" perdeu
    // o motivo de existir: a chave volta livre para reimportação.
    expect(resumo.nfesProcessadas[0].mensagemErro).not.toMatch(/permaneceu no banco/);
  });

  it('reporta a deriva de schema em vez de gravar a nota sem os campos', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: {
        code: '42703',
        message: 'colunas_inexistentes_em_notas_fiscais: created_by, natureza_operacao',
      },
    });
    const { result } = await montaHook({});

    let resumo!: Awaited<ReturnType<typeof result.current.importarNFes.mutateAsync>>;
    await act(async () => {
      resumo = await result.current.importarNFes.mutateAsync();
    });

    expect(resumo.erros).toBe(1);
    // `mensagemAmigavel` troca a mensagem crua do PostgREST pela frase do
    // código 42703 — o detalhe com os nomes das colunas fica no log, não na
    // tela. O que o teste garante é que a importação para em vez de gravar.
    expect(resumo.nfesProcessadas[0].mensagemErro).toMatch(/Coluna inexistente/);
  });
});
