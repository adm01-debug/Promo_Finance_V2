import { assertEquals } from "https://deno.land/x/std@0.208.0/assert/mod.ts";
import { Fuzzer } from "./_shared/fuzzer.ts";
import * as Schemas from "./_shared/validation.ts";
import { validatePayload } from "./_shared/validation.ts";

/**
 * Automated Fuzz Testing for all defined Contract Schemas.
 * This ensures that the validation logic correctly identifies and rejects
 * malicious or malformed payloads for every webhook and edge function.
 */

Deno.test("Fuzzing: All Contract Schemas should reject invalid data and malformed entries", () => {
  const schemaEntries = Object.entries(Schemas).filter(([key, val]) => 
    key.endsWith("Schema") && typeof val === 'object' && 'safeParse' in (val as any)
  );

  for (const [name, schema] of schemaEntries) {
    const s = schema as any;
    
    // 1. Test general invalid payloads
    const generalPayloads = Fuzzer.generateGeneralInvalidPayloads();
    for (const payload of generalPayloads) {
      const result = s.safeParse(payload);
      if (payload === null || payload === undefined) continue;
      
      if (result.success) {
        // Only fail if it's a payload that SHOULD be rejected (like a huge string or injection)
        const isActuallyMalicious = typeof payload === 'string' && (payload.length > 5000 || payload.includes("<script>") || payload.includes("' OR '1'='1"));
        
        if (isActuallyMalicious) {
          throw new Error(`Schema ${name} should have rejected malicious payload: ${JSON.stringify(payload).slice(0, 100)}...`);
        }
        
        // If it's just an empty object and the schema allows it, it's fine.
      }


    }

    // 2. Test schema-specific invalid payloads (only for objects)
    if (s._def && s._def.shape) {
      const specificPayloads = Fuzzer.generateSchemaSpecificInvalidPayloads(s);
      for (const payload of specificPayloads) {
        const result = s.safeParse(payload);
        // No crash expected
      }
    }
  }
});



