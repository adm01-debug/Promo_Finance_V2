import { describe, it, expect } from "vitest";
import { buildMatrix } from "../generator";
import { runScenario } from "../runner";
import { summarize } from "../report";

const COUNT = Number(process.env.SCENARIOS_COUNT ?? 500);

describe("Scenario Harness", () => {
  it(`${COUNT} cenários combinatórios: zero violações de invariantes`, () => {
    const specs = buildMatrix({ count: COUNT, seed: 42 });
    const results = specs.map(runScenario);
    const summary = summarize(results);

    if (summary.failed > 0) {
      // eslint-disable-next-line no-console
      console.error(
        "Cenários com violação:",
        JSON.stringify(summary.failedSeeds.slice(0, 10), null, 2),
      );
    }

    expect(summary.failed).toBe(0);
    expect(summary.total).toBe(COUNT);
  }, 30_000);
});
