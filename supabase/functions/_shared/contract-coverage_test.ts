import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const FUNCTIONS_ROOT = new URL("../", import.meta.url);
const BODY_PATTERN = /req\.(json|text)\s*\(/;
const VALIDATION_PATTERN =
  /validatePayload|validateContract|validateVersionedContract|\.safeParse\s*\(/;

Deno.test("toda Edge Function que consome body declara validação de contrato", async () => {
  const missing: string[] = [];

  for await (const entry of Deno.readDir(FUNCTIONS_ROOT)) {
    if (!entry.isDirectory || entry.name === "_shared") continue;
    const indexUrl = new URL(`${entry.name}/index.ts`, FUNCTIONS_ROOT);
    try {
      const source = await Deno.readTextFile(indexUrl);
      if (BODY_PATTERN.test(source) && !VALIDATION_PATTERN.test(source)) {
        missing.push(entry.name);
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }

  assertEquals(
    missing,
    [],
    `Endpoints com body sem validação: ${missing.join(", ")}`,
  );
});

Deno.test("helpers compartilhados preservam o envelope 422 canônico", async () => {
  const contractValidator = await Deno.readTextFile(
    new URL("contract-validator.ts", import.meta.url),
  );
  const validation = await Deno.readTextFile(
    new URL("validation.ts", import.meta.url),
  );
  assertEquals(
    contractValidator.includes("createValidationErrorResponse"),
    true,
  );
  assertEquals(validation.includes("createValidationErrorResponse"), true);
});
