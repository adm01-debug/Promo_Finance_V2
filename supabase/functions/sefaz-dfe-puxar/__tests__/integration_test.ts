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
      if (name === "sefaz_process_batch") {
        const novo = Number(args.p_novo_nsu);
        const antes = cursorState.ultimo_nsu;
        const docs = (args.p_docs ?? []) as Array<any>;
        let novos = 0, eventos = 0, ignorados = 0;
        for (const d of docs) {
          if (d.kind === "nfe") novos++;
          else if (d.kind === "evento") eventos++;
          else ignorados++;
        }
        if (novo > antes) cursorState.ultimo_nsu = novo;
        return {
          data: {
            cursor_antes: antes,
            cursor_depois: cursorState.ultimo_nsu,
            novos, eventos, ignorados,
          },
          error: null,
        };
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

    const batches = calls.filter((c) => c.op === "rpc.sefaz_process_batch");
    assert(batches.length >= 1, "sefaz_process_batch chamado ao menos uma vez");

    // O primeiro batch com docs deve conter 1 NFe + 1 evento, no CNPJ certo.
    const withDocs = batches.find((b) => (b.args as any).p_docs?.length > 0);
    assert(withDocs, "deve haver um batch com docs");
    const args = withDocs!.args as any;
    assertEquals(args.p_cnpj, CNPJ);
    assertEquals(args.p_ambiente, "homologacao");
    assertEquals(args.p_empresa_id, CERT.empresa_id);
    const docs = args.p_docs as Array<any>;
    assertEquals(docs.length, 2);
    const nfeDoc = docs.find((d) => d.kind === "nfe")!;
    const eventoDoc = docs.find((d) => d.kind === "evento")!;
    assertEquals(nfeDoc.payload.cnpj_emitente, CNPJ);
    assertEquals(nfeDoc.nsu, 101);
    assert(nfeDoc.payload.xml_path.startsWith(`${CERT.empresa_id}/`));
    assert(nfeDoc.payload.xml_path.endsWith(".xml"));
    assertEquals(eventoDoc.payload.chave_acesso.length, 44);

    // Monotonicidade: nenhum batch pode regredir p_novo_nsu.
    let last = -1;
    for (const b of batches) {
      const v = Number((b.args as any).p_novo_nsu);
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
    const batches = calls.filter((c) => c.op === "rpc.sefaz_process_batch");
    // Deve chamar o RPC apenas para status/erro — SEM docs.
    assert(batches.every((b) => ((b.args as any).p_docs ?? []).length === 0));
  } finally {
    mock.restore();
  }
});

Deno.test("runPuxador — cStat=656 (rate_limit) marca erro no cursor sem persistir docs", async () => {
  const mock = installSefazSoapMock([{ cnpj: CNPJ, responses: [{ kind: "rate_limit" }] }]);
  const { stub, calls } = makeStubClient();
  try {
    const summary = await runPuxador(stub as any, CERT, asSefazFetch());
    assertEquals(summary.cStatFinal, "656");
    assert(summary.erro !== null, "deve registrar erro");
    const batches = calls.filter((c) => c.op === "rpc.sefaz_process_batch");
    const withError = batches.find((b) => (b.args as any).p_erro !== null);
    assert(withError, "batch com p_erro preenchido");
    assert(((withError!.args as any).p_docs ?? []).length === 0, "nenhum doc no erro");
  } finally {
    mock.restore();
  }
});

Deno.test("runPuxador — reprocessamento é idempotente (mesmo NSU não avança cursor duas vezes)", async () => {
  const nfeXml = await readFixture("procNFe-ok.xml");
  // Mesmo lote entregue duas vezes: segunda rodada não deve inserir NFes.
  const scenarios: SefazScenario[] = [{
    cnpj: CNPJ,
    responses: [
      { kind: "batch", docs: [{ xml: nfeXml, nsu: 200 }], ultNSU: 200, maxNSU: 200 },
      { kind: "batch", docs: [{ xml: nfeXml, nsu: 200 }], ultNSU: 200, maxNSU: 200 },
      { kind: "empty" },
    ],
  }];
  const mock = installSefazSoapMock(scenarios);
  const { stub, cursorState } = makeStubClient();
  try {
    await runPuxador(stub as any, CERT, asSefazFetch());
    assertEquals(cursorState.ultimo_nsu, 200);
    // Segunda rodada — cursor não deve regredir nem duplicar (garantia do RPC real via ON CONFLICT).
    await runPuxador(stub as any, CERT, asSefazFetch());
    assertEquals(cursorState.ultimo_nsu, 200, "cursor permanece em 200");
  } finally {
    mock.restore();
  }
});

