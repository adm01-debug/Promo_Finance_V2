import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createHandler, type HandlerDeps } from "./index.ts";

Deno.env.set("DENO_TESTING", "1");

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

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
    } as HandlerDeps["admin"],
    ...overrides,
  };
  return { deps, calls };
}

function req(body: unknown, headers: Record<string, string> = { Authorization: "Bearer valid" }) {
  return new Request("http://localhost/nfe-vinculo-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

Deno.test("nfe-vinculo-proxy: 401 quando Authorization ausente", async () => {
  const { deps } = makeDeps();
  const res = await createHandler(deps)(req({ action: "suggest", nfeId: UUID_A }, {}));
  assertEquals(res.status, 401);
  assertEquals((await res.json()).error, "Unauthorized");
});

Deno.test("nfe-vinculo-proxy: 401 quando header não é Bearer", async () => {
  const { deps } = makeDeps();
  const res = await createHandler(deps)(req({ action: "suggest", nfeId: UUID_A }, { Authorization: "Basic xxx" }));
  assertEquals(res.status, 401);
});

Deno.test("nfe-vinculo-proxy: 401 quando JWT inválido (verifyJwt retorna null)", async () => {
  const { deps } = makeDeps({ verifyJwt: async () => ({ userId: null }) });
  const res = await createHandler(deps)(req({ action: "suggest", nfeId: UUID_A }));
  assertEquals(res.status, 401);
  assertEquals((await res.json()).error, "Unauthorized");
});

Deno.test("nfe-vinculo-proxy: 405 em método diferente de POST", async () => {
  const { deps } = makeDeps();
  const res = await createHandler(deps)(new Request("http://x/", { method: "GET" }));
  assertEquals(res.status, 405);
});

Deno.test("nfe-vinculo-proxy: 400 em JSON inválido", async () => {
  const { deps } = makeDeps();
  const res = await createHandler(deps)(
    new Request("http://x/", {
      method: "POST",
      headers: { Authorization: "Bearer v", "Content-Type": "application/json" },
      body: "{not-json",
    }),
  );
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "Invalid JSON");
});

Deno.test("nfe-vinculo-proxy: 400 quando nfeId não é UUID", async () => {
  const { deps } = makeDeps();
  const res = await createHandler(deps)(req({ action: "suggest", nfeId: "abc" }));
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "nfeId inválido");
});

Deno.test("nfe-vinculo-proxy: 400 em link sem contaPagarId válido", async () => {
  const { deps } = makeDeps();
  const res = await createHandler(deps)(req({ action: "link", nfeId: UUID_A, contaPagarId: "nope" }));
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "contaPagarId inválido");
});

Deno.test("nfe-vinculo-proxy: sucesso em suggest chama RPC correta", async () => {
  const { deps, calls } = makeDeps({}, { data: [{ id: UUID_B }] });
  const res = await createHandler(deps)(req({ action: "suggest", nfeId: UUID_A }));
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { data: [{ id: UUID_B }] });
  assertEquals(calls, [{ fn: "nfe_suggest_contas_pagar", args: { p_nfe_id: UUID_A } }]);
});

Deno.test("nfe-vinculo-proxy: sucesso em link encaminha args para RPC", async () => {
  const { deps, calls } = makeDeps({}, { data: { linked: true } });
  const res = await createHandler(deps)(req({ action: "link", nfeId: UUID_A, contaPagarId: UUID_B }));
  assertEquals(res.status, 200);
  assertEquals(calls[0], {
    fn: "nfe_link_conta_pagar",
    args: { p_nfe_id: UUID_A, p_conta_pagar_id: UUID_B },
  });
});

Deno.test("nfe-vinculo-proxy: sucesso em unlink", async () => {
  const { deps, calls } = makeDeps({}, { data: { unlinked: true } });
  const res = await createHandler(deps)(req({ action: "unlink", nfeId: UUID_A }));
  assertEquals(res.status, 200);
  assertEquals(calls[0], { fn: "nfe_unlink_conta_pagar", args: { p_nfe_id: UUID_A } });
});

Deno.test("nfe-vinculo-proxy: sucesso em create_from_nfe com defaults null", async () => {
  const { deps, calls } = makeDeps({}, { data: { id: UUID_B } });
  const res = await createHandler(deps)(req({ action: "create_from_nfe", nfeId: UUID_A }));
  assertEquals(res.status, 200);
  assertEquals(calls[0], {
    fn: "nfe_create_conta_pagar_from_nfe",
    args: { p_nfe_id: UUID_A, p_data_vencimento: null, p_categoria_id: null },
  });
});

Deno.test("nfe-vinculo-proxy: erro do RPC vira 400 com mensagem", async () => {
  const { deps } = makeDeps({}, { error: new Error("not_authenticated") as unknown as { message: string } });
  const res = await createHandler(deps)(req({ action: "suggest", nfeId: UUID_A }));
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error, "not_authenticated");
});
