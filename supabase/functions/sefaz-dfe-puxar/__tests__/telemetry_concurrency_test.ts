/**
 * Testes de telemetria, concorrência e retry/backoff do runPuxador.
 *
 * Cobre:
 *   1. Logs estruturados (`slog`) — presença de `cb_open`, `cStat` e
 *      `duration_ms` por CNPJ nos eventos `puxador_batch` / `puxador_finish`.
 *   2. Telemetria persistida em `query_telemetry` — payload contém as
 *      chaves esperadas (`cStat_final`, `cb_open`, `duration_ms`).
 *   3. Concorrência entre CNPJs — dois `runPuxador` em paralelo mantêm
 *      cursores independentes e nenhum lote vaza para o outro CNPJ.
 *   4. Circuit breaker aberto — `cb_open=true` interrompe o puxador
 *      sem tocar na SEFAZ, emitindo log `puxador_skipped`.
 *   5. Backoff pendente — `next_run_at` no futuro pula a execução.
 *   6. Retry/backoff — cStat=108 (retry) marca erro e para o loop
 *      preservando o cursor; execução subsequente conclui com sucesso.
 */

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { runPuxador } from "../index.ts";
import {
  installSefazSoapMock,
  type SefazScenario,
} from "../../_shared/sefaz/__mocks__/soap-mock.ts";
import type { CertificadoRow } from "../../_shared/sefaz/pfx.ts";

const FIXTURES_DIR = new URL("../../_shared/sefaz/__fixtures__/", import.meta.url);
const readFixture = (name: string) => Deno.readTextFile(new URL(name, FIXTURES_DIR));

// ------------------------------------------------------- helpers

interface CursorInit {
  ultimo_nsu?: number;
  circuit_open?: boolean;
  next_run_at?: string | null;
}

function makeStubClient(init: CursorInit = {}) {
  const calls: Array<{ op: string; args: unknown }> = [];
  const cursor = {
    ultimo_nsu: init.ultimo_nsu ?? 0,
    circuit_open: init.circuit_open ?? false,
    next_run_at: init.next_run_at ?? null,
  };
  const telemetry: Array<Record<string, unknown>> = [];

  const chain = (table: string) => {
    const q: any = {
      select: () => q,
      eq: () => q,
      gte: () => q,
      maybeSingle: async () => {
        if (table === "sefaz_dfe_cursor") return { data: { ...cursor }, error: null };
        return { data: null, error: null };
      },
      insert: (row: any) => {
        calls.push({ op: `${table}.insert`, args: row });
        if (table === "query_telemetry") telemetry.push(row);
        return Promise.resolve({ data: null, error: null });
      },
      upsert: (row: any) => {
        calls.push({ op: `${table}.upsert`, args: row });
        return {
          select: () => ({ maybeSingle: async () => ({ data: { id: "x" }, error: null }) }),
        };
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
        const antes = cursor.ultimo_nsu;
        const docs = (args.p_docs ?? []) as Array<any>;
        let novos = 0, eventos = 0;
        for (const d of docs) d.kind === "nfe" ? novos++ : eventos++;
        if (novo > antes) cursor.ultimo_nsu = novo;
        return {
          data: { cursor_antes: antes, cursor_depois: cursor.ultimo_nsu, novos, eventos, ignorados: 0 },
          error: null,
        };
      }
      return { data: null, error: null };
    },
    storage: {
      from: () => ({ upload: async () => ({ data: { path: "x" }, error: null }) }),
    },
  };
  return { stub, calls, cursor, telemetry };
}

const asSefazFetch = () => async (url: string, envelope: string) => {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/soap+xml" },
    body: envelope,
  });
  return await r.text();
};

const cert = (cnpj: string): CertificadoRow => ({
  id: `cert-${cnpj}`,
  empresa_id: crypto.randomUUID(),
  cnpj,
  razao_social: `Emitente ${cnpj}`,
  uf: "SP",
  ambiente: "homologacao",
  valido_de: "2025-01-01",
  valido_ate: "2099-01-01",
  pfx_storage_path: "test.pfx",
});

/** Captura chamadas console.* para inspecionar logs estruturados. */
function captureLogs() {
  const lines: Array<{ level: string; obj: any }> = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  const push = (level: string) => (...args: unknown[]) => {
    const msg = args[0];
    if (typeof msg === "string") {
      try {
        const parsed = JSON.parse(msg);
        if (parsed && typeof parsed === "object" && parsed.fn === "sefaz-dfe-puxar") {
          lines.push({ level, obj: parsed });
          return;
        }
      } catch { /* not JSON */ }
    }
    orig[level as keyof typeof orig].apply(console, args as any);
  };
  console.log = push("log");
  console.warn = push("warn");
  console.error = push("error");
  return {
    lines,
    restore: () => {
      console.log = orig.log;
      console.warn = orig.warn;
      console.error = orig.error;
    },
  };
}

// ------------------------------------------------------- tests

Deno.test("telemetria: logs estruturados contêm cStat, cb_open e duration_ms por CNPJ", async () => {
  const nfeXml = await readFixture("procNFe-ok.xml");
  const CNPJ = "11222333000181";

  const mock = installSefazSoapMock([{
    cnpj: CNPJ,
    responses: [
      { kind: "batch", docs: [{ xml: nfeXml, nsu: 10 }], ultNSU: 10, maxNSU: 10 },
      { kind: "empty" },
    ],
  }]);
  const { stub, telemetry } = makeStubClient();
  const logs = captureLogs();

  try {
    const summary = await runPuxador(stub as any, cert(CNPJ), asSefazFetch());

    // 1. Logs estruturados: eventos-chave presentes.
    const events = logs.lines.map((l) => l.obj.event);
    assert(events.includes("puxador_start"), "log puxador_start ausente");
    assert(events.includes("puxador_batch"), "log puxador_batch ausente");
    assert(events.includes("puxador_finish"), "log puxador_finish ausente");

    // 2. Log de batch tem cStat + duration_ms.
    const batch = logs.lines.find((l) => l.obj.event === "puxador_batch")!;
    assertEquals(batch.obj.cnpj, CNPJ);
    assert(typeof batch.obj.cStat === "string" && batch.obj.cStat.length > 0);
    assert(typeof batch.obj.duration_ms === "number" && batch.obj.duration_ms >= 0);

    // 3. Log finish traz cb_open + duration total por CNPJ.
    const finish = logs.lines.find((l) => l.obj.event === "puxador_finish")!;
    assertEquals(finish.obj.cnpj, CNPJ);
    assertEquals(finish.obj.cb_open, false);
    assertEquals(finish.obj.backoff_pending, false);
    assert(typeof finish.obj.duration_ms === "number");
    assert(finish.obj.duration_ms >= 0);

    // 4. Telemetria persistida contém o payload rico.
    assertEquals(telemetry.length, 1, "1 registro de telemetria");
    const row = telemetry[0] as any;
    assertEquals(row.operation, "sefaz_dfe_puxar");
    const payload = JSON.parse(row.error_message);
    logs.restore(); // permite prints de debug após capture
    console.error("SUMMARY DEBUG", JSON.stringify(summary), "PAYLOAD", JSON.stringify(payload));
    assertEquals(payload.cnpj, CNPJ);
    assertEquals(payload.cb_open, false);
    assert("cStat_final" in payload);
    assertEquals(payload.novos, 1);

    // 5. Summary devolvido reflete o mesmo estado.
    assertEquals(summary.cbOpen, false);
    assertEquals(summary.backoffPending, false);
  } finally {
    logs.restore();
    mock.restore();
  }
});

Deno.test("circuit breaker aberto pula execução sem chamar SEFAZ", async () => {
  const CNPJ = "22333444000155";
  // NENHUMA resposta enfileirada — se o mock for chamado, lança.
  const mock = installSefazSoapMock([{ cnpj: CNPJ, responses: [] }]);
  const { stub } = makeStubClient({ ultimo_nsu: 500, circuit_open: true });
  const logs = captureLogs();

  try {
    const summary = await runPuxador(stub as any, cert(CNPJ), asSefazFetch());
    assertEquals(summary.cbOpen, true);
    assertEquals(summary.batches, 0, "não deve tocar SEFAZ com CB aberto");
    assertEquals(summary.erro, "circuit_open");
    assertEquals(summary.cursorDepois, 500, "cursor preservado");
    const skipped = logs.lines.find((l) => l.obj.event === "puxador_skipped");
    assert(skipped, "log puxador_skipped emitido");
    assertEquals(skipped!.obj.cb_open, true);
  } finally {
    logs.restore();
    mock.restore();
  }
});

Deno.test("backoff pendente (next_run_at futuro) pula execução", async () => {
  const CNPJ = "33444555000122";
  const future = new Date(Date.now() + 60_000).toISOString();
  const mock = installSefazSoapMock([{ cnpj: CNPJ, responses: [] }]);
  const { stub } = makeStubClient({ ultimo_nsu: 42, next_run_at: future });
  const logs = captureLogs();
  try {
    const summary = await runPuxador(stub as any, cert(CNPJ), asSefazFetch());
    assertEquals(summary.backoffPending, true);
    assertEquals(summary.batches, 0);
    assertEquals(summary.erro, "backoff_pending");
    const skipped = logs.lines.find((l) => l.obj.event === "puxador_skipped");
    assert(skipped);
    assertEquals(skipped!.obj.backoff_pending, true);
  } finally {
    logs.restore();
    mock.restore();
  }
});

Deno.test("concorrência: dois CNPJs em paralelo mantêm cursores independentes", async () => {
  const nfeXml = await readFixture("procNFe-ok.xml");
  const CNPJ_A = "44555666000111";
  const CNPJ_B = "55666777000122";

  const scenarios: SefazScenario[] = [
    {
      cnpj: CNPJ_A,
      responses: [
        { kind: "batch", docs: [{ xml: nfeXml, nsu: 100 }], ultNSU: 100, maxNSU: 100 },
        { kind: "empty" },
      ],
    },
    {
      cnpj: CNPJ_B,
      responses: [
        { kind: "batch", docs: [{ xml: nfeXml, nsu: 900 }], ultNSU: 900, maxNSU: 900 },
        { kind: "empty" },
      ],
    },
  ];
  const mock = installSefazSoapMock(scenarios);
  const A = makeStubClient();
  const B = makeStubClient();

  try {
    const [rA, rB] = await Promise.all([
      runPuxador(A.stub as any, cert(CNPJ_A), asSefazFetch()),
      runPuxador(B.stub as any, cert(CNPJ_B), asSefazFetch()),
    ]);

    // Cursores independentes — sem cross-contamination.
    assertEquals(rA.cursorDepois, 100);
    assertEquals(rB.cursorDepois, 900);
    assertEquals(A.cursor.ultimo_nsu, 100);
    assertEquals(B.cursor.ultimo_nsu, 900);

    // O mock só permite chamadas para o CNPJ enfileirado — se A tivesse
    // recebido resposta do B (ou vice-versa) o cursor teria destinado
    // valores errados. Reforçamos verificando os RPCs por client.
    const rpcA = A.calls.filter((c) => c.op === "rpc.sefaz_process_batch");
    const rpcB = B.calls.filter((c) => c.op === "rpc.sefaz_process_batch");
    for (const r of rpcA) assertEquals((r.args as any).p_cnpj, CNPJ_A);
    for (const r of rpcB) assertEquals((r.args as any).p_cnpj, CNPJ_B);
  } finally {
    mock.restore();
  }
});

Deno.test("retry/backoff: cStat retry para o loop preservando cursor; próxima rodada conclui", async () => {
  const nfeXml = await readFixture("procNFe-ok.xml");
  const CNPJ = "66777888000133";

  // Rodada 1: SEFAZ devolve service_down (cStat=108 → classify=retry).
  const mock1 = installSefazSoapMock([{
    cnpj: CNPJ,
    responses: [{ kind: "service_down" }],
  }]);
  const { stub, cursor, telemetry } = makeStubClient({ ultimo_nsu: 50 });
  const logs = captureLogs();

  try {
    const r1 = await runPuxador(stub as any, cert(CNPJ), asSefazFetch());
    assertEquals(r1.cStatFinal, "108");
    assert(r1.erro !== null, "erro registrado no summary");
    assertEquals(r1.cursorDepois, 50, "cursor NÃO regride em retry");
    assertEquals(r1.batches, 1, "1 batch antes de abortar");

    const stopLog = logs.lines.find((l) => l.obj.event === "puxador_cstat_stop");
    assert(stopLog, "log puxador_cstat_stop presente");
    assertEquals(stopLog!.obj.classify, "retry");

    // Telemetria da rodada retriada marcada como warning.
    assertEquals((telemetry[0] as any).severity, "warning");
  } finally {
    logs.restore();
    mock1.restore();
  }

  // Rodada 2: SEFAZ volta e entrega o batch — cursor avança normalmente.
  const mock2 = installSefazSoapMock([{
    cnpj: CNPJ,
    responses: [
      { kind: "batch", docs: [{ xml: nfeXml, nsu: 77 }], ultNSU: 77, maxNSU: 77 },
      { kind: "empty" },
    ],
  }]);
  try {
    const r2 = await runPuxador(stub as any, cert(CNPJ), asSefazFetch());
    assertEquals(r2.erro, null);
    assertEquals(r2.cursorDepois, 77);
    assertEquals(cursor.ultimo_nsu, 77);
  } finally {
    mock2.restore();
  }
});
