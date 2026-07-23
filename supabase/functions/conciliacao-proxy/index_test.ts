import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler, type HandlerDeps } from "./index.ts";

Deno.env.set("DENO_TESTING", "1");

const T = "11111111-1111-4111-8111-111111111111";
const CP = "22222222-2222-4222-8222-222222222222";
const CR = "33333333-3333-4333-8333-333333333333";

type RpcCall = { fn: string; args: Record<string, unknown> };

function makeDeps(
  overrides: Partial<HandlerDeps> = {},
  rpcResult: { data?: unknown; error?: { message: string } } = { data: null },
): { deps: HandlerDeps; calls: RpcCall[] } {
  const calls: RpcCall[] = [];
  const deps: HandlerDeps = {
    verifyJwt: async () => ({ userId: "user-1" }),
    admin: {
      rpc: (fn: string, args: Record<string, unknown>) => {
        calls.push({ fn, args });
        return Promise.resolve(rpcResult) as never;
      },
      from: () => ({ insert: () => Promise.resolve({ data: null, error: null }) }),
    } as unknown as HandlerDeps["admin"],
    ...overrides,
  };
  return { deps, calls };
}

function req(body: unknown, headers: Record<string, string> = { Authorization: "Bearer valid" }) {
  return new Request("http://localhost/conciliacao-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

Deno.test("conciliacao-proxy: 401 sem Authorization", async () => {
  const { deps } = makeDeps();
  const res = await createHandler(deps)(req({ action: "desfazer", transacaoId: T }, {}));
  assertEquals(res.status, 401);
});

Deno.test("conciliacao-proxy: 401 com JWT inválido", async () => {
  const { deps } = makeDeps({ verifyJwt: async () => ({ userId: null }) });
  const res = await createHandler(deps)(req({ action: "desfazer", transacaoId: T }));
  assertEquals(res.status, 401);
  assertEquals((await res.json()).error, "Unauthorized");
});

Deno.test("conciliacao-proxy: 405 em GET", async () => {
  const { deps } = makeDeps();
  const res = await createHandler(deps)(new Request("http://x/", { method: "GET" }));
  assertEquals(res.status, 405);
});

Deno.test("conciliacao-proxy: 400 se transacaoId não for UUID", async () => {
  const { deps } = makeDeps();
  const res = await createHandler(deps)(req({ action: "desfazer", transacaoId: "abc" }));
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "transacaoId inválido");
});

Deno.test("conciliacao-proxy: 400 quando contaPagarId inválido", async () => {
  const { deps } = makeDeps();
  const res = await createHandler(deps)(
    req({ action: "confirmar", transacaoId: T, contaPagarId: "bad" }),
  );
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "contaPagarId inválido");
});

Deno.test("conciliacao-proxy: sucesso confirmar encaminha args completos", async () => {
  const { deps, calls } = makeDeps();
  const res = await createHandler(deps)(
    req({ action: "confirmar", transacaoId: T, contaPagarId: CP, contaReceberId: CR, ajusteCentavos: 150 }),
  );
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { ok: true });
  assertEquals(calls[0], {
    fn: "confirmar_conciliacao_manual",
    args: { p_transacao_id: T, p_conta_pagar_id: CP, p_conta_receber_id: CR, p_ajuste_centavos: 150 },
  });
});

Deno.test("conciliacao-proxy: confirmar com ajuste ausente vira 0", async () => {
  const { deps, calls } = makeDeps();
  await createHandler(deps)(req({ action: "confirmar", transacaoId: T, contaPagarId: CP }));
  assertEquals(calls[0].args.p_ajuste_centavos, 0);
  assertEquals(calls[0].args.p_conta_receber_id, null);
});

Deno.test("conciliacao-proxy: sucesso desfazer chama RPC correta", async () => {
  const { deps, calls } = makeDeps();
  const res = await createHandler(deps)(req({ action: "desfazer", transacaoId: T }));
  assertEquals(res.status, 200);
  assertEquals(calls[0], { fn: "desfazer_conciliacao_manual", args: { p_transacao_id: T } });
});

Deno.test("conciliacao-proxy: erro do RPC vira 400", async () => {
  const { deps } = makeDeps({}, { error: new Error("conflito") as unknown as { message: string } });
  const res = await createHandler(deps)(req({ action: "desfazer", transacaoId: T }));
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "conflito");
});

Deno.test("conciliacao-proxy: ação desconhecida retorna 400", async () => {
  const { deps } = makeDeps();
  const res = await createHandler(deps)(
    req({ action: "outra" as unknown as "desfazer", transacaoId: T }),
  );
  assertEquals(res.status, 400);
});
