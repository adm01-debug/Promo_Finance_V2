import { assertEquals } from "https://deno.land/x/std@0.208.0/assert/mod.ts";
import { Fuzzer } from "./_shared/fuzzer.ts";
import * as Schemas from "./_shared/validation.ts";
import { validatePayload } from "./_shared/validation.ts";

/**
 * Automated Fuzz Testing for all defined Contract Schemas.
 * This ensures that the validation logic correctly identifies and rejects
 * malicious or malformed payloads for every webhook and edge function.
 */

Deno.test("Fuzzing: Selected Schemas should reject invalid data", () => {
  const schemasToTest = {
    AsaasWebhookSchema: Schemas.AsaasWebhookSchema,
    BlingWebhookSchema: Schemas.BlingWebhookSchema,
  };

  for (const [name, schema] of Object.entries(schemasToTest)) {
    console.log(`Testing ${name}...`);
    const s = schema as any;
    
    const generalPayloads = Fuzzer.generateGeneralInvalidPayloads();
    for (const payload of generalPayloads) {
      const result = validatePayload(s, payload, name);
      assertEquals(result.success, false, `Schema ${name} should have rejected general invalid payload: ${JSON.stringify(payload)}`);
    }
    console.log(`✅ Fuzz tests passed for ${name}`);
  }
});

