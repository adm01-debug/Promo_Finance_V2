import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const FUNCTIONS_ROOT = new URL("../", import.meta.url);
const BODY_PATTERN = /req\.(json|text)\s*\(/;
const VALIDATION_PATTERN =
  /validatePayload|validateContract|validateVersionedContract|\.safeParse\s*\(/;
const LEGACY_VALIDATION_400_PATTERN =
  /if\s*\(\s*!\s*(?:__contract|parsed|validation)\.success\s*\)\s*return\s+new Response\(JSON\.stringify\(\{\s*error:\s*(?:__contract|parsed|validation)\.(?:error|details)[\s\S]{0,240}?status:\s*400/;

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

Deno.test("nenhum endpoint devolve 400 para falha de schema", async () => {
  const legacyEndpoints: string[] = [];

  for await (const entry of Deno.readDir(FUNCTIONS_ROOT)) {
    if (!entry.isDirectory || entry.name === "_shared") continue;
    try {
      const source = await Deno.readTextFile(
        new URL(`${entry.name}/index.ts`, FUNCTIONS_ROOT),
      );
      if (LEGACY_VALIDATION_400_PATTERN.test(source)) {
        legacyEndpoints.push(entry.name);
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }

  assertEquals(
    legacyEndpoints,
    [],
    `Endpoints com falha de schema em 400: ${legacyEndpoints.join(", ")}`,
  );
});

Deno.test("bling autentica o corpo bruto antes de validar ou gravar", async () => {
  const source = await Deno.readTextFile(
    new URL("../bling-webhook/index.ts", import.meta.url),
  );
  const auth = source.indexOf("authenticateWebhook(");
  const parse = source.indexOf("JSON.parse(rawBody)");
  const validation = source.indexOf("validateVersionedContract(");
  const insert = source.indexOf('.from("bling_webhook_events")');

  assertEquals(auth >= 0, true);
  assertEquals(auth < parse, true);
  assertEquals(parse < validation, true);
  assertEquals(validation < insert, true);
});
