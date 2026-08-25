import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { z } from "./zod.ts";
import { validateVersionedContract } from "./versioned-contract.ts";

const v1 = z.object({ event: z.string().trim().min(1) }).strict();
const v2 = v1.extend({ event_id: z.string().trim().min(1) }).strict();
const options = { v1, v2, functionName: "webhook-teste" };

Deno.test("contrato versionado mantém v1 retrocompatível por padrão", () => {
  const result = validateVersionedContract(
    new Request("https://local/webhook"),
    { event: "created" },
    options,
  );
  assertEquals(result.success, true);
  if (result.success) {
    assertEquals(result.version, "v1");
    assertEquals(result.deprecated, true);
  }
});

Deno.test("contrato versionado aceita v2 via header", () => {
  const req = new Request("https://local/webhook", {
    headers: { "x-contract-version": "v2" },
  });
  const result = validateVersionedContract(req, {
    event: "created",
    event_id: "evt_1",
  }, options);
  assertEquals(result.success, true);
  if (result.success) assertEquals(result.version, "v2");
});

Deno.test("contrato versionado rejeita v2 incompleto com envelope 422", async () => {
  const req = new Request("https://local/webhook", {
    headers: { "x-contract-version": "v2" },
  });
  const result = validateVersionedContract(req, { event: "created" }, options);
  assertEquals(result.success, false);
  if (!result.success) {
    assertEquals(result.response.status, 422);
    assertEquals((await result.response.json()).code, "VALIDATION_ERROR");
  }
});

Deno.test("contrato versionado rejeita versão descontinuada/desconhecida", async () => {
  const req = new Request("https://local/webhook", {
    headers: { "x-contract-version": "v0" },
  });
  const result = validateVersionedContract(req, { event: "created" }, options);
  assertEquals(result.success, false);
  if (!result.success) {
    assertEquals(result.response.status, 422);
    assertEquals(
      (await result.response.json()).code,
      "UNSUPPORTED_CONTRACT_VERSION",
    );
  }
});
