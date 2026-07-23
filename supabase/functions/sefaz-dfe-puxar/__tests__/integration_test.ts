/**
 * Teste de integração runPuxador × mock SOAP.
 * Consome fixtures reais (procNFe, resNFe, procEventoNFe) via
 * installSefazSoapMock e valida:
 *   - persistência em nfe_recebidas (upsert)
 *   - persistência em nfe_eventos (insert)
 *   - avanço monotônico do cursor via RPC sefaz_cursor_advance
 *   - tratamento de cStat=137 (empty) sem persistência
 *   - tratamento de cStat=656 (rate_limit) registrando erro no cursor
 */

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { runPuxador } from "../index.ts";
import {
  installSefazSoapMock,
  type SefazScenario,
} from "../../_shared/sefaz/__mocks__/soap-mock.ts";
import type { CertificadoRow } from "../../_shared/sefaz/pfx.ts";

const FIXTURES_DIR = new URL("../../_shared/sefaz/__fixtures__/", import.meta.url);
const readFixture = (name: string) =>
  Deno.readTextFile(new URL(name, FIXTURES_DIR));

// ------------------------------------------------------- stub client
interface StubCall { op: string; args: any }
function makeStubClient() {
  const calls: StubCall[] = [];
  const cursorState = { ultimo_nsu: 0 as number };
  const chain = (table: string) => {
    const q: any = {
      _table: table,
      select() { return q; },
      eq() { return q; },
      gte() { return q; },
      maybeSingle: async () => {
        if (table === "sefaz_dfe_cursor") {
          return {
            data: {
              ultimo_nsu: cursorState.ultimo_nsu,
              circuit_open: false,
              next_run_at: null,
            },
            error: null,
          };
        }
        return { data: null, error: null };
      },
      upsert(row: any) {
        calls.push({ op: `${table}.upsert`, args: row });
        return {
          select: () => ({
            maybeSingle: async () => ({ data: { id: crypto.randomUUID() }, error: null }),
          }),
        };
      },
      async insert(row: any) {
        calls.push({ op: `${table}.insert`, args: row });
        return { data: null, error: null };
      },
    };
    return q;
  };
  const stub = {
    from: chain,
    rpc: async (name: string, args: any) => {
      calls.push({ op: `rpc.${name}`, args });
      if (name === "sefaz_cursor_advance") {
        cursorState.ultimo_nsu = Math.max(cursorState.ultimo_nsu, Number(args.p_novo_nsu));
      }
      return { data: null, error: null };
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: "x" }, error: null }),
        download: async () => ({ data: new Blob([]), error: null }),
      }),
    },
  };
  return { stub, calls, cursorState };
}

const CNPJ = "11222333000181";
const CERT: CertificadoRow = {
  id: "cert-1",
  empresa_id: "11111111-1111-1111-1111-111111111111",
  cnpj: CNPJ,
  razao_social: "Emitente Teste",
  uf: "SP",
  ambiente: "homologacao",
  valido_de: "2025-01-01",
  valido_ate: "2099-01-01",
  pfx_storage_path: "test.pfx",
};

// Adapter: transforma a chamada `sefazFetch(url, envelope)` do runPuxador
// numa fetch global — que é o que o installSefazSoapMock intercepta.
const asSefazFetch = () => async (url: string, envelope: string) => {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/soap+xml" },
    body: envelope,
  });
  return await r.text();
};

// ------------------------------------------------------- tests

Deno.test("runPuxador processa NFe + evento e avança cursor", async () => {
  const [nfeXml, eventoXml] = await Promise.all([
    readFixture("procNFe-ok.xml"),
    readFixture("procEventoNFe-ciencia.xml"),
  ]);

  const scenarios: SefazScenario[] = [{
    cnpj: CNPJ,
    responses: [
      {
        kind: "batch",
        docs: [{ xml: nfeXml, nsu: 101 }, { xml: eventoXml, nsu: 102 }],
        ultNSU: 102,
        maxNSU: 102,
      },
      { kind: "empty" }, // segundo batch: fim da fila
    ],
  }];

  const mock = installSefazSoapMock(scenarios);
  const { stub, calls, cursorState } = makeStubClient();

  try {
    const summary = await runPuxador(stub as any, CERT, asSefazFetch());

    assertEquals(summary.erro, null, `erro inesperado: ${summary.erro}`);
    assertEquals(summary.docs, 2, "deve processar 2 docs");
    assertEquals(summary.novos, 1, "1 NFe nova");
    assertEquals(summary.eventos, 1, "1 evento");
    assertEquals(summary.cursorAntes, 0);
    assertEquals(summary.cursorDepois, 102, "cursor avançado para ultNSU do lote");
    assertEquals(cursorState.ultimo_nsu, 102, "estado interno consistente");

    const upserts = calls.filter((c) => c.op === "nfe_recebidas.upsert");
    assertEquals(upserts.length, 1);
    const nfe = upserts[0].args as any;
    assertEquals(nfe.cnpj_emitente, CNPJ);
    assertEquals(nfe.nsu, 101);
    assertEquals(nfe.ambiente, "homologacao");
    assertEquals(nfe.empresa_id, CERT.empresa_id);
    assert(nfe.xml_path.startsWith(`${CERT.empresa_id}/`));
    assert(nfe.xml_path.endsWith(".xml"));

    const eventos = calls.filter((c) => c.op === "nfe_eventos.insert");
    assertEquals(eventos.length, 1);
    assertEquals((eventos[0].args as any).chave_acesso.length, 44);

    const advances = calls.filter((c) => c.op === "rpc.sefaz_cursor_advance");
    assert(advances.length >= 1, "cursor_advance chamado ao menos uma vez");
    // monotonicidade: cada chamada nunca regride
    let last = -1;
    for (const a of advances) {
      const v = Number((a.args as any).p_novo_nsu);
      assert(v >= last, `regressão de NSU detectada: ${v} < ${last}`);
      last = v;
    }
  } finally {
    mock.restore();
  }
});

Deno.test("runPuxador — cStat=137 (empty) não persiste nada", async () => {
  const mock = installSefazSoapMock([{ cnpj: CNPJ, responses: [{ kind: "empty" }] }]);
  const { stub, calls } = makeStubClient();
  try {
    const summary = await runPuxador(stub as any, CERT, asSefazFetch());
    assertEquals(summary.docs, 0);
    assertEquals(summary.novos, 0);
    assertEquals(summary.cStatFinal, "137");
    assertEquals(summary.cursorDepois, 0, "cursor NÃO avança em resposta vazia");
    assertEquals(calls.filter((c) => c.op === "nfe_recebidas.upsert").length, 0);
    assertEquals(calls.filter((c) => c.op === "nfe_eventos.insert").length, 0);
  } finally {
    mock.restore();
  }
});

Deno.test("runPuxador — cStat=656 (rate_limit) marca erro no cursor", async () => {
  const mock = installSefazSoapMock([{ cnpj: CNPJ, responses: [{ kind: "rate_limit" }] }]);
  const { stub, calls } = makeStubClient();
  try {
    const summary = await runPuxador(stub as any, CERT, asSefazFetch());
    assertEquals(summary.cStatFinal, "656");
    assert(summary.erro !== null, "deve registrar erro");
    const advances = calls.filter((c) => c.op === "rpc.sefaz_cursor_advance");
    assert(advances.length >= 1, "advance chamado com erro persistido");
    const withError = advances.find((a) => (a.args as any).p_erro !== null);
    assert(withError, "ao menos uma chamada com p_erro preenchido");
  } finally {
    mock.restore();
  }
});
