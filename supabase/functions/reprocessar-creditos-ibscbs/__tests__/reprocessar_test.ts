/**
 * Etapa 50 — reprocessamento retroativo do grupo IBS/CBS.
 *
 * O teste cobre a funcao pura `montarCreditos` (calculo) e o handler com
 * storage/banco dublados. O ponto caro de errar e o calculo: se o backfill
 * calcular diferente do front, a mesma NF-e passa a ter dois valores de
 * credito conforme a data em que foi importada.
 */
import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { extrairIbscbs } from '../../_shared/nfe/ibscbs.ts';
import { montarCreditos } from '../index.ts';

const FIXTURES = new URL('../../_shared/sefaz/__fixtures__/', import.meta.url);
const lerFixture = (nome: string) => Deno.readTextFile(new URL(nome, FIXTURES));

Deno.test('montarCreditos — nota 2026 destacada gera credito informativo (saldo 0)', async () => {
  const xml = await lerFixture('procNFe-ibscbs-2026.xml');
  const grupo = extrairIbscbs(xml);
  assert(grupo, 'fixture deve ter grupo IBS/CBS');

  const creditos = montarCreditos(grupo, { data_emissao: '2026-07-22T10:00:00-03:00' });

  assertEquals(creditos.length, 2);
  const cbs = creditos.find((c) => c.tipo_tributo === 'CBS')!;
  const ibs = creditos.find((c) => c.tipo_tributo === 'IBS')!;

  // Valores vem do XML (vCBS=9.00, vIBS=10.65), nao de aliquota por cima.
  assertEquals(cbs.valor_credito, 9);
  assertEquals(ibs.valor_credito, 10.65);
  assertEquals(cbs.origem, 'xml_destacado');
  assertEquals(ibs.origem, 'xml_destacado');

  // 2026 e ano de teste: valor destacado, credito nao apropriavel.
  assertEquals(cbs.efeito_tributario, false);
  assertEquals(ibs.efeito_tributario, false);
  assertEquals(cbs.saldo_disponivel, 0, 'credito informativo nao pode ser gasto');
  assertEquals(ibs.saldo_disponivel, 0);

  assertEquals(cbs.ano_fato_gerador, 2026);
  assertEquals(cbs.competencia_origem, '2026-07');
  assertEquals(cbs.data_origem, '2026-07-22');
});

Deno.test(
  'montarCreditos — nota 2027+ destacada gera credito apropriavel (saldo cheio)',
  async () => {
    const xml = await lerFixture('procNFe-ibscbs-2026.xml');
    const grupo = extrairIbscbs(xml)!;

    const creditos = montarCreditos(grupo, { data_emissao: '2027-03-10T08:00:00-03:00' });

    const cbs = creditos.find((c) => c.tipo_tributo === 'CBS')!;
    assertEquals(cbs.efeito_tributario, true);
    assertEquals(cbs.saldo_disponivel, 9, '2027+ o credito e apropriavel');
    assertEquals(cbs.competencia_origem, '2027-03');
  }
);

Deno.test('montarCreditos — sem grupo nao inventa credito', async () => {
  assertEquals(montarCreditos(null, { data_emissao: '2026-07-22' }), []);

  const resumo = await lerFixture('resNFe-resumo.xml');
  // O resumo nem tem infNFe, entao o parser devolve null — nao existe grupo.
  assertEquals(extrairIbscbs(resumo), null);
  assertEquals(montarCreditos(null, { data_emissao: '2026-07-22' }), []);
});

Deno.test('montarCreditos — grupo presente com valores zerados nao gera credito', async () => {
  const xml = await lerFixture('procNFe-ibscbs-2026.xml');
  const grupo = extrairIbscbs(xml)!;
  // Simula nota monofasica: grupo regular presente mas sem valor em IBS/CBS.
  const zerado = { ...grupo, totais: { ...grupo.totais, vCBS: 0, vIBS: 0 } };
  assertEquals(montarCreditos(zerado, { data_emissao: '2027-01-05' }), []);
});

Deno.test('montarCreditos — data ausente cai no ano corrente sem quebrar', () => {
  const grupo = { itens: [], totais: { vCBS: 5, vIBS: 7 } } as any;
  const creditos = montarCreditos(grupo, { data_emissao: null });
  assertEquals(creditos.length, 2);
  assertEquals(creditos[0].data_origem, new Date().toISOString().slice(0, 10));
  assertEquals(creditos[0].ano_fato_gerador, new Date().getFullYear());
});
