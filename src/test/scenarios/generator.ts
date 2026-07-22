import type { Domain, FaultKind, FaultSpec, ScenarioSpec } from "./types";
import { createRng } from "./rng";

const DOMAINS: Domain[] = ["conciliacao", "webhooks", "cobranca", "anomalias"];
const FAULT_KINDS: FaultKind[] = [
  "none",
  "timeout",
  "flaky",
  "reorder",
  "duplicate",
  "latency",
  "partial_write",
];

function faultParam(kind: FaultKind, rng: ReturnType<typeof createRng>): FaultSpec {
  switch (kind) {
    case "flaky":
      return { kind, param: rng.pick([0.05, 0.1, 0.2, 0.3]) };
    case "timeout":
      return { kind, param: rng.int(2, 8) };
    case "duplicate":
      return { kind, param: rng.pick([2, 3, 5]) };
    case "latency":
      return { kind, param: rng.int(10, 200) };
    case "partial_write":
      return { kind, param: rng.pick([0.1, 0.2, 0.3]) };
    default:
      return { kind };
  }
}

export interface BuildMatrixOptions {
  count?: number;
  seed?: number;
  domains?: readonly Domain[];
  faults?: readonly FaultKind[];
  size?: number;
}

/**
 * Gera N cenários distribuídos uniformemente pela matriz (domínio × falha).
 * Cada spec carrega um seed determinístico para reprodução.
 */
export function buildMatrix(opts: BuildMatrixOptions = {}): ScenarioSpec[] {
  const count = opts.count ?? 500;
  const rootSeed = opts.seed ?? 42;
  const domains = opts.domains ?? DOMAINS;
  const faults = opts.faults ?? FAULT_KINDS;
  const size = opts.size ?? 20;
  const rng = createRng(rootSeed);

  const specs: ScenarioSpec[] = [];
  for (let i = 0; i < count; i++) {
    const domain = domains[i % domains.length];
    const kind = faults[Math.floor(i / domains.length) % faults.length];
    const fault = faultParam(kind, rng);
    const seed = ((rootSeed + i * 2654435761) >>> 0) || 1;
    specs.push({
      id: `sc-${i.toString().padStart(4, "0")}-${domain}-${kind}`,
      domain,
      fault,
      seed,
      size,
    });
  }
  return specs;
}
