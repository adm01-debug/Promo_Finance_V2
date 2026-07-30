import type { Page, Route } from '@playwright/test';

/**
 * Fixtures reutilizáveis para o domínio NF-e / SEFAZ.
 * Centraliza dados sintéticos e helpers de mock de rede usados nos
 * testes E2E de fluxo feliz e de falhas, evitando duplicação.
 */

// ---------- Tipos ----------

export interface NfeFixture {
  id: string;
  chave_acesso: string;
  numero: string;
  serie: string;
  cnpj_emitente: string;
  razao_emitente: string;
  uf_emitente: string;
  data_emissao: string;
  valor_total: number;
  manifestacao_status: 'pendente' | 'ciencia' | 'confirmada' | 'desconhecida' | 'nao_realizada';
  conta_pagar_id: string | null;
  xml_path: string | null;
}

export interface CertificadoFixture {
  id: string;
  empresa_id: string;
  cnpj: string;
  razao_social: string;
  pfx_storage_path: string;
  valido_de: string;
  valido_ate: string;
  ambiente: 'homologacao' | 'producao';
  uf: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SefazManifestOk {
  ok: true;
  cStat: string;
  xMotivo: string;
  nProt: string;
  status_novo: string;
  evento_inserido: boolean;
}
export interface SefazManifestFail {
  ok: false;
  cStat: string;
  xMotivo: string;
  nProt: null;
  status_novo: string;
  evento_inserido: false;
}
export type SefazManifestResponse = SefazManifestOk | SefazManifestFail;

// ---------- Constantes reutilizáveis ----------

export const CHAVES_ACESSO = {
  PADRAO: '35240612345678000199550010000000011000000019',
  SECUNDARIA: '35240612345678000199550010000000021000000027',
} as const;

export const CNPJS = {
  EMITENTE_A: '12.345.678/0001-99',
  EMITENTE_B: '98.765.432/0001-10',
} as const;

// ---------- Builders ----------

export function makeNfe(overrides: Partial<NfeFixture> = {}): NfeFixture {
  return {
    id: 'nfe-fixture-1',
    chave_acesso: CHAVES_ACESSO.PADRAO,
    numero: '1',
    serie: '1',
    cnpj_emitente: CNPJS.EMITENTE_A,
    razao_emitente: 'Fornecedor Teste LTDA',
    uf_emitente: 'SP',
    data_emissao: new Date('2026-06-01T12:00:00.000Z').toISOString(),
    valor_total: 1234.56,
    manifestacao_status: 'pendente',
    conta_pagar_id: null,
    xml_path: null,
    ...overrides,
  };
}

export function makeCertificado(overrides: Partial<CertificadoFixture> = {}): CertificadoFixture {
  const agora = new Date('2026-06-01T12:00:00.000Z');
  const em1ano = new Date(agora.getTime() + 365 * 24 * 60 * 60 * 1000);
  return {
    id: 'cert-fixture-1',
    empresa_id: 'empresa-fixture-1',
    cnpj: CNPJS.EMITENTE_A.replace(/\D/g, ''),
    razao_social: 'Empresa Teste LTDA',
    pfx_storage_path: 'certs/empresa-fixture-1/cert.pfx',
    valido_de: agora.toISOString(),
    valido_ate: em1ano.toISOString(),
    ambiente: 'homologacao',
    uf: 'SP',
    ativo: true,
    created_at: agora.toISOString(),
    updated_at: agora.toISOString(),
    ...overrides,
  };
}

export function makeManifestOk(overrides: Partial<SefazManifestOk> = {}): SefazManifestOk {
  return {
    ok: true,
    cStat: '135',
    xMotivo: 'Evento registrado e vinculado a NF-e',
    nProt: '135240000000001',
    status_novo: 'ciencia',
    evento_inserido: true,
    ...overrides,
  };
}

export function makeManifestFail(overrides: Partial<SefazManifestFail> = {}): SefazManifestFail {
  return {
    ok: false,
    cStat: '539',
    xMotivo: 'Rejeição: Duplicidade de evento',
    nProt: null,
    status_novo: 'pendente',
    evento_inserido: false,
    ...overrides,
  };
}

// ---------- Payload PFX sintético ----------

export function fakePfxFile(name = 'certificado.pfx') {
  return {
    name,
    mimeType: 'application/x-pkcs12',
    buffer: Buffer.from('fake-pfx-bytes-for-e2e-only'),
  };
}

// ---------- Helpers de mock de rede ----------

export interface PostgrestMockOptions {
  nfes?: NfeFixture[];
  certificados?: CertificadoFixture[];
  contasPagar?: unknown[];
}

/**
 * Intercepta chamadas PostgREST (`/rest/v1/**`) devolvendo fixtures.
 * Rotas não mapeadas respondem `[]` para manter os testes offline.
 */
export async function mockPostgrest(page: Page, opts: PostgrestMockOptions = {}) {
  const { nfes = [], certificados = [], contasPagar = [] } = opts;
  await page.route('**/rest/v1/**', async (route: Route) => {
    const url = route.request().url();
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

    if (url.includes('nfe_recebidas')) return json(nfes);
    if (url.includes('empresas_certificados')) return json(certificados);
    if (url.includes('contas_pagar')) return json(contasPagar);
    return json([]);
  });
}

export interface EdgeFunctionResponse {
  status?: number;
  body: unknown;
}

export type EdgeFunctionMocks = Record<string, EdgeFunctionResponse | ((route: Route) => Promise<void> | void)>;

/**
 * Intercepta Edge Functions (`/functions/v1/**`).
 * Cada chave do map é o nome (ou fragmento) da função; valor pode ser
 * uma resposta declarativa `{ status, body }` ou um handler custom.
 * Funções não mapeadas respondem `{"ok":true}`.
 *
 * Retorna um contador de chamadas por função para asserts.
 */
export async function mockEdgeFunctions(page: Page, mocks: EdgeFunctionMocks = {}) {
  const counts: Record<string, number> = Object.fromEntries(Object.keys(mocks).map((k) => [k, 0]));

  await page.route('**/functions/v1/**', async (route: Route) => {
    const url = route.request().url();
    for (const [name, handler] of Object.entries(mocks)) {
      if (url.includes(name)) {
        counts[name] = (counts[name] ?? 0) + 1;
        if (typeof handler === 'function') return handler(route);
        return route.fulfill({
          status: handler.status ?? 200,
          contentType: 'application/json',
          body: JSON.stringify(handler.body),
        });
      }
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  return counts;
}
