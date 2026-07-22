import type { ScenarioResult } from "./types";

export interface Summary {
  total: number;
  passed: number;
  failed: number;
  totalDurationMs: number;
  avgDurationMs: number;
  byDomain: Record<string, { total: number; failed: number }>;
  byFault: Record<string, { total: number; failed: number }>;
  topViolations: Array<{ invariant: string; count: number }>;
  failedSeeds: Array<{ id: string; seed: number; invariants: string[] }>;
}

export function summarize(results: readonly ScenarioResult[]): Summary {
  const byDomain: Summary["byDomain"] = {};
  const byFault: Summary["byFault"] = {};
  const violationCount = new Map<string, number>();
  const failedSeeds: Summary["failedSeeds"] = [];
  let totalDurationMs = 0;
  let failed = 0;

  for (const r of results) {
    totalDurationMs += r.durationMs;
    const d = (byDomain[r.spec.domain] ??= { total: 0, failed: 0 });
    const f = (byFault[r.spec.fault.kind] ??= { total: 0, failed: 0 });
    d.total++;
    f.total++;
    if (r.violations.length > 0) {
      failed++;
      d.failed++;
      f.failed++;
      failedSeeds.push({
        id: r.spec.id,
        seed: r.spec.seed,
        invariants: r.violations.map((v) => v.invariant),
      });
      for (const v of r.violations) {
        violationCount.set(v.invariant, (violationCount.get(v.invariant) ?? 0) + 1);
      }
    }
  }

  const topViolations = [...violationCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([invariant, count]) => ({ invariant, count }));

  return {
    total: results.length,
    passed: results.length - failed,
    failed,
    totalDurationMs,
    avgDurationMs: results.length ? totalDurationMs / results.length : 0,
    byDomain,
    byFault,
    topViolations,
    failedSeeds: failedSeeds.slice(0, 50),
  };
}

export function toMarkdown(s: Summary): string {
  const lines: string[] = [];
  lines.push("# Scenario Harness — Relatório");
  lines.push("");
  lines.push(`- **Total:** ${s.total}`);
  lines.push(`- **Passou:** ${s.passed}`);
  lines.push(`- **Falhou:** ${s.failed}`);
  lines.push(`- **Duração total:** ${s.totalDurationMs.toFixed(1)} ms`);
  lines.push(`- **Duração média:** ${s.avgDurationMs.toFixed(3)} ms/cenário`);
  lines.push("");
  lines.push("## Por domínio");
  lines.push("");
  lines.push("| Domínio | Total | Falhas |");
  lines.push("|---|---:|---:|");
  for (const [k, v] of Object.entries(s.byDomain)) {
    lines.push(`| ${k} | ${v.total} | ${v.failed} |`);
  }
  lines.push("");
  lines.push("## Por falha injetada");
  lines.push("");
  lines.push("| Falha | Total | Falhas |");
  lines.push("|---|---:|---:|");
  for (const [k, v] of Object.entries(s.byFault)) {
    lines.push(`| ${k} | ${v.total} | ${v.failed} |`);
  }
  if (s.topViolations.length) {
    lines.push("");
    lines.push("## Top invariantes violados");
    lines.push("");
    for (const v of s.topViolations) lines.push(`- \`${v.invariant}\` — ${v.count}`);
  }
  if (s.failedSeeds.length) {
    lines.push("");
    lines.push("## Seeds para reprodução");
    lines.push("");
    for (const f of s.failedSeeds) {
      lines.push(`- ${f.id} — seed \`${f.seed}\` — [${f.invariants.join(", ")}]`);
    }
  }
  return lines.join("\n");
}
