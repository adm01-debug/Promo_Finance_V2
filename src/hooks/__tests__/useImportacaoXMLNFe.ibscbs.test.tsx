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
