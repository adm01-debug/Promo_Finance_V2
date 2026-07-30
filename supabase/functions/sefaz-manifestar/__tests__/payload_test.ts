/**
 * Testes de payload — Edge Function `sefaz-manifestar`.
 *
 * Foco: garantir que o fluxo NF-e envia os parâmetros corretos:
 *   • para o certificado (query em empresas_certificados: cnpj, ambiente, ativo, valido_ate),
 *   • para o webservice SEFAZ (envelope: chNFe, CNPJ autor, tpEvento, tpAmb, nSeqEvento,
 *     descEvento, xJust condicional, endpoint prod vs homologação, SOAPAction),
 *   • para a RPC transacional `nfe_apply_manifestacao` (todos os p_*).
 *
 * O admin client é substituído por um stub in-memory que registra
 * chamadas por tabela/rpc para asserção. `sefazFetch` é injetado.
 */
import {
  assert,
  assertEquals,
  assertMatch,
  assertRejects,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  executeManifestacao,
  type ManifestarArgs,
} from "../index.ts";
import type { ManifTipo } from "../../_shared/sefaz/manifestacao.ts";

// --------------------------------------------------------------------- stubs

interface RecordedSelect {
  table: string;
  columns: string;
  filters: Array<[string, unknown]>;
  gte: Array<[string, unknown]>;
  order?: { column: string; ascending: boolean };
  limit?: number;
}
interface RecordedRpc {
  fn: string;
  args: Record<string, unknown>;
}

interface AdminStubOptions {
  nfe?: Record<string, unknown> | null;
  certificado?: Record<string, unknown> | null;
  eventosPrev?: Array<{ sequencial: number }>;
  applyResult?: { status_novo: string; evento_inserido: boolean };
  applyError?: { message: string } | null;
}

function makeAdminStub(opts: AdminStubOptions) {
  const selects: RecordedSelect[] = [];
  const rpcs: RecordedRpc[] = [];

  const buildQuery = (table: string, columns: string) => {
    const rec: RecordedSelect = { table, columns, filters: [], gte: [] };
    selects.push(rec);

    const chain: Record<string, unknown> = {};
    chain.eq = (col: string, val: unknown) => {
      rec.filters.push([col, val]);
      return chain;
    };
    chain.gte = (col: string, val: unknown) => {
      rec.gte.push([col, val]);
      return chain;
    };
    chain.order = (col: string, o: { ascending: boolean }) => {
      rec.order = { column: col, ascending: o.ascending };
      return chain;
    };
    chain.limit = (n: number) => {
      rec.limit = n;
      // Cadeia de eventosPrev é resolvida pelo await direto → thenable.
      return {
        then: (resolve: (v: unknown) => void) =>
          resolve({ data: opts.eventosPrev ?? [], error: null }),
      };
    };
    chain.maybeSingle = () => {
      if (table === "nfe_recebidas") {
        return Promise.resolve({
          data: opts.nfe ?? null,
          error: opts.nfe ? null : { message: "not_found" },
        });
      }
      if (table === "empresas_certificados") {
        return Promise.resolve({
          data: opts.certificado ?? null,
          error: opts.certificado ? null : { message: "not_found" },
        });
      }
      return Promise.resolve({ data: null, error: null });
    };
    return chain;
  };

  const admin = {
    from(table: string) {
      return {
        select: (columns: string) => buildQuery(table, columns),
      };
    },
    rpc(fn: string, args: Record<string, unknown>) {
      rpcs.push({ fn, args });
      return Promise.resolve({
        data: opts.applyResult ?? { status_novo: "ciencia", evento_inserido: true },
        error: opts.applyError ?? null,
      });
    },
  };

  return { admin, selects, rpcs };
}

function fakeSefazResponse(cStat = "135", nProt = "135260000000001", tpAmb = "2") {
  return `
    <retEnvEvento versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe">
      <idLote>1</idLote><tpAmb>${tpAmb}</tpAmb>
      <cStat>128</cStat><xMotivo>Lote de Evento Processado</xMotivo>
      <retEvento versao="1.00"><infEvento>
        <tpAmb>${tpAmb}</tpAmb>
        <cStat>${cStat}</cStat><xMotivo>Evento registrado</xMotivo>
        <nProt>${nProt}</nProt>
        <dhRegEvento>2026-07-23T09:00:00-03:00</dhRegEvento>
      </infEvento></retEvento>
    </retEnvEvento>`;
}

// --------------------------------------------------------------- fixtures

const CHAVE = "35260714200166000187550010000012341123456789";
const CNPJ = "14200166000187";
const nfeFixture = {
  id: "nfe-uuid-1",
  empresa_id: "emp-1",
  cnpj_destinatario: CNPJ,
  ambiente: "homologacao" as const,
};
const certFixture = {
  id: "cert-1",
  empresa_id: "emp-1",
  cnpj: CNPJ,
  razao_social: "ACME LTDA",
  uf: "SP",
  ambiente: "homologacao" as const,
  valido_de: "2026-01-01T00:00:00Z",
  valido_ate: "2027-01-01T00:00:00Z",
  pfx_storage_path: "emp-1/cert.pfx",
};

// --------------------------------------------------------------------- tests

Deno.test("payload: envelope contém chave, CNPJ autor e tpEvento corretos", async () => {
  const { admin, selects, rpcs } = makeAdminStub({
    nfe: nfeFixture,
    certificado: certFixture,
  });
  let capturedUrl = "";
  let capturedEnvelope = "";
  const fetchSpy = (url: string, envelope: string) => {
    capturedUrl = url;
    capturedEnvelope = envelope;
    return Promise.resolve(fakeSefazResponse());
  };

  const args: ManifestarArgs = { chave_acesso: CHAVE, tipo: "210210" };
  const result = await executeManifestacao(admin as never, args, fetchSpy);

  // Endpoint: ambiente homologação → hom.nfe.fazenda.gov.br
  assertStringIncludes(capturedUrl, "hom.nfe.fazenda.gov.br");
  assertStringIncludes(capturedUrl, "NFeRecepcaoEvento4");

  // Envelope: chave, CNPJ autor, tpEvento, tpAmb=2, seq=1, descEvento
  assertStringIncludes(capturedEnvelope, `<chNFe>${CHAVE}</chNFe>`);
  assertStringIncludes(capturedEnvelope, `<CNPJ>${CNPJ}</CNPJ>`);
  assertStringIncludes(capturedEnvelope, "<tpEvento>210210</tpEvento>");
  assertStringIncludes(capturedEnvelope, "<tpAmb>2</tpAmb>");
  assertStringIncludes(capturedEnvelope, "<nSeqEvento>1</nSeqEvento>");
  assertStringIncludes(capturedEnvelope, "<descEvento>Ciencia da Operacao</descEvento>");
  // Id do infEvento no formato ID{tipo}{chave}{seq2}
  assertStringIncludes(capturedEnvelope, `Id="ID210210${CHAVE}01"`);
  // idLote é 15 dígitos derivado de Date.now()
  assertMatch(capturedEnvelope, /<idLote>\d{1,15}<\/idLote>/);

  // Certificado consultado com filtros corretos (cnpj + ambiente + ativo + valido_ate)
  const certSel = selects.find((s) => s.table === "empresas_certificados")!;
  assert(certSel, "esperava select em empresas_certificados");
  assertEquals(
    certSel.filters.sort(),
    [["ambiente", "homologacao"], ["ativo", true], ["cnpj", CNPJ]].sort(),
  );
  assertEquals(certSel.gte.length, 1);
  assertEquals(certSel.gte[0][0], "valido_ate");

  // NFe consultada por chave_acesso
  const nfeSel = selects.find((s) => s.table === "nfe_recebidas")!;
  assertEquals(nfeSel.filters, [["chave_acesso", CHAVE]]);

  // RPC nfe_apply_manifestacao recebeu payload completo
  assertEquals(rpcs.length, 1);
  assertEquals(rpcs[0].fn, "nfe_apply_manifestacao");
  const p = rpcs[0].args;
  assertEquals(p.p_chave, CHAVE);
  assertEquals(p.p_tipo_evento, "210210");
  assertEquals(p.p_codigo_evento, "210210");
  assertEquals(p.p_sequencial, 1);
  assertEquals(p.p_novo_status, "ciencia");
  assertEquals(p.p_status_retorno, "135");
  assertEquals(p.p_protocolo, "135260000000001");
  assertEquals(p.p_justificativa, null);
  // p_data_evento é ISO string
  assertMatch(String(p.p_data_evento), /^\d{4}-\d{2}-\d{2}T/);
  // p_raw preserva cStat/xMotivo do lote
  assertEquals((p.p_raw as { cStat_lote: string }).cStat_lote, "128");

  assertEquals(result.ok, true);
  assertEquals(result.cStat, "135");
  assertEquals(result.status_novo, "ciencia");
});

Deno.test("payload: 210240 injeta xJust e propaga justificativa ao RPC", async () => {
  const { admin, rpcs } = makeAdminStub({
    nfe: nfeFixture,
    certificado: certFixture,
    applyResult: { status_novo: "nao_realizada", evento_inserido: true },
  });
  let capturedEnvelope = "";
  const justificativa = "compra cancelada pelo comprador — item indisponivel no estoque";
  await executeManifestacao(
    admin as never,
    { chave_acesso: CHAVE, tipo: "210240", justificativa },
    (_url, envelope) => {
      capturedEnvelope = envelope;
      return Promise.resolve(fakeSefazResponse("155"));
    },
  );

  assertStringIncludes(capturedEnvelope, "<tpEvento>210240</tpEvento>");
  assertStringIncludes(capturedEnvelope, `<xJust>${justificativa}</xJust>`);
  assertStringIncludes(capturedEnvelope, "<descEvento>Operacao nao Realizada</descEvento>");

  const p = rpcs[0].args;
  assertEquals(p.p_novo_status, "nao_realizada");
  assertEquals(p.p_justificativa, justificativa);
});

Deno.test("payload: 210210 NÃO injeta xJust mesmo se fornecida", async () => {
  const { admin } = makeAdminStub({ nfe: nfeFixture, certificado: certFixture });
  let envelope = "";
  await executeManifestacao(
    admin as never,
    { chave_acesso: CHAVE, tipo: "210210", justificativa: "ruído — deve ser ignorado" },
    (_u, e) => { envelope = e; return Promise.resolve(fakeSefazResponse()); },
  );
  assert(!envelope.includes("<xJust>"), "xJust não deve aparecer em 210210");
});

Deno.test("payload: ambiente produção → endpoint www1 e tpAmb=1", async () => {
  const { admin } = makeAdminStub({
    nfe: { ...nfeFixture, ambiente: "producao" as const },
    certificado: { ...certFixture, ambiente: "producao" as const },
  });
  let url = "", envelope = "";
  await executeManifestacao(
    admin as never,
    { chave_acesso: CHAVE, tipo: "210200" },
    (u, e) => { url = u; envelope = e; return Promise.resolve(fakeSefazResponse("135", "n", "1")); },
  );
  assertStringIncludes(url, "www1.nfe.fazenda.gov.br");
  assert(!url.includes("hom.nfe"), "não deve apontar para homologação em produção");
  assertStringIncludes(envelope, "<tpAmb>1</tpAmb>");
});

Deno.test("payload: sequencial = último sequencial do tipo + 1", async () => {
  const { admin, rpcs } = makeAdminStub({
    nfe: nfeFixture,
    certificado: certFixture,
    eventosPrev: [{ sequencial: 7 }],
  });
  let envelope = "";
  await executeManifestacao(
    admin as never,
    { chave_acesso: CHAVE, tipo: "210210" },
    (_u, e) => { envelope = e; return Promise.resolve(fakeSefazResponse()); },
  );
  assertStringIncludes(envelope, "<nSeqEvento>8</nSeqEvento>");
  assertStringIncludes(envelope, `Id="ID210210${CHAVE}08"`);
  assertEquals(rpcs[0].args.p_sequencial, 8);
});

Deno.test("guarda: tipo inválido rejeita antes de qualquer I/O", async () => {
  const { admin, selects, rpcs } = makeAdminStub({ nfe: nfeFixture, certificado: certFixture });
  await assertRejects(
    () => executeManifestacao(
      admin as never,
      { chave_acesso: CHAVE, tipo: "999999" as ManifTipo },
      () => Promise.resolve(fakeSefazResponse()),
    ),
    Error,
    "tipo_invalido",
  );
  assertEquals(selects.length, 0);
  assertEquals(rpcs.length, 0);
});

Deno.test("guarda: 210240 sem justificativa (ou < 15 chars) rejeita", async () => {
  const { admin } = makeAdminStub({ nfe: nfeFixture, certificado: certFixture });
  await assertRejects(
    () => executeManifestacao(
      admin as never,
      { chave_acesso: CHAVE, tipo: "210240", justificativa: "curta" },
      () => Promise.resolve(fakeSefazResponse()),
    ),
    Error,
    "justificativa_obrigatoria_min_15",
  );
});

Deno.test("guarda: chave_acesso não-44-dígitos rejeita", async () => {
  const { admin } = makeAdminStub({ nfe: nfeFixture, certificado: certFixture });
  await assertRejects(
    () => executeManifestacao(
      admin as never,
      { chave_acesso: "abc", tipo: "210210" },
      () => Promise.resolve(fakeSefazResponse()),
    ),
    Error,
    "chave_acesso_invalida",
  );
});

Deno.test("guarda: sem certificado ativo → certificado_ativo_ausente (não chama SEFAZ nem RPC)", async () => {
  const { admin, rpcs } = makeAdminStub({ nfe: nfeFixture, certificado: null });
  let sefazCalled = false;
  await assertRejects(
    () => executeManifestacao(
      admin as never,
      { chave_acesso: CHAVE, tipo: "210210" },
      () => { sefazCalled = true; return Promise.resolve(fakeSefazResponse()); },
    ),
    Error,
    "certificado_ativo_ausente",
  );
  assert(!sefazCalled, "não deve chamar SEFAZ sem certificado");
  assertEquals(rpcs.length, 0);
});
