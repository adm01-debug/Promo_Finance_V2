/**
 * Testes — useImportacaoXMLNFe: leitura do grupo IBS/CBS/IS (etapa 41)
 *
 * A etapa 41 faz o parser do XML ler o grupo tributário novo (`det/imposto/IBSCBS`,
 * `det/imposto/IS` e os totais `total/IBSCBSTot`/`total/ISTot`) em vez de só estimar
 * o crédito pela alíquota de transição. Estes testes usam a fixture 2026 completa
 * (`procNFe-ibscbs-2026.xml`) para provar que os valores destacados chegam ao objeto
 * `NFeParsed`, e a fixture antiga (`procNFe-ok.xml`) para provar que nota sem grupo
 * continua parseando sem alteração.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
  mockFrom.mockImplementation(() => {
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'single']) {
      chain[m] = vi.fn(() => chain);
    }
    chain.then = (r: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(r);
    return chain;
  });
});

async function parsear(nome: string) {
  const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
  await act(async () => {
    await result.current.processarArquivos([arquivo(nome)] as unknown as FileList);
  });
  await waitFor(() => expect(result.current.nfesParsed).toHaveLength(1));
  return result.current.nfesParsed[0];
}

/** NF-e no leiaute anterior à reforma: tem item, mas nenhum grupo IBS/CBS/IS. */
const XML_ANTIGA = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><NFe>
  <infNFe Id="NFe35260312345678000199550010000000011000000017" versao="4.00">
    <ide><nNF>1</nNF><serie>1</serie><dhEmi>2026-03-31T22:30:00-03:00</dhEmi><natOp>Compra</natOp></ide>
    <emit><CNPJ>12345678000199</CNPJ><xNome>Fornecedor SA</xNome></emit>
    <dest><CNPJ>98765432000188</CNPJ></dest>
    <det nItem="1"><prod><cProd>P1</cProd><xProd>PRODUTO</xProd><NCM>12345678</NCM><CFOP>5102</CFOP><qCom>1.0000</qCom><vUnCom>100.00</vUnCom><vProd>100.00</vProd></prod>
      <imposto><ICMS><ICMS00><orig>0</orig><CST>00</CST><vBC>100.00</vBC><vICMS>18.00</vICMS></ICMS00></ICMS></imposto>
    </det>
    <total><ICMSTot><vNF>100.00</vNF><vProd>100.00</vProd><vBC>100.00</vBC><vICMS>18.00</vICMS></ICMSTot></total>
  </infNFe></NFe></nfeProc>`;

describe('useImportacaoXMLNFe — grupo IBS/CBS/IS (etapa 41)', () => {
  it('lê o grupo IBSCBS e IS destacado no item da nota 2026', async () => {
    const nfe = await parsear('procNFe-ibscbs-2026.xml');

    const item = nfe.itens[0];
    expect(item.ibscbs).toBeDefined();
    expect(item.ibscbs?.cst).toBe('200');
    expect(item.ibscbs?.cClassTrib).toBe('000123');
    expect(item.ibscbs?.vBC).toBeCloseTo(100, 6);
    // percentual do XML (11.30) vira fração decimal (0.113) como no banco
    expect(item.ibscbs?.pIBSUF).toBeCloseTo(0.113, 6);
    expect(item.ibscbs?.vIBSUF).toBeCloseTo(5.65, 6);
    expect(item.ibscbs?.pIBSMun).toBeCloseTo(0.05, 6);
    expect(item.ibscbs?.vIBSMun).toBeCloseTo(5, 6);
    expect(item.ibscbs?.pCBS).toBeCloseTo(0.09, 6);
    expect(item.ibscbs?.vCBS).toBeCloseTo(9, 6);
    expect(item.ibscbs?.vIBS).toBeCloseTo(10.65, 6);
    expect(item.ibscbs?.gRedUF?.pRedAliq).toBeCloseTo(0.5, 6);
    expect(item.ibscbs?.gRedMun?.pRedAliq).toBeCloseTo(0.3, 6);
    expect(item.ibscbs?.gRedCBS?.pRedAliq).toBeCloseTo(0.1, 6);

    expect(item.is).toBeDefined();
    expect(item.is?.cstIs).toBe('200');
    expect(item.is?.vBCIs).toBeCloseTo(100, 6);
    expect(item.is?.pIs).toBeCloseTo(0.01, 6);
    expect(item.is?.vIs).toBeCloseTo(1, 6);
  });

  it('lê os totais IBSCBSTot e ISTot da nota 2026', async () => {
    const nfe = await parsear('procNFe-ibscbs-2026.xml');

    expect(nfe.ibscbs).toBeDefined();
    expect(nfe.ibscbs?.vBCIBSCBS).toBeCloseTo(100, 6);
    expect(nfe.ibscbs?.vIBS).toBeCloseTo(10.65, 6);
    expect(nfe.ibscbs?.vCBS).toBeCloseTo(9, 6);
    expect(nfe.ibscbs?.vIBS_UF).toBeCloseTo(5.65, 6);
    expect(nfe.ibscbs?.vIBS_Mun).toBeCloseTo(5, 6);
    expect(nfe.ibscbs?.vIS).toBeCloseTo(1, 6);
    // pISEspec vem do XML como alíquota por valor: não pode ser dividido por 100.
    expect(nfe.itens[0].is?.pIsEspec).toBeCloseTo(0.5, 6);
    expect(nfe.itens[0].is?.pIs).toBeCloseTo(0.01, 6);
  });

  it('não quebra nota antiga sem grupo IBSCBS/IS', async () => {
    const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
    const antiga = {
      name: 'nfe-antiga.xml',
      text: () => Promise.resolve(XML_ANTIGA),
    } as unknown as File;
    await act(async () => {
      await result.current.processarArquivos([antiga] as unknown as FileList);
    });
    await waitFor(() => expect(result.current.nfesParsed).toHaveLength(1));

    const nfe = result.current.nfesParsed[0];
    expect(nfe.itens).toHaveLength(1);
    expect(nfe.itens[0].codigo).toBe('P1');
    expect(nfe.itens[0].ibscbs).toBeUndefined();
    expect(nfe.itens[0].is).toBeUndefined();
    // totais vêm como objeto sem campos, nunca null
    expect(nfe.ibscbs?.vBCIBSCBS).toBeUndefined();
    expect(nfe.ibscbs?.vIS).toBeUndefined();
  });
});

/**
 * Etapa 43 — o crédito passa a ser o valor destacado na nota, não a
 * estimativa pela alíquota do ano corrente. O caso que motivou a mudança:
 * nota de 2026 importada com o relógio já em outro ano creditava pela
 * alíquota errada e o crédito nunca batia com o documento fiscal.
 */
describe('useImportacaoXMLNFe — crédito pelo valor destacado (etapa 43)', () => {
  async function importar(nome: string) {
    const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
    await act(async () => {
      await result.current.processarArquivos([arquivo(nome)] as unknown as FileList);
    });
    await waitFor(() => expect(result.current.nfesParsed).toHaveLength(1));
    mockRpc.mockResolvedValue({ data: { id: 'nota-1' }, error: null });
    await act(async () => {
      await result.current.importarNFes.mutateAsync();
    });
    return mockRpc.mock.calls[0][1] as {
      p_creditos: Array<Record<string, unknown>>;
    };
  }

  it('usa vCBS/vIBS do XML e marca como xml_destacado', async () => {
    const payload = await importar('procNFe-ibscbs-2026.xml');

    const cbs = payload.p_creditos.find((c) => c.tipo_tributo === 'CBS');
    const ibs = payload.p_creditos.find((c) => c.tipo_tributo === 'IBS');

    // valores do grupo total/IBSCBSTot da fixture, não 100 * aliquota do ano
    expect(cbs?.valor_credito).toBeCloseTo(9, 6);
    expect(ibs?.valor_credito).toBeCloseTo(10.65, 6);

    for (const credito of [cbs, ibs]) {
      expect(credito?.origem).toBe('xml_destacado');
      // Etapa 44: a nota é de 2026, ano de teste. O valor é destacado, mas o
      // crédito é informativo — não entra em saldo disponível.
      expect(credito?.efeito_tributario).toBe(false);
      expect(credito?.saldo_disponivel).toBe(0);
      // ano do fato gerador = emissão da nota, nunca o ano do relógio
      expect(credito?.ano_fato_gerador).toBe(2026);
    }
  });

  it('nota de 2027 com destaque gera crédito com efeito tributário', async () => {
    // Mesma nota, só o ano de emissão muda: é a virada da etapa 44 que separa
    // "destacado mas informativo" de "apropriável".
    const xml2027 = readFileSync(resolve(FIXTURES, 'procNFe-ibscbs-2026.xml'), 'utf8').replace(
      '2026-07-22',
      '2027-07-22'
    );
    const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
    const arq = { name: 'nfe-2027.xml', text: () => Promise.resolve(xml2027) } as unknown as File;
    await act(async () => {
      await result.current.processarArquivos([arq] as unknown as FileList);
    });
    await waitFor(() => expect(result.current.nfesParsed).toHaveLength(1));
    mockRpc.mockResolvedValue({ data: { id: 'nota-1' }, error: null });
    await act(async () => {
      await result.current.importarNFes.mutateAsync();
    });

    const payload = mockRpc.mock.calls[0][1] as { p_creditos: Array<Record<string, unknown>> };
    for (const credito of payload.p_creditos) {
      expect(credito.origem).toBe('xml_destacado');
      expect(credito.efeito_tributario).toBe(true);
      expect(credito.ano_fato_gerador).toBe(2027);
      expect(credito.saldo_disponivel).toBe(credito.valor_credito);
    }
  });

  it('nota de 31/12 às 22h em Brasília pertence ao exercício anterior', async () => {
    // 22h de 31/12 em -03:00 é 01h de 01/01 em UTC. Se a vigência fosse lida
    // pelo relógio/UTC, esta nota viraria 2027 e passaria a gerar crédito
    // apropriável indevidamente. O ano tem que ser o civil do emitente.
    const xmlVirada = readFileSync(resolve(FIXTURES, 'procNFe-ibscbs-2026.xml'), 'utf8').replace(
      '2026-07-22T10:00:00-03:00',
      '2026-12-31T22:00:00-03:00'
    );
    const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
    const arq = { name: 'nfe-virada.xml', text: () => Promise.resolve(xmlVirada) } as unknown as File;
    await act(async () => {
      await result.current.processarArquivos([arq] as unknown as FileList);
    });
    await waitFor(() => expect(result.current.nfesParsed).toHaveLength(1));
    mockRpc.mockResolvedValue({ data: { id: 'nota-1' }, error: null });
    await act(async () => {
      await result.current.importarNFes.mutateAsync();
    });

    const payload = mockRpc.mock.calls[0][1] as { p_creditos: Array<Record<string, unknown>> };
    for (const credito of payload.p_creditos) {
      expect(credito.ano_fato_gerador).toBe(2026);
      expect(credito.efeito_tributario).toBe(false);
      expect(credito.saldo_disponivel).toBe(0);
    }
  });
  it('nota sem grupo IBS/CBS cai no estimado, marcado como tal', async () => {
    const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
    const antiga = {
      name: 'nfe-antiga.xml',
      text: () => Promise.resolve(XML_ANTIGA),
    } as unknown as File;
    await act(async () => {
      await result.current.processarArquivos([antiga] as unknown as FileList);
    });
    await waitFor(() => expect(result.current.nfesParsed).toHaveLength(1));
    mockRpc.mockResolvedValue({ data: { id: 'nota-1' }, error: null });
    await act(async () => {
      await result.current.importarNFes.mutateAsync();
    });

    const payload = mockRpc.mock.calls[0][1] as { p_creditos: Array<Record<string, unknown>> };
    expect(payload.p_creditos.length).toBeGreaterThan(0);
    for (const credito of payload.p_creditos) {
      expect(credito.origem).toBe('estimado');
      // crédito estimado não tem efeito tributário: não conta como disponível
      expect(credito.efeito_tributario).toBe(false);
      expect(credito.ano_fato_gerador).toBe(2026);
    }
  });

  it('resumo separa o que veio do XML do que foi estimado', async () => {
    const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
    await act(async () => {
      await result.current.processarArquivos([
        arquivo('procNFe-ibscbs-2026.xml'),
      ] as unknown as FileList);
    });
    await waitFor(() => expect(result.current.nfesParsed).toHaveLength(1));
    mockRpc.mockResolvedValue({ data: { id: 'nota-1' }, error: null });

    let resumo!: Awaited<ReturnType<typeof result.current.importarNFes.mutateAsync>>;
    await act(async () => {
      resumo = await result.current.importarNFes.mutateAsync();
    });

    // tudo veio do XML, nada estimado
    expect(resumo.creditosDoXml.total).toBeCloseTo(19.65, 6);
    expect(resumo.creditosGerados.total).toBeCloseTo(19.65, 6);
    expect(resumo.notasEstimadas).toBe(0);
  });

  it('nota emitida 31/12 à noite no Brasil não cai no exercício seguinte', async () => {
    // 2026-12-31T23:30:00-03:00 = 2027-01-01T02:30Z. Ler o ano com
    // `getFullYear()` no fuso do navegador (UTC) gravaria 2027.
    const xml = readFileSync(resolve(FIXTURES, 'procNFe-ibscbs-2026.xml'), 'utf8').replace(
      '2026-07-22',
      '2026-12-31'
    );
    const arq = { name: 'virada.xml', text: () => Promise.resolve(xml) } as unknown as File;
    const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
    await act(async () => {
      await result.current.processarArquivos([arq] as unknown as FileList);
    });
    await waitFor(() => expect(result.current.nfesParsed).toHaveLength(1));
    mockRpc.mockResolvedValue({ data: { id: 'nota-1' }, error: null });
    process.env.TZ = 'UTC';
    await act(async () => {
      await result.current.importarNFes.mutateAsync();
    });
    delete process.env.TZ;

    const payload = mockRpc.mock.calls[0][1] as { p_creditos: Array<Record<string, unknown>> };
    for (const credito of payload.p_creditos) {
      expect(credito.ano_fato_gerador).toBe(2026);
      expect(credito.competencia_origem).toBe('2026-12');
      expect(credito.data_origem).toBe('2026-12-31');
    }
  });
});
