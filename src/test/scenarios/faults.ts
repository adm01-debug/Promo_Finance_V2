import type { Rng } from "./rng";
import type { FaultSpec } from "./types";

/**
 * Injetores de falha aplicados sobre streams/callbacks in-memory.
 * Puros e determinísticos dado um Rng.
 */

export function reorder<T>(events: readonly T[], rng: Rng): T[] {
  const out = events.slice();
  // Fisher–Yates parcial: troca até size/3 pares.
  const swaps = Math.max(1, Math.floor(out.length / 3));
  for (let s = 0; s < swaps; s++) {
    const i = rng.int(0, out.length - 1);
    const j = rng.int(0, out.length - 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function duplicate<T>(events: readonly T[], k: number, rng: Rng): T[] {
  if (k <= 1 || events.length === 0) return events.slice();
  const out: T[] = [];
  for (const e of events) {
    out.push(e);
    if (rng.bool(0.5)) {
      const times = rng.int(1, k - 1);
      for (let t = 0; t < times; t++) out.push(e);
    }
  }
  return out;
}

/**
 * Decide se a próxima operação deve falhar dado o FaultSpec.
 * Retorna null se ok, ou uma string com a razão.
 */
export function shouldFail(fault: FaultSpec, rng: Rng, opIndex: number): string | null {
  switch (fault.kind) {
    case "flaky":
      return rng.bool(fault.param ?? 0.1) ? "flaky" : null;
    case "timeout":
      // "após N ms" — modelamos como "após N ops" já que não temos I/O real.
      return opIndex >= (fault.param ?? 3) ? "timeout" : null;
    case "partial_write":
      return opIndex > 0 && rng.bool(fault.param ?? 0.2) ? "partial_write" : null;
    case "latency":
    case "reorder":
    case "duplicate":
    case "nfe_gzip_corrupt":
    case "nfe_nsu_gap":
    case "nfe_soap_timeout":
    case "entrega_driver_offline":
    case "entrega_gps_lost":
    case "entrega_pod_missing":
    case "entrega_status_regressivo":
    case "none":
      return null;
  }
}
