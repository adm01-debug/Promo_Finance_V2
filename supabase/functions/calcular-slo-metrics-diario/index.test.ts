// Regressão: o upsert em slo_metrics_diarias precisa preencher `servico`
// (TEXT NOT NULL sem default — drift de prod não versionado). Antes do fix o
// handler montava o payload sem a coluna e o banco retornava
// "null value in column servico violates not-null constraint", transformado em
// 500 pelo catch — a tabela ficava vazia e o SLO nunca era persistido.

import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';

Deno.env.set('DENO_TESTING', '1');

const { montarUpsertSLO } = await import('./index.ts');

Deno.test('payload do upsert preenche servico e todas as colunas obrigatorias', () => {
  const payload = montarUpsertSLO({
    hoje: '2026-11-20',
    totalReq: 10,
    p50: 5,
    p95: 9,
    p99: 12,
    taxaErro: 1.5,
    uptime: 99.5,
    cronOk: 8,
    cronFail: 2,
    edgesHealth: { ping: { calls: 10, errors: 1, p95: 9 } },
    calculadoEm: '2026-11-20T13:00:00.000Z',
  });

  assertEquals(payload.servico, 'geral');
  assertEquals(payload.data, '2026-11-20');
  assertEquals(payload.total_requisicoes, 10);
  assertEquals(payload.latencia_p50_ms, 5);
  assertEquals(payload.latencia_p95_ms, 9);
  assertEquals(payload.latencia_p99_ms, 12);
  assertEquals(payload.taxa_erro_pct, 1.5);
  assertEquals(payload.uptime_pct, 99.5);
  assertEquals(payload.cron_jobs_sucesso, 8);
  assertEquals(payload.cron_jobs_falha, 2);
  assertEquals(payload.edges_health, { ping: { calls: 10, errors: 1, p95: 9 } });
  assertEquals(payload.calculado_em, '2026-11-20T13:00:00.000Z');
});
