import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Fuzzer utility to generate "bad" payloads for testing robustness.
 */
export const Fuzzer = {
  /**
   * Generates a variety of invalid payloads based on common failure modes.
   */
  generateInvalidPayloads(): any[] {
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
   * Helper to run a fuzz test against a specific function's logic
   */
  async runFuzzTest(handler: (req: Request) => Promise<Response>, baseUrl: string = "http://localhost") {
    const payloads = this.generateInvalidPayloads();
    const results = [];

    for (const payload of payloads) {
      const req = new Request(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      try {
        const res = await handler(req);
        results.push({
          payload,
          status: res.status,
          success: res.status === 400 || res.status === 422 || res.status === 401, // Expected failure statuses
        });
      } catch (err) {
        results.push({
          payload,
          error: err.message,
          success: false, // Crashing is a failure
        });
      }
    }

    return results;
  }
};
