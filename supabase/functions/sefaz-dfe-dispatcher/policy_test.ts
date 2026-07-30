// Deno test — simulação exaustiva da política de retry/backoff do dispatcher.
// Executa 1000 cenários × 96 ticks (24h reais em intervalos de 15min) e valida
// invariantes de segurança operacional.

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  applyOutcome,
  backoffMs,
  BASE_INTERVAL_MS,
  CIRCUIT_OPEN_THRESHOLD,
  isEligible,
  MAX_BACKOFF_MS,
  type CursorState,
  type PullOutcome,
} from "./policy.ts";

// ---------------- helpers ----------------

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Profile = "always_ok" | "always_fail" | "flaky" | "recovers" | "neutral_only";

function makeCursor(cnpj: string, now: number): CursorState {
  return {
    cnpj,
    retry_count: 0,
    next_run_at: now,
    last_error_at: null,
    circuit_open: false,
    ultima_consulta: null,
  };
}

function outcomeFor(
  profile: Profile,
  tick: number,
  rand: () => number,
): PullOutcome {
  switch (profile) {
    case "always_ok":
      return { kind: "success" };
    case "always_fail":
      return { kind: "failure", errorTag: "sefaz-500" };
    case "flaky":
      return rand() < 0.7
        ? { kind: "failure", errorTag: "timeout" }
        : { kind: "success" };
    case "recovers":
      // Falha as primeiras N tentativas, depois estabiliza.
      return tick < 4
        ? { kind: "failure", errorTag: "cert-parse" }
        : { kind: "success" };
    case "neutral_only":
      return { kind: "failure", neutral: true, errorTag: "puller-missing" };
  }
}

// ---------------- unit ----------------

Deno.test("backoffMs progride corretamente e satura no teto", () => {
  assertEquals(backoffMs(0), BASE_INTERVAL_MS);
  assertEquals(backoffMs(1), BASE_INTERVAL_MS * 2);
  assertEquals(backoffMs(2), BASE_INTERVAL_MS * 4);
  assertEquals(backoffMs(3), BASE_INTERVAL_MS * 8);
  // 15m * 16 = 4h → teto
  assertEquals(backoffMs(4), MAX_BACKOFF_MS);
  assertEquals(backoffMs(50), MAX_BACKOFF_MS);
});

Deno.test("sucesso zera retry e agenda +15min", () => {
  const t = 1_000_000;
  const c = { ...makeCursor("a", t), retry_count: 3, next_run_at: t + 999 };
  const next = applyOutcome(c, { kind: "success" }, t);
  assertEquals(next.retry_count, 0);
  assertEquals(next.next_run_at, t + BASE_INTERVAL_MS);
  assertEquals(next.circuit_open, false);
});

Deno.test("falha neutra não incrementa retry nem move next_run_at", () => {
  const t = 1_000_000;
  const c = makeCursor("a", t);
  const original = c.next_run_at;
  const next = applyOutcome(c, { kind: "failure", neutral: true }, t);
  assertEquals(next.retry_count, 0);
  assertEquals(next.next_run_at, original);
  assertEquals(next.ultima_consulta, t);
});

Deno.test("circuit abre exatamente na 8ª falha consecutiva", () => {
  let c = makeCursor("a", 0);
  for (let i = 1; i <= CIRCUIT_OPEN_THRESHOLD; i++) {
    c = applyOutcome(c, { kind: "failure" }, i * 1000);
    if (i < CIRCUIT_OPEN_THRESHOLD) {
      assertEquals(c.circuit_open, false, `abriu cedo em i=${i}`);
    } else {
      assertEquals(c.circuit_open, true, "não abriu na 8ª");
    }
  }
});

// ---------------- simulação exaustiva ----------------

Deno.test("simulação: 1000 cenários × 96 ticks preserva invariantes", () => {
  const profiles: Profile[] = [
    "always_ok",
    "always_fail",
    "flaky",
    "recovers",
    "neutral_only",
  ];
  const SCENARIOS = 1000;
  const TICKS = 96; // 24h em ticks de 15min
  const TICK_MS = 15 * 60 * 1000;

  let totalDecisions = 0;

  for (let s = 0; s < SCENARIOS; s++) {
    const rand = mulberry32(s + 1);
    const profile = profiles[s % profiles.length];
    const t0 = 1_700_000_000_000;
    let cursor = makeCursor(`cnpj-${s}`, t0);

    let lastBackoffAfterFail = 0;
    let consecutiveFailures = 0;

    for (let tick = 0; tick < TICKS; tick++) {
      const now = t0 + tick * TICK_MS;
      if (!isEligible(cursor, now)) continue;

      totalDecisions++;
      const before = cursor;
      const out = outcomeFor(profile, tick, rand);
      const after = applyOutcome(before, out, now);

      // INV1: next_run_at nunca regride para trás do agora após falha.
      if (out.kind === "failure" && !out.neutral) {
        assert(
          after.next_run_at > now,
          `INV1 violado s=${s} tick=${tick}: next=${after.next_run_at} now=${now}`,
        );
      }

      // INV2: nenhum CNPJ é executado antes de next_run_at anterior.
      assert(
        before.next_run_at <= now,
        `INV2 violado s=${s} tick=${tick}: executou antes de next_run_at`,
      );

      // INV3: backoff nunca decresce enquanto não houver sucesso.
      if (out.kind === "failure" && !out.neutral) {
        consecutiveFailures++;
        const bo = after.next_run_at - now;
        assert(
          bo >= lastBackoffAfterFail,
          `INV3 violado s=${s} tick=${tick}: bo=${bo} < prev=${lastBackoffAfterFail}`,
        );
        lastBackoffAfterFail = bo;
      }
      if (out.kind === "success") {
        // INV4: sucesso zera retry_count.
        assertEquals(after.retry_count, 0, `INV4 violado s=${s} tick=${tick}`);
        assertEquals(after.circuit_open, false);
        lastBackoffAfterFail = 0;
        consecutiveFailures = 0;
      }

      // INV5: circuit_open sse falhas consecutivas >= threshold.
      if (after.circuit_open) {
        assert(
          consecutiveFailures >= CIRCUIT_OPEN_THRESHOLD,
          `INV5 violado s=${s} tick=${tick}: circuit aberto com ${consecutiveFailures} falhas`,
        );
      }

      cursor = after;
    }
  }

  // Sanidade: pelo menos algumas decisões aconteceram.
  assert(totalDecisions > 1000, `poucas decisões: ${totalDecisions}`);
});
