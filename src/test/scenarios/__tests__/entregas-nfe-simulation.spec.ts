import { describe, it, expect } from "vitest";
import { buildMatrix } from "../generator";
import { runScenario } from "../runner";
import { summarize } from "../report";
import type { FaultKind } from "../types";

/**
 * Suíte focada: falhas e gaps de processamento de ENTREGAS + NF-e.
 *
 * Combina cada domínio com todas as falhas relevantes (genéricas e específicas
 * de cada trilha) e valida invariantes de idempotência, monotonicidade,
 * conservação, ordem causal e coerência operacional (POD/GPS/driver/manifestação).
 */

const ENTREGA_FAULTS: FaultKind[] = [
  "none",
  "flaky",
  "reorder",
  "duplicate",
  "partial_write",
  "timeout",
  "entrega_driver_offline",
  "entrega_gps_lost",
  "entrega_pod_missing",
  "entrega_status_regressivo",
];

const NFE_FAULTS: FaultKind[] = [
  "none",
  "flaky",
  "reorder",
  "duplicate",
  "partial_write",
  "nfe_gzip_corrupt",
  "nfe_nsu_gap",
  "nfe_soap_timeout",
];

const COUNT_ENTREGAS = Number(process.env.ENTREGAS_COUNT ?? 300);
const COUNT_NFE = Number(process.env.NFE_COUNT ?? 200);

describe("Simulação: falhas e gaps ENTREGAS + NF-e", () => {
  it(`${COUNT_ENTREGAS} cenários de ENTREGAS (Lalamove) sem violações de invariantes`, () => {
    const specs = buildMatrix({
      count: COUNT_ENTREGAS,
      seed: 20260723,
      domains: ["entregas"],
      faults: ENTREGA_FAULTS,
      size: 25,
    });
    const results = specs.map(runScenario);
    const summary = summarize(results);

    if (summary.failed > 0) {
      // eslint-disable-next-line no-console
      console.error(
        "Cenários ENTREGAS com violação:",
        JSON.stringify(summary.failedSeeds.slice(0, 10), null, 2),
        "top invariantes:",
        summary.topViolations,
      );
    }

    expect(summary.failed).toBe(0);
    expect(summary.total).toBe(COUNT_ENTREGAS);
    // Sanidade: deve haver mutations em pelo menos 80% dos cenários (fault=none real trabalha).
    const withMutations = results.filter((r) => r.mutations > 0).length;
    expect(withMutations / results.length).toBeGreaterThan(0.8);
  }, 30_000);

  it(`${COUNT_NFE} cenários de NF-e sem violações de invariantes`, () => {
    const specs = buildMatrix({
      count: COUNT_NFE,
      seed: 20260724,
      domains: ["nfe"],
      faults: NFE_FAULTS,
      size: 25,
    });
    const results = specs.map(runScenario);
    const summary = summarize(results);

    if (summary.failed > 0) {
      // eslint-disable-next-line no-console
      console.error(
        "Cenários NF-e com violação:",
        JSON.stringify(summary.failedSeeds.slice(0, 10), null, 2),
        "top invariantes:",
        summary.topViolations,
      );
    }

    expect(summary.failed).toBe(0);
    expect(summary.total).toBe(COUNT_NFE);
  }, 30_000);
});
