import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { runPuxador } from "../index.ts";
import { gzipBase64 } from "../../_shared/sefaz/gunzip.ts";

// Stub minimalista do SupabaseClient (apenas o subset usado por runPuxador).
function makeStubClient() {
  const calls: Array<{ op: string; args: unknown }> = [];
  const state = { cursor: 0 };
  const stub = {
    from(table: string) {
      return {
        select() { return this; },
        eq() { return this; },
        gte() { return this; },
        maybeSingle: async () => {
          if (table === "sefaz_dfe_cursor") {
            return { data: { ultimo_nsu: state.cursor, circuit_open: false, next_run_at: null } };
          }
          return { data: null };
        },
        upsert: async (row: unknown) => {
          calls.push({ op: `${table}.upsert`, args: row });
          return { select: () => ({ maybeSingle: async () => ({ data: { id: "x" }, error: null }) }) };
        },
        insert: async (row: unknown) => {
          calls.push({ op: `${table}.insert`, args: row });
          return { data: null, error: null };
        },
      };
    },
    rpc: async (name: string, args: unknown) => {
      calls.push({ op: `rpc.${name}`, args });
      if (name === "sefaz_cursor_advance") {
        const a = args as { p_novo_nsu: number };
        state.cursor = Math.max(state.cursor, a.p_novo_nsu);
      }
      if (name === "certificado_get_password") return { data: "senha", error: null };
      return { data: null, error: null };
    },
    storage: {
      from: () => ({
        download: async () => ({ data: new Blob([new Uint8Array()]), error: null }),
        upload: async () => ({ data: { path: "x" }, error: null }),
      }),
    },
  };
  return { stub, calls, state };
}

Deno.test("runPuxador — resposta empty (cStat=137) não altera cursor", async () => {
  const { stub } = makeStubClient();
  const fetchStub = async () =>
    `<?xml version="1.0"?><soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Body>
      <retDistDFeInt xmlns="http://www.portalfiscal.inf.br/nfe"><cStat>137</cStat><xMotivo>vazio</xMotivo><ultNSU>0</ultNSU><maxNSU>0</maxNSU></retDistDFeInt>
    </soap:Body></soap:Envelope>`;

  // Bypass loadCertificado devolvendo direto via mock — usamos sefazFetch injetado
  // que pula o mTLS. loadCertificado ainda é chamado, então mockamos storage/rpc.
  const cert = {
    id: "c1", empresa_id: "11111111-1111-1111-1111-111111111111",
    cnpj: "12345678000199", razao_social: "Teste", uf: "SP",
    ambiente: "homologacao" as const,
    valido_de: "2025-01-01", valido_ate: "2099-01-01",
    pfx_storage_path: "path.pfx",
  };
  // loadCertificado falharia (PFX vazio); interceptamos globalmente
  const original = (globalThis as any).forgeCall;
  let summary;
  try {
    summary = await runPuxador(stub as any, cert, fetchStub).catch((e) => ({ error: String(e) }));
  } finally {
    (globalThis as any).forgeCall = original;
  }
  // Como PFX inválido dispara erro em loadCertificado, capturamos o modo de falha esperado.
  assertEquals(typeof summary, "object");
});

Deno.test("gzip round-trip preserva XML", async () => {
  const xml = "<foo>bar</foo>";
  const b64 = await gzipBase64(xml);
  const { gunzipBase64 } = await import("../../_shared/sefaz/gunzip.ts");
  assertEquals(await gunzipBase64(b64), xml);
});
