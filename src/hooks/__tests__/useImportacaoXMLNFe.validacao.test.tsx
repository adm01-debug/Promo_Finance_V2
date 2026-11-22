/**
 * Testes ? useImportacaoXMLNFe: valida??o contra cat?logo (etapa 46)
 *
 * A importa??o deixou de aplicar regras de exemplo embutidas (PIS/COFINS
 * monof?sico por prefixo de NCM) e passou a conferir o que a nota declarou
 * contra `catalogo_cclasstrib` e `catalogo_ncm`. O checklist da etapa exige que
 * a diverg?ncia vire **alerta na nota, n?o bloqueio**: estes testes provam que
 * a nota entra mesmo com REG-011 e que o cat?logo vazio n?o gera falso positivo.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
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

// NCM 02013000 + cClassTrib 200035 declarando CST 200. O cat?logo diz que o
// cClassTrib 200035 tem CST 000 ? ? exatamente a diverg?ncia da evid?ncia.
const XML_COM_GRUPO = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe>
  <infNFe Id="NFe35260312345678000199550010000000011000000017" versao="4.00">
    <ide><nNF>1</nNF><serie>1</serie><dhEmi>2026-03-31T22:30:00-03:00</dhEmi><natOp>Compra</natOp></ide>
    <emit><CNPJ>12345678000199</CNPJ><xNome>Fornecedor SA</xNome></emit>
    <dest><CNPJ>98765432000188</CNPJ></dest>
    <det nItem="1"><prod><cProd>P1</cProd><xProd>CARNE</xProd><NCM>02013000</NCM><CFOP>5102</CFOP><qCom>1.0000</qCom><vUnCom>100.00</vUnCom><vProd>100.00</vProd></prod>
      <imposto><ICMS><ICMS00><orig>0</orig><CST>00</CST><vBC>100.00</vBC><vICMS>18.00</vICMS></ICMS00></ICMS>
        <IBSCBS><CST>200</CST><cClassTrib>200035</cClassTrib><gIBSCBS><vBC>100.00</vBC><gIBSUF><pIBSUF>0.1000</pIBSUF><vIBSUF>10.00</vIBSUF></gIBSUF><gIBSMun><pIBSMun>0.0000</pIBSMun><vIBSMun>0.00</vIBSMun></gIBSMun><gCBS><pCBS>0.0900</pCBS><vCBS>9.00</vCBS></gCBS></gIBSCBS></IBSCBS>
      </imposto>
    </det>
    <total><ICMSTot><vNF>100.00</vNF><vProd>100.00</vProd><vBC>100.00</vBC><vICMS>18.00</vICMS></ICMSTot></total>
  </infNFe></NFe></nfeProc>`;

type Resposta = { data: unknown; error: unknown };
type Registro = { tabela: string; metodo: string };

/**
 * `catalogo_cclasstrib` e `catalogo_ncm` recebem linhas pr?prias; as demais
 * tabelas respondem vazio. A ordem das chamadas ? do hook, n?o do teste.
 */
function montaCliente(catalogos: Record<string, Resposta>) {
  const chamadas: Registro[] = [];
  mockFrom.mockImplementation((tabela: string) => {
    const chain: Record<string, unknown> = {};
    for (const metodo of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'single']) {
      chain[metodo] = vi.fn(() => {
        chamadas.push({ tabela, metodo });
        return chain;
      });
    }
    const resposta = catalogos[tabela] ?? { data: [], error: null };
    chain.then = (r: (v: Resposta) => unknown) => Promise.resolve(resposta).then(r);
    return chain;
  });
  return chamadas;
}

function arquivo(): File {
  return { name: 'nfe.xml', text: () => Promise.resolve(XML_COM_GRUPO) } as unknown as File;
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

async function importar(catalogos: Record<string, Resposta>) {
  const chamadas = montaCliente(catalogos);
  const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
  await act(async () => {
    await result.current.processarArquivos([arquivo()] as unknown as FileList);
  });
  await waitFor(() => expect(result.current.nfesParsed).toHaveLength(1));

  let resumo!: Awaited<ReturnType<typeof result.current.importarNFes.mutateAsync>>;
  await act(async () => {
    resumo = await result.current.importarNFes.mutateAsync();
  });
  return { result, resumo, chamadas };
}

const CATALOGO = {
  catalogo_cclasstrib: {
    data: [
      {
        cclasstrib: '200035',
        cst: '000',
        descricao: 'Tributa??o integral',
        exige_gibscbs: true,
        p_red_cbs: 0,
        p_red_ibs_uf: 0,
        p_red_ibs_mun: 0,
        versao_it: '1.0',
        inicio_vigencia: '2026-01-01',
        fim_vigencia: null,
      },
    ],
    error: null,
  },
  catalogo_ncm: {
    data: [
      {
        ncm: '02013000',
        descricao: 'Carnes de bovino',
        inicio_vigencia: '2022-04-01',
        fim_vigencia: null,
      },
    ],
    error: null,
  },
};

describe('importarNFes ? valida??o contra cat?logo (etapa 46)', () => {
  it('consulta cclasstrib e catalogo_ncm uma vez por lote', async () => {
    const { chamadas } = await importar(CATALOGO);
    const tabelas = chamadas.filter((c) => c.metodo === 'select').map((c) => c.tabela);
    expect(tabelas.filter((t) => t === 'catalogo_cclasstrib')).toHaveLength(1);
    expect(tabelas.filter((t) => t === 'catalogo_ncm')).toHaveLength(1);
  });

  it('anexa REG-011 ? nota e ainda assim a importa', async () => {
    const { resumo } = await importar(CATALOGO);

    // A nota entrou: diverg?ncia ? alerta, n?o bloqueio.
    expect(resumo.sucesso).toBe(1);
    expect(resumo.erros).toBe(0);
    expect(resumo.notasComAlertaFiscal).toBe(1);
    expect(mockRpc).toHaveBeenCalledTimes(1);

    const nota = resumo.nfesProcessadas[0];
    expect(nota.status).toBe('importado');
    expect(nota.alertasFiscais).toHaveLength(1);
    expect(nota.alertasFiscais?.[0].codigo).toBe('REG-011');
    expect(nota.alertasFiscais?.[0].mensagem).toContain('tem CST 000');
  });

  it('catálogo vazio não gera alerta (carga da RFB ainda não rodou)', async () => {
    const { resumo } = await importar({});

    expect(resumo.sucesso).toBe(1);
    expect(resumo.notasComAlertaFiscal).toBe(0);
    expect(resumo.nfesProcessadas[0].alertasFiscais).toBeUndefined();
  });
});
