import { assertEquals } from 'jsr:@std/assert@1.0.6';
import {
  extrairUfs,
  MIN_UFS,
  montarMunicipio,
  montarUf,
  montarUniao,
  ordenarPorPendencia,
  paraFracao,
} from '../montar.ts';
import { erroHttp, erroNaoJson } from '../../_shared/rfb-dados-abertos.ts';

Deno.test('paraFracao converte pontos percentuais em fracao de 4 casas', () => {
  // Valores reais das rotas, lidos em 2026-11-26 para data=2026-06-01.
  assertEquals(paraFracao(0.9), 0.009); // CBS nacional
  assertEquals(paraFracao(0.1), 0.001); // IBS estadual
  assertEquals(paraFracao(0), 0); // IBS municipal sem aliquota propria
  assertEquals(paraFracao('0.1'), 0.001);
  assertEquals(paraFracao('0,1'), 0.001);
  assertEquals(paraFracao(5.005), 0.05);
  // Teto de 4 casas: numeric(5,4) nao guarda mais que isso.
  assertEquals(paraFracao(1.23456), 0.0123);
});

Deno.test('paraFracao recusa ausencia, valor invalido e o que nao cabe em numeric(5,4)', () => {
  assertEquals(paraFracao(null), null);
  assertEquals(paraFracao(undefined), null);
  // String vazia e ausencia: `Number('')` e 0 e viraria aliquota zero gravada.
  assertEquals(paraFracao(''), null);
  assertEquals(paraFracao('  '), null);
  assertEquals(paraFracao(-0.1), null);
  assertEquals(paraFracao(Number.NaN), null);
  assertEquals(paraFracao(Number.POSITIVE_INFINITY), null);
  assertEquals(paraFracao(1000), null); // 10,00 nao cabe em numeric(5,4)
});

Deno.test('montarUniao grava CBS nacional sem ente', () => {
  assertEquals(montarUniao({ aliquotaReferencia: 0.9 }, 2026), {
    ano: 2026,
    tributo: 'cbs',
    uf: null,
    municipio_ibge: null,
    aliquota: 0.009,
  });
});

Deno.test('montarUniao devolve null quando a aliquota nao foi publicada', () => {
  // 404 >=2027: a API responde corpo JSON de "nao encontrada"; o chamador passa null.
  assertEquals(montarUniao(null, 2027), null);
  assertEquals(montarUniao({}, 2027), null);
  assertEquals(montarUniao({ aliquotaReferencia: null }, 2027), null);
});

Deno.test('montarUf normaliza a sigla e recusa ente invalido', () => {
  assertEquals(montarUf('rs', { aliquotaReferencia: 0.1 }, 2026), {
    ano: 2026,
    tributo: 'ibs_uf',
    uf: 'RS',
    municipio_ibge: null,
    aliquota: 0.001,
  });
  assertEquals(montarUf(' RS ', { aliquotaReferencia: 0.1 }, 2026)?.uf, 'RS');
  assertEquals(montarUf('43', { aliquotaReferencia: 0.1 }, 2026), null);
  assertEquals(montarUf(null, { aliquotaReferencia: 0.1 }, 2026), null);
});

Deno.test('montarMunicipio exige codigo IBGE de 7 digitos e guarda a sigla da UF', () => {
  assertEquals(montarMunicipio('4314902', 'RS', { aliquotaReferencia: 0 }, 2026), {
    ano: 2026,
    tributo: 'ibs_mun',
    uf: 'RS',
    municipio_ibge: '4314902',
    aliquota: 0,
  });
  assertEquals(
    montarMunicipio(4314902, 'RS', { aliquotaReferencia: 0.1 }, 2026)?.municipio_ibge,
    '4314902'
  );
  // Sem sigla conhecida a linha ainda entra: `uf` e nulo, nao inventado.
  assertEquals(montarMunicipio('4314902', null, { aliquotaReferencia: 0.1 }, 2026)?.uf, null);
  assertEquals(montarMunicipio('431', 'RS', { aliquotaReferencia: 0.1 }, 2026), null);
  assertEquals(montarMunicipio('431490', 'RS', { aliquotaReferencia: 0.1 }, 2026), null);
  assertEquals(montarMunicipio(null, 'RS', { aliquotaReferencia: 0.1 }, 2026), null);
});

Deno.test('extrairUfs traduz codigo IBGE em sigla e ignora entrada invalida', () => {
  const mapa = extrairUfs([
    { codigo: 11, nome: 'RONDÔNIA', sigla: 'RO' },
    { codigo: 43, nome: 'RIO GRANDE DO SUL', sigla: 'RS' },
    { codigo: 43, sigla: 'XX' },
    { codigo: '1', sigla: 'AC' },
    { codigo: 12, sigla: 'acre' },
    { codigo: 13 },
  ]);
  assertEquals(mapa.size, 2);
  assertEquals(mapa.get('11'), 'RO');
  assertEquals(mapa.get('43'), 'RS');
  assertEquals(extrairUfs(null).size, 0);
  assertEquals(extrairUfs({}).size, 0);
});

Deno.test('extrairUfs cobre as 27 UFs quando a rota responde o pais inteiro', () => {
  const siglas = [
    'RO',
    'AC',
    'AM',
    'RR',
    'PA',
    'AP',
    'TO',
    'MA',
    'PI',
    'CE',
    'RN',
    'PB',
    'PE',
    'AL',
    'SE',
    'BA',
    'MG',
    'ES',
    'RJ',
    'SP',
    'PR',
    'SC',
    'RS',
    'MS',
    'MT',
    'GO',
    'DF',
  ];
  const payload = siglas.map((sigla, indice) => ({ codigo: 11 + indice, sigla }));
  const mapa = extrairUfs(payload);
  assertEquals(mapa.size, MIN_UFS);
});

Deno.test('ordenarPorPendencia prioriza o que falta e respeita o teto', () => {
  const r = ordenarPorPendencia(['11', '12', '13', '14'], new Set(['12']), 2);
  assertEquals(r.alvos, ['11', '13']);
  assertEquals(r.pendentes, 3);
});

Deno.test('ordenarPorPendencia completa a rodada com o que ja existe quando nada falta', () => {
  const r = ordenarPorPendencia(['11', '12', '13'], new Set(['11', '12', '13']), 2);
  assertEquals(r.alvos, ['11', '12']);
  assertEquals(r.pendentes, 0);
});

Deno.test('ordenarPorPendencia deduplica, descarta vazio e aceita teto invalido', () => {
  assertEquals(ordenarPorPendencia([11, 11, '11'], new Set(), 5), { alvos: ['11'], pendentes: 1 });
  assertEquals(ordenarPorPendencia([null, undefined, '  '], new Set(), 5), {
    alvos: [],
    pendentes: 0,
  });
  assertEquals(ordenarPorPendencia(['11'], new Set(), 0), { alvos: [], pendentes: 1 });
  assertEquals(ordenarPorPendencia(['11'], new Set(), Number.NaN), { alvos: [], pendentes: 1 });
});

Deno.test('erroHttp distingue 404 (nao publicada) de outros status', () => {
  assertEquals(erroHttp(new Error('dados_abertos_http_404'), 404), true);
  assertEquals(erroHttp(new Error('dados_abertos_http_500'), 404), false);
  assertEquals(erroHttp(new Error('dados_abertos_nao_json: <html'), 404), false);
  assertEquals(erroHttp('dados_abertos_http_404', 404), false);
});

Deno.test('erroNaoJson identifica o bloqueio por taxa do WAF (200 com HTML)', () => {
  assertEquals(
    erroNaoJson(new Error('dados_abertos_nao_json: <html>Request Rejected</html>')),
    true
  );
  assertEquals(erroNaoJson(new Error('dados_abertos_http_404')), false);
  assertEquals(erroNaoJson(null), false);
});
