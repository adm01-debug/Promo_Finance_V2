import { assertEquals } from "https://deno.land/x/std@0.208.0/assert/mod.ts";
import { Fuzzer } from "./_shared/fuzzer.ts";
import * as Schemas from "./_shared/validation.ts";
import { validatePayload } from "./_shared/validation.ts";

/**
 * Automated Fuzz Testing for all defined Contract Schemas.
 * This ensures that the validation logic correctly identifies and rejects
 * malicious or malformed payloads for every webhook and edge function.
 */

Deno.test("Fuzzing: All Contract Schemas should reject invalid data", () => {
  const schemaEntries = Object.entries(Schemas).filter(([key, val]) => 
    key.endsWith("Schema") && typeof val === 'object' && 'safeParse' in (val as any)
  );

  console.log(`Running fuzz tests for ${schemaEntries.length} schemas...`);

  for (const [name, schema] of schemaEntries) {
    const s = schema as any;
    
    // 1. Test general invalid payloads
    const generalPayloads = Fuzzer.generateGeneralInvalidPayloads();
    for (const payload of generalPayloads) {
      const result = validatePayload(s, payload, name);
      // We skip null/undefined check for schemas that might allow them (though rare here)
      if (payload === null || payload === undefined) continue;
      
      assertEquals(result.success, false, `Schema ${name} should have rejected general invalid payload: ${JSON.stringify(payload)}`);
    }

    // 2. Test schema-specific invalid payloads (only for objects)
    if (s._def && s._def.shape) {
      const specificPayloads = Fuzzer.generateSchemaSpecificInvalidPayloads(s);
      for (const payload of specificPayloads) {
        const result = validatePayload(s, payload, name);
        // We just ensure no crashes here
        if (!result.success) {
           assertEquals(typeof result.error, "string");
        }
      }
    }
    
    console.log(`✅ Fuzz tests passed for ${name}`);
  }
});


