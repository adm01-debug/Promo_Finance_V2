#!/usr/bin/env bun
/**
 * CLI: gera e executa N cenários, escreve relatório Markdown + JSON.
 *
 * Uso:
 *   bun run scripts/run-scenarios.ts --count 500 --seed 42 --domain all \
 *     --out /mnt/documents/scenarios-report.md
 */
import { writeFileSync } from "node:fs";
import { buildMatrix } from "../src/test/scenarios/generator";
import { runScenario } from "../src/test/scenarios/runner";
import { summarize, toMarkdown } from "../src/test/scenarios/report";
import type { Domain } from "../src/test/scenarios/types";

function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const count = Number(arg("count", "500"));
const seed = Number(arg("seed", "42"));
const domainArg = arg("domain", "all");
const out = arg("out", "/mnt/documents/scenarios-report.md")!;

const ALL: Domain[] = ["conciliacao", "webhooks", "cobranca", "anomalias"];
const domains: Domain[] =
  domainArg === "all" || !domainArg ? ALL : (domainArg.split(",") as Domain[]);

console.log(`▶ Gerando ${count} cenários (seed=${seed}, domínios=${domains.join(",")})`);
const specs = buildMatrix({ count, seed, domains });
const t0 = Date.now();
const results = specs.map(runScenario);
const dt = Date.now() - t0;
const summary = summarize(results);

writeFileSync(out, toMarkdown(summary));
writeFileSync(out.replace(/\.md$/, ".json"), JSON.stringify(summary, null, 2));

console.log(
  `✔ ${summary.passed}/${summary.total} passou · ${summary.failed} falhou · ${dt}ms wall`,
);
console.log(`📄 ${out}`);
if (summary.failed > 0) process.exit(1);
