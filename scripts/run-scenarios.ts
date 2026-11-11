#!/usr/bin/env bun
/**
 * CLI: gera e executa N cenários, escreve relatório Markdown + JSON.
 *
 * Uso:
 *   bun run scripts/run-scenarios.ts --count 500 --seed 42 --domain all \
 *     --out /mnt/documents/scenarios-report.md
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildMatrix } from '../src/test/scenarios/generator';
import { runScenario } from '../src/test/scenarios/runner';
import { summarize, toMarkdown } from '../src/test/scenarios/report';
import type { Domain } from '../src/test/scenarios/types';

// Erro de uso sai com 2; exit 1 fica reservado para "algum cenário falhou".
function falhar(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(2);
}

function arg(name: string, fallback?: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx < 0) return fallback;
  const valor = process.argv[idx + 1];
  if (valor === undefined || valor.startsWith('--')) falhar(`--${name} exige um valor`);
  return valor;
}

// Domínios que o gerador realmente produz — derivado dele para não ficar para
// trás (a lista fixa daqui omitia `nfe`).
const ALL: Domain[] = [...new Set(buildMatrix({ count: 64, seed: 1 }).map((s) => s.domain))];

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(
    `Uso: bun run scripts/run-scenarios.ts [--count N] [--seed N] [--domain all|${ALL.join(',')}] [--out relatorio.md]`
  );
  process.exit(0);
}

const count = Number(arg('count', '500'));
const seed = Number(arg('seed', '42'));
const domainArg = arg('domain', 'all');
const out = arg('out', './scenarios-report.md')!;

// Sem estas validações, `--count abc` rodava 0 cenários e um domínio
// desconhecido rodava cenários vazios — ambos terminando em "passou" com exit 0.
if (!Number.isInteger(count) || count <= 0)
  falhar(`--count inválido: ${arg('count')} (use inteiro > 0)`);
if (!Number.isInteger(seed)) falhar(`--seed inválido: ${arg('seed')} (use inteiro)`);

const pedidos = (domainArg ?? 'all')
  .split(',')
  .map((d) => d.trim())
  .filter(Boolean);
const invalidos = pedidos.filter((d) => d !== 'all' && !ALL.includes(d as Domain));
if (invalidos.length > 0)
  falhar(`--domain inválido: ${invalidos.join(',')} (use all ou ${ALL.join(',')})`);
const domains: Domain[] =
  pedidos.length === 0 || pedidos.includes('all') ? ALL : (pedidos as Domain[]);

console.log(`▶ Gerando ${count} cenários (seed=${seed}, domínios=${domains.join(',')})`);
const specs = buildMatrix({ count, seed, domains });
const t0 = Date.now();
const results = specs.map(runScenario);
const dt = Date.now() - t0;
const summary = summarize(results);

// Sem sufixo .md o replace não mudava nada e o JSON sobrescrevia o Markdown.
const outJson = out.endsWith('.md') ? out.replace(/\.md$/, '.json') : `${out}.json`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, toMarkdown(summary));
writeFileSync(outJson, JSON.stringify(summary, null, 2));

console.log(
  `✔ ${summary.passed}/${summary.total} passou · ${summary.failed} falhou · ${dt}ms wall`
);
console.log(`📄 ${out}`);
if (summary.failed > 0) process.exit(1);
