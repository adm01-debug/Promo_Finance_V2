import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const FUNCTIONS_ROOT = new URL("../", import.meta.url);
const BODY_PATTERN = /req\.(json|text)\s*\(/;
const VALIDATION_PATTERN =
  /validatePayload|validateContract|validateVersionedContract|\.safeParse\s*\(/;
const OWNED_VALIDATION_ENDPOINTS = [
  "cnpja-lookup",
  "simular-presumido",
  "simular-simples",
  "simular-real",
  "benchmarking-setorial",
  "asaas-proxy",
  "analyze-document",
  "enviar-alerta-email",
  "projecao-reforma",
  "bling-proxy",
  "contabilizar-evento",
  "decidir-regime",
] as const;
const LEGACY_VALIDATION_400_PATTERN =
  /if\s*\(\s*!\s*(?:__contract|parsed|validation|__c|_v)\.success\s*\)\s*return\s+(?:createErrorResponse\((?:__contract|parsed|validation|__c|_v)\.error,\s*400\b[\s\S]{0,80}?(?:details|\.details)\)|new Response\([\s\S]{0,260}?status:\s*400)/;

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

  for (const endpoint of OWNED_VALIDATION_ENDPOINTS) {
    const source = await Deno.readTextFile(
      new URL(`${endpoint}/index.ts`, FUNCTIONS_ROOT),
    );
    if (LEGACY_VALIDATION_400_PATTERN.test(source)) {
      legacyEndpoints.push(endpoint);
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
  const claim = source.indexOf("processWithIdempotency(");

  assertEquals(auth >= 0, true);
  assertEquals(auth < parse, true);
  assertEquals(parse < validation, true);
  assertEquals(validation < claim, true);
});

Deno.test("webhooks com efeitos colaterais usam idempotência atômica", async () => {
  for (
    const endpoint of ["bling-webhook", "bitrix24-webhook", "whatsapp-webhook"]
  ) {
    const source = await Deno.readTextFile(
      new URL(`../${endpoint}/index.ts`, import.meta.url),
    );
    assertEquals(
      source.includes("processWithIdempotency("),
      true,
      `${endpoint} não usa processWithIdempotency`,
    );
  }
});

Deno.test("bitrix24 não persiste application_token", async () => {
  const source = await Deno.readTextFile(
    new URL("../bitrix24-webhook/index.ts", import.meta.url),
  );
  const sanitization = source.indexOf("delete (authPayload");
  const persistence = source.indexOf("processWithIdempotency(");
  assertEquals(sanitization >= 0, true);
  assertEquals(sanitization < persistence, true);
});

Deno.test("endpoints sensíveis exigem autenticação explícita em código", async () => {
  const expectations: Array<[string, string]> = [
    ["../expert-agent/index.ts", "exigirUsuario("],
    ["../webhook-retry-worker/index.ts", "exigirChamadaInterna("],
    ["../webhook-simulator/index.ts", "exigirPapel("],
    ["../processar-fila-cobrancas/index.ts", "exigirInternaOuUsuario("],
    ["../gerar-resumo-financeiro-diario/index.ts", "exigirInternaOuUsuario("],
    ["../calcular-slo-metrics-diario/index.ts", "exigirChamadaInterna("],
  ];

  for (const [path, token] of expectations) {
    const source = await Deno.readTextFile(new URL(path, import.meta.url));
    assertEquals(
      source.includes(token),
      true,
      `${path} não contém o guard esperado: ${token}`,
    );
  }
});

Deno.test("webhook do Asaas preserva headers de versão em respostas de sucesso e retry interno", async () => {
  const source = await Deno.readTextFile(
    new URL("../asaas-webhook/index.ts", import.meta.url),
  );
  const occurrences = source.match(/contractVersionHeaders\(validation\.version\)/g) ?? [];
  assertEquals(occurrences.length >= 3, true);
});
