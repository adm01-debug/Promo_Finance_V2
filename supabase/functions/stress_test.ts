import { runLoadTest } from "./_shared/load-tester.ts";

/**
 * Performance Stress Test for Asaas Proxy.
 * Run this to measure how the system handles high load.
 */

// This is meant to be run manually or in a specific performance pipeline
if (import.meta.main) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is required for load testing.");
    Deno.exit(1);
  }

  const results = await runLoadTest(`${SUPABASE_URL}/functions/v1/asaas-proxy`, {
    concurrency: 50, // Increased for real stress
    durationMs: 10000, // 10s

    headers: {
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: {
      action: "list_payments",
      data: {}
    }
  });

  if (results.failedRequests > 0) {
    console.warn(`⚠️ Warning: ${results.failedRequests} requests failed during stress test.`);
  }
}
