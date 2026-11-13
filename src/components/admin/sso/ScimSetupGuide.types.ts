export type TestResult =
  | { ok: true; status: number; latencyMs: number }
  | { ok: false; status?: number; latencyMs?: number; message: string; hint?: string };
