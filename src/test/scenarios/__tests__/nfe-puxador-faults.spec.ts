import { describe, it, expect } from "vitest";
import { buildMatrix } from "../generator";
import { runScenario } from "../runner";
import type { FaultKind } from "../types";

/**
 * Confirma que os 5 invariantes NFe da Fase 0 continuam verdes mesmo
 * quando o harness injeta os novos faults do puxador DFe:
 *   - nfe_gzip_corrupt
 *   - nfe_nsu_gap
 *   - nfe_soap_timeout
 */
describe("scenarios/nfe :: novos faults do puxador SEFAZ", () => {
  const NFE_FAULTS: FaultKind[] = ["nfe_gzip_corrupt", "nfe_nsu_gap", "nfe_soap_timeout"];

  it("1000 cenários NFe × 3 faults do puxador ⇒ 0 violações", () => {
    const specs = buildMatrix({
      count: 1000,
      seed: 20260722,
      domains: ["nfe"],
      faults: NFE_FAULTS,
      size: 25,
    });
    const results = specs.map(runScenario);
    const violations = results.flatMap((r) =>
      r.violations.map((v) => ({ id: r.spec.id, seed: r.spec.seed, ...v })),
    );
    expect(violations).toEqual([]);
  });

  it("cada fault kind produz cenários que executam sem violar invariantes", () => {
    for (const kind of NFE_FAULTS) {
      const specs = buildMatrix({
        count: 50,
        seed: 7,
        domains: ["nfe"],
        faults: [kind],
        size: 20,
      });
      const results = specs.map(runScenario);
      const withMutations = results.filter((r) => r.mutations > 0).length;
      expect(withMutations, `${kind}: nenhum cenário mutou estado`).toBeGreaterThan(0);
      const violations = results.flatMap((r) => r.violations);
      expect(violations, `${kind} teve violações`).toEqual([]);
    }
  });
});
