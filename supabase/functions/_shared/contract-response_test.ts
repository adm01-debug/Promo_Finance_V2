import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { z } from "./zod.ts";
import {
  createValidationErrorResponse,
  normalizeValidationFields,
  VALIDATION_ERROR_CODE,
} from "./contract-response.ts";

const schema = z.object({
  nome: z.string().trim().min(1),
  quantidade: z.number().int().positive(),
}).strict();

Deno.test("contrato 422 normaliza campos ausentes, tipos incorretos e vazios", async (t) => {
  const cases = [
    { nome: "campo ausente", payload: { nome: "válido" }, path: "quantidade" },
    {
      nome: "tipo incorreto",
      payload: { nome: "válido", quantidade: "1" },
      path: "quantidade",
    },
    { nome: "valor vazio", payload: { nome: "", quantidade: 1 }, path: "nome" },
  ];

  for (const testCase of cases) {
    await t.step(testCase.nome, async () => {
      const result = schema.safeParse(testCase.payload);
      assertEquals(result.success, false);
      if (result.success) return;

      const response = createValidationErrorResponse(result.error);
      const body = await response.json();
      assertEquals(response.status, 422);
      assertEquals(body.code, VALIDATION_ERROR_CODE);
      assertEquals(body.message, "Payload inválido");
      assertEquals(Array.isArray(body.fields), true);
      assertEquals(
        body.fields.some((field: { path: string }) =>
          field.path === testCase.path
        ),
        true,
      );
    });
  }
});

Deno.test("normalização usa $ para erro na raiz", () => {
  const result = z.object({ id: z.string() }).safeParse(null);
  assertEquals(result.success, false);
  if (!result.success) {
    assertEquals(normalizeValidationFields(result.error)[0].path, "$");
  }
});
