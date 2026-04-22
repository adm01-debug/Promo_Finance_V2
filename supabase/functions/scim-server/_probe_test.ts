// Probe what env is available in test runtime
Deno.test("env probe", () => {
  const keys = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY", "VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];
  for (const k of keys) console.log(k, "=", Deno.env.get(k) ? `set(${Deno.env.get(k)!.slice(0, 12)}…)` : "MISSING");
});
