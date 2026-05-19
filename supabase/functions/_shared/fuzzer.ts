import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Fuzzer utility to generate "bad" payloads for testing robustness.
 */
export const Fuzzer = {
  /**
   * Generates a variety of invalid payloads based on common failure modes.
   */
  generateGeneralInvalidPayloads(): any[] {
    return [
      {}, // Empty
      { unexpected_field: "malicious_data" }, // Unknown field
      null,
      undefined,
      "not-even-an-object",
      Array(100).fill("garbage"), // Large array
      { id: "not-a-uuid" }, // Invalid format
      { amount: "not-a-number" }, // Invalid type
      { data: "<script>alert('xss')</script>" }, // Injection attempt
      { data: "' OR '1'='1" }, // SQLi attempt
      { payload: "A".repeat(10000) }, // Large payload
    ];
  },

  /**
   * Generates invalid payloads specifically targeting a Zod schema's fields.
   */
  generateSchemaSpecificInvalidPayloads(schema: z.ZodObject<any>): any[] {
    const shape = schema.shape;
    const payloads: any[] = [];

    // 1. Missing required fields
    for (const key of Object.keys(shape)) {
      const payload: any = {};
      for (const otherKey of Object.keys(shape)) {
        if (otherKey !== key) {
          payload[otherKey] = this.getSampleValidValue(shape[otherKey]);
        }
      }
      payloads.push(payload);
    }

    // 2. Wrong types for fields
    for (const key of Object.keys(shape)) {
      const payload: any = {};
      for (const k of Object.keys(shape)) {
        payload[k] = k === key ? this.getWrongTypeValue(shape[k]) : this.getSampleValidValue(shape[k]);
      }
      payloads.push(payload);
    }

    return payloads;
  },

  getSampleValidValue(field: any): any {
    if (field instanceof z.ZodString) return "test-string";
    if (field instanceof z.ZodNumber) return 123;
    if (field instanceof z.ZodBoolean) return true;
    if (field instanceof z.ZodArray) return [];
    if (field instanceof z.ZodObject) return {};
    if (field instanceof z.ZodEnum) return field._def.values[0];
    if (field instanceof z.ZodOptional || field instanceof z.ZodNullable) return this.getSampleValidValue(field._def.innerType);
    return "test";
  },

  getWrongTypeValue(field: any): any {
    if (field instanceof z.ZodString) return 12345;
    if (field instanceof z.ZodNumber) return "not-a-number";
    if (field instanceof z.ZodBoolean) return "not-a-boolean";
    if (field instanceof z.ZodArray) return "not-an-array";
    if (field instanceof z.ZodObject) return "not-an-object";
    return null;
  }
};

