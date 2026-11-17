/**
 * Contrato da resposta de ano sem faturamento.
 *
 * Revisao da PR #403 (Devin): o teste anterior vivia no vitest e assertava uma
 * CONSTANTE LOCAL copiada da funcao -- passaria mesmo se a resposta real
 * voltasse a omitir `insights`. Aqui a assercao roda sobre a funcao da propria
 * Edge Function, descoberta pelo job "Unit tests (offline, deterministic)"
 * (.github/workflows/deno-tests.yml:124, varredura por diretorio).
 */
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { respostaSemFaturamento } from './index.ts';

Deno.test('ano sem lancamento: contrato completo, sem numero inventado', () => {
  const r = respostaSemFaturamento(2025, '11111111-1111-4111-8111-111111111111');

  assertEquals(r.ano, 2025);
  assertEquals(r.empresa_id, '11111111-1111-4111-8111-111111111111');
  assertEquals(r.motivo, 'sem_faturamento_no_ano');
  assertEquals(r.celulas.length, 0);
  assertEquals(r.meses_com_lancamento.length, 0);
  assertEquals(r.total_ano, 0);
  assertEquals(r.max_valor, 0);
});

Deno.test('`insights` presente com pico e vale nulos (o painel le antes da guarda)', () => {
  const r = respostaSemFaturamento(2025, 'e1');

  // HeatmapTributarioAnual.tsx:83 avalia `data.insights?.mes_pico` dentro de
  // `{data && ...}`, antes da guarda de vazio: omitir a chave ou mandar um mes
  // aqui volta a quebrar o cabecalho.
  assertEquals(typeof r.insights, 'object');
  assertEquals(r.insights.mes_pico, null);
  assertEquals(r.insights.mes_vale, null);
});

Deno.test('total_por_mes tem 12 posicoes zeradas', () => {
  const r = respostaSemFaturamento(2025, 'e1');

  assertEquals(r.total_por_mes.length, 12);
  assertEquals(
    r.total_por_mes.every((v) => v === 0),
    true
  );
});
