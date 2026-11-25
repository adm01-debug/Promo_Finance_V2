/**
 * Testes ? useImportacaoXMLNFe: valida??o contra cat?logo (etapa 46)
 *
 * A importa??o deixou de aplicar regras de exemplo embutidas (PIS/COFINS
 * monof?sico por prefixo de NCM) e passou a conferir o que a nota declarou
 * contra `catalogo_cclasstrib` e `catalogo_ncm`. O checklist da etapa exige que
 * a diverg?ncia vire **alerta na nota, n?o bloqueio**: estes testes provam que
 * a nota entra mesmo com REG-011 e que o cat?logo vazio n?o gera falso positivo.
 *
 * O quarto caso cobre a sonda de cat?logo: consulta filtrada vazia em cima de um
 * cat?logo cheio ? diverg?ncia (REG-013), n?o carga pendente.
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

/**
 * Mesma nota, emitida em 2025. Serve para o recorte de vigencia dos catalogos:
 * as cargas da RFB comecam em 2026-01-01, entao uma nota de 2025 nao tem
 * referencia de catalogo e nao pode gerar divergencia por isso.
 */
const XML_COM_GRUPO_2025 = XML_COM_GRUPO.replace(
  '<dhEmi>2026-03-31T22:30:00-03:00</dhEmi>',
  '<dhEmi>2025-03-31T22:30:00-03:00</dhEmi>'
);

type Resposta = { data: unknown; error: unknown };
type Registro = { tabela: string; metodo: string };

/**
 * `catalogo_cclasstrib` e `catalogo_ncm` recebem linhas pr?prias; as demais
 * tabelas respondem vazio. A ordem das chamadas ? do hook, n?o do teste.
 *
 * A entrada de uma tabela pode ser uma fila: o hook consulta os c?digos do lote
 * e, se a consulta voltar vazia, sonda o cat?logo com `.limit(1)`. A fila segue
 * a ordem em que as tabelas s?o consultadas.
 */
function montaCliente(catalogos: Record<string, Resposta | Resposta[]>) {
  const chamadas: Registro[] = [];
  const indice: Record<string, number> = {};
  const proxima = (tabela: string): Resposta => {
    const entrada = catalogos[tabela] ?? { data: [], error: null };
    if (!Array.isArray(entrada)) return entrada;
    const i = indice[tabela] ?? 0;
    indice[tabela] = i + 1;
    return entrada[Math.min(i, entrada.length - 1)];
  };
  mockFrom.mockImplementation((tabela: string) => {
    const chain: Record<string, unknown> = {};
    for (const metodo of [
      'select',
      'insert',
      'update',
      'delete',
      'eq',
      'in',
      'lte',
      'or',
      'limit',
      'single',
    ]) {
      chain[metodo] = vi.fn(() => {
        chamadas.push({ tabela, metodo });
        return chain;
      });
    }
    const resposta = proxima(tabela);
    chain.then = (r: (v: Resposta) => unknown) => Promise.resolve(resposta).then(r);
    return chain;
  });
  return chamadas;
}

function arquivo(xml: string = XML_COM_GRUPO): File {
  return { name: 'nfe.xml', text: () => Promise.resolve(xml) } as unknown as File;
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

async function importar(catalogos: Record<string, Resposta>, xml: string = XML_COM_GRUPO) {
  const chamadas = montaCliente(catalogos);
  const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
  await act(async () => {
    await result.current.processarArquivos([arquivo(xml)] as unknown as FileList);
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

  it('catálogo cheio + cClassTrib desconhecido gera REG-013 (sonda de catálogo)', async () => {
    const { resumo, chamadas } = await importar({
      // Primeira consulta (códigos do lote) volta vazia porque 200035 não está
      // no catálogo; a sonda prova que o catálogo tem conteúdo.
      catalogo_cclasstrib: [
        { data: [], error: null },
        { data: [{ cclasstrib: '000001' }], error: null },
      ],
      catalogo_ncm: CATALOGO.catalogo_ncm,
    });

    expect(resumo.sucesso).toBe(1);
    expect(resumo.notasComAlertaFiscal).toBe(1);

    const alertas = resumo.nfesProcessadas[0].alertasFiscais ?? [];
    expect(alertas.map((a) => a.codigo)).toEqual(['REG-013']);
    expect(alertas[0].mensagem).toContain('cClassTrib 200035');

    // Duas consultas: o lote e a sonda. A sonda é `.limit(1)`, não um select
    // do catálogo inteiro.
    const selecoes = chamadas.filter((c) => c.tabela === 'catalogo_cclasstrib');
    expect(selecoes.filter((c) => c.metodo === 'select')).toHaveLength(2);
    expect(selecoes.filter((c) => c.metodo === 'limit')).toHaveLength(1);
  });

  it('NCM encerrado no meio do ano só alerta a nota emitida depois do encerramento', async () => {
    // Duas notas do mesmo exercício, mesmo NCM: uma de março (antes do
    // encerramento em 2026-09-01) e uma de outubro (depois). Com o recorte por
    // 31/12 as duas levavam REG-012; o recorte passa a ser a data de emissão.
    const xmlOutubro = XML_COM_GRUPO.replace(
      '2026-03-31T22:30:00-03:00',
      '2026-10-05T10:00:00-03:00'
    )
      .replace(
        'Id="NFe35260312345678000199550010000000011000000017"',
        'Id="NFe35261012345678000199550010000000021000000028"'
      )
      .replace('<nNF>1</nNF>', '<nNF>2</nNF>');

    const chamadas = montaCliente({
      catalogo_cclasstrib: CATALOGO.catalogo_cclasstrib,
      // Ordem das consultas de NCM: março (linha aberta), outubro (linha já
      // encerrada) e a sonda de cobertura de outubro (catálogo tem conteúdo).
      catalogo_ncm: [
        CATALOGO.catalogo_ncm,
        {
          data: [
            {
              ncm: '02013000',
              descricao: 'Carnes de bovino',
              inicio_vigencia: '2022-04-01',
              fim_vigencia: '2026-09-01',
            },
          ],
          error: null,
        },
        CATALOGO.catalogo_ncm,
      ],
    });

    const { result } = renderHook(() => useImportacaoXMLNFe('emp-1'), { wrapper });
    const arquivos = [
      { name: 'marco.xml', text: () => Promise.resolve(XML_COM_GRUPO) },
      { name: 'outubro.xml', text: () => Promise.resolve(xmlOutubro) },
    ] as unknown as FileList;

    await act(async () => {
      await result.current.processarArquivos(arquivos);
    });
    await waitFor(() => expect(result.current.nfesParsed).toHaveLength(2));

    let resumo!: Awaited<ReturnType<typeof result.current.importarNFes.mutateAsync>>;
    await act(async () => {
      resumo = await result.current.importarNFes.mutateAsync();
    });

    expect(resumo.sucesso).toBe(2);
    const [marco, outubro] = resumo.nfesProcessadas;
    expect((marco.alertasFiscais ?? []).map((a) => a.codigo)).toEqual(['REG-011']);
    expect((outubro.alertasFiscais ?? []).map((a) => a.codigo)).toContain('REG-012');

    // Uma leitura de NCM por data distinta do lote (2), não por nota, mais a
    // sonda de cobertura `.limit(1)` da data em que o código não estava vigente.
    const selecoesNcm = chamadas.filter(
      (c) => c.tabela === 'catalogo_ncm' && c.metodo === 'select'
    );
    expect(selecoesNcm).toHaveLength(3);
    expect(
      chamadas.filter((c) => c.tabela === 'catalogo_ncm' && c.metodo === 'limit')
    ).toHaveLength(1);
  });

  it('nota anterior à vigência do catálogo não gera alerta (sem referência na data)', async () => {
    // Catálogo cheio, mas com inicio_vigencia 2026-01-01, e a nota é de 2025.
    // A consulta por código volta com linha e a sonda de cobertura volta vazia:
    // não há referência para aquela data, então não há o que divergir.
    const { resumo } = await importar(
      {
        catalogo_cclasstrib: [
          { data: CATALOGO.catalogo_cclasstrib.data, error: null },
          { data: [], error: null },
        ],
        catalogo_ncm: [
          {
            data: [
              {
                ncm: '02013000',
                descricao: 'Carnes de bovino',
                inicio_vigencia: '2026-01-01',
                fim_vigencia: null,
              },
            ],
            error: null,
          },
          { data: [], error: null },
        ],
      },
      XML_COM_GRUPO_2025
    );

    expect(resumo.sucesso).toBe(1);
    expect(resumo.notasComAlertaFiscal).toBe(0);
    expect(resumo.nfesProcessadas[0].alertasFiscais).toBeUndefined();
  });
});
