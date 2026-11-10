#!/usr/bin/env node
/**
 * Testes das funcoes puras do inventario (node --test scripts/inventario/inventario.unit.mjs).
 * Nao toca no banco, na rede nem no repo real: so fixtures em memoria.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extrairInventario, conferirOrigem, montarInventario, compararEdges, rodaTodoDia,
  PARECE_CREDENCIAL, PROJETO_OFICIAL, LIMIARES,
} from './gerar-banco.mjs';
import { semCarimbos, mudou } from './mudou-conteudo.mjs';
import { extrairChamadas, extrairImports, semAncora } from './gerar-rotas.mjs';

const BASE = {
  format_version: 1,
  medido_em: '2026-11-08T12:00:00Z',
  resumo: { tabelas_public: 2, ledger_registros: 391, ledger_versao_max: '20261101140005' },
  extensoes: [{ nome: 'pg_cron', versao: '1.6', schema: 'pg_catalog' }],
  tabelas: [
    { nome: 'empresas', rls: true, policies: 4, triggers: 1, linhas: 10, linhas_exatas: true, bytes: 8192, citada_no_banco: true },
    { nome: 'tabela_morta', rls: true, policies: 0, triggers: 0, linhas: 0, linhas_exatas: true, bytes: 0, citada_no_banco: false },
  ],
  cron: {
    config: { 'cron.max_running_jobs': '32' },
    jobs: [
      { nome: 'ok', agenda: '0 3 * * *', ativo: true, execucoes_24h: 1, falhas_24h: 0, execucoes_7d: 7, falhas_7d: 0, taxa_falha_7d_pct: 0 },
      { nome: 'ruim', agenda: '*/5 * * * *', ativo: true, execucoes_24h: 288, falhas_24h: 30, execucoes_7d: 2016, falhas_7d: 200, taxa_falha_7d_pct: 9.9 },
      { nome: 'mudo', agenda: '0 4 * * *', ativo: true, execucoes_24h: 0, falhas_24h: 0, execucoes_7d: 0, falhas_7d: 0, taxa_falha_7d_pct: 0 },
    ],
    horas_paradas_7d: [],
    historico: { linhas: 22609, mais_de_7_dias: 10, mais_antigo: '2026-10-01T00:00:00Z', bytes: 124166144 },
  },
};
const clonar = (o) => JSON.parse(JSON.stringify(o));
const USO = { empresas: { src: 3, edges: 1 }, tabela_morta: { src: 0, edges: 0 } };

test('extrairInventario aceita resposta do MCP, envelope tools/call e objeto direto', () => {
  assert.equal(extrairInventario({ rows: [{ inventario: clonar(BASE) }] }).format_version, 1);
  assert.equal(extrairInventario(JSON.stringify(clonar(BASE))).medido_em, BASE.medido_em);
  const envelope = { result: { content: [{ type: 'text', text: JSON.stringify({ rows: [{ inventario: clonar(BASE) }] }) }] } };
  assert.equal(extrairInventario(envelope).tabelas.length, 2);
});

test('extrairInventario recusa entrada incompleta ou de outro formato', () => {
  const semCron = clonar(BASE); delete semCron.cron;
  assert.throws(() => extrairInventario(semCron), /entrada sem as chaves: cron/);
  const outraVersao = { ...clonar(BASE), format_version: 2 };
  assert.throws(() => extrairInventario(outraVersao), /format_version 2 desconhecido/);
  const semTabelas = { ...clonar(BASE), tabelas: [] };
  assert.throws(() => extrairInventario(semTabelas), /entrada sem tabelas/);
});

test('conferirOrigem aprova o banco oficial e recusa banco irmao', () => {
  const origem = conferirOrigem(clonar(BASE), ['empresas', 'tabela_morta']);
  assert.equal(origem.tabelas_em_comum_com_types_ts, 2);
  assert.throws(
    () => conferirOrigem(clonar(BASE), ['outra_a', 'outra_b', 'outra_c', 'outra_d']),
    /nao parece ser do banco oficial/,
  );
});

test('montarInventario marca orfas, RLS sem policy e cron doente', () => {
  const inv = montarInventario(clonar(BASE), USO);
  assert.deepEqual(inv.tabelas_orfas.lista, ['tabela_morta']);
  const tipos = inv.alertas.map((a) => a.tipo).sort();
  assert.deepEqual(tipos, ['cron_falhando', 'cron_sem_execucao', 'rls_sem_policy']);
  assert.deepEqual(inv.alertas.find((a) => a.tipo === 'cron_sem_execucao').detalhe, ['mudo']);
  assert.match(inv.alertas.find((a) => a.tipo === 'cron_falhando').detalhe[0], /^ruim \(9\.9% em 7d\)$/);
  assert.equal(inv.tabelas.find((t) => t.nome === 'empresas').uso_no_codigo.src, 3);
});

test('montarInventario alerta tabela sem RLS e historico de cron sem limpeza', () => {
  const dado = clonar(BASE);
  dado.tabelas[0].rls = false;
  dado.cron.historico.mais_de_7_dias = LIMIARES.historicoCronMaisDe7Dias + 1;
  const tipos = montarInventario(dado, USO).alertas.map((a) => a.tipo);
  assert.ok(tipos.includes('tabela_sem_rls'));
  assert.ok(tipos.includes('historico_cron_sem_limpeza'));
});

test('compararEdges separa publicada sem codigo de codigo sem deploy', () => {
  const edges = compararEdges(
    [{ slug: 'asaas-proxy', version: 7, status: 'ACTIVE', verify_jwt: true, updated_at: '2026-11-01T10:00:00Z' },
      { slug: 'fantasma', version: 1, status: 'ACTIVE', verify_jwt: true, updated_at: null }],
    ['asaas-proxy', 'nova-sem-deploy'],
  );
  assert.deepEqual(edges.publicadas_sem_codigo_no_repo, ['fantasma']);
  assert.deepEqual(edges.no_repo_sem_deploy, ['nova-sem-deploy']);
  const inv = montarInventario(clonar(BASE), USO, edges);
  const tipos = inv.alertas.map((a) => a.tipo);
  assert.ok(tipos.includes('edge_sem_deploy'));
  assert.ok(tipos.includes('edge_publicada_sem_codigo'));
  assert.equal(compararEdges(null, ['x']).publicadas, null);
});

test('rodaTodoDia reconhece agenda diaria e recusa semanal', () => {
  assert.equal(rodaTodoDia('0 3 * * *'), true);
  assert.equal(rodaTodoDia('*/10 * * * *'), true);
  assert.equal(rodaTodoDia('30 seconds'), true);
  assert.equal(rodaTodoDia('0 6 * * 1'), false);
  assert.equal(rodaTodoDia('0 6 1 * *'), false);
  assert.equal(rodaTodoDia(undefined), false);
});

test('guardas de credencial e de projeto estao no lugar', () => {
  assert.equal(PROJETO_OFICIAL, 'bwwbeyolnnzppeuhgkcd');
  assert.ok(PARECE_CREDENCIAL.test('Authorization: Bearer abcdefghijklmnopqrstuvwxyz0123'));
  assert.ok(PARECE_CREDENCIAL.test('sb_secret_abc'));
  assert.equal(PARECE_CREDENCIAL.test('{"nome":"empresas","linhas":10}'), false);
});

test('semCarimbos ignora data e telemetria, mas nao mudanca estrutural', () => {
  const antes = JSON.stringify(clonar(BASE));
  const depois = clonar(BASE);
  depois.medido_em = '2026-11-15T12:00:00Z';
  depois.cron.jobs[1].taxa_falha_7d_pct = 10.4;
  depois.cron.historico.linhas = 30000;
  assert.equal(semCarimbos(antes), semCarimbos(JSON.stringify(depois)));
  const estrutural = clonar(BASE);
  estrutural.tabelas[0].rls = false;
  assert.notEqual(semCarimbos(antes), semCarimbos(JSON.stringify(estrutural)));
});

test('mudou trata arquivo novo, igual e alterado', () => {
  const inv = JSON.stringify(montarInventario(clonar(BASE), USO));
  assert.equal(mudou(['a.json'], () => null, () => inv), true);
  assert.equal(mudou(['a.json'], () => inv, () => inv), false);
  const outro = JSON.stringify(montarInventario({ ...clonar(BASE), tabelas: [clonar(BASE).tabelas[0]] }, USO));
  assert.equal(mudou(['a.json'], () => inv, () => outro), true);
});

test('extrairChamadas pega tabela, bucket, rpc e edge do codigo do front', () => {
  // Sem indentacao de proposito: constantesDeString so aceita `const` em coluna zero (nivel de modulo).
  const codigo = [
    "const BUCKET = 'comprovantes';",
    "const { data } = await supabase.from('contas_pagar').select('*');",
    'await supabase.storage.from(BUCKET).upload(caminho, arquivo);',
    "await supabase.rpc('totais_movimentacoes', { p_empresa: id });",
    "await supabase.functions.invoke('asaas-proxy', { body: {} });",
    "await invokeEdge<Resposta>('conciliacao-ia', {});",
    'await fetch(`${url}/functions/v1/sefaz-dfe-puxar`);',
    'await fetch(`${url}/rest/v1/boletos?select=id`);',
  ].join('\n');
  const c = extrairChamadas(codigo);
  assert.deepEqual([...new Set(c.tabelas)].sort(), ['boletos', 'contas_pagar']);
  assert.deepEqual(c.buckets, ['comprovantes']);
  assert.deepEqual(c.rpcs, ['totais_movimentacoes']);
  assert.deepEqual([...new Set(c.edges)].sort(), ['asaas-proxy', 'conciliacao-ia', 'sefaz-dfe-puxar']);
});

test('extrairImports ignora import de tipo e pega o dinamico', () => {
  const texto = `
    import type { NavGroup } from './sidebarNav.types';
    import { useAsaas } from '@/hooks/useAsaas';
    const Page = lazy(() => import('./pages/Asaas'));
  `;
  const especificadores = extrairImports(texto).map((i) => i.especificador);
  assert.ok(especificadores.includes('@/hooks/useAsaas'));
  assert.ok(especificadores.includes('./pages/Asaas'));
  assert.equal(especificadores.includes('./sidebarNav.types'), false);
  const nomes = extrairImports(texto).find((i) => i.especificador === '@/hooks/useAsaas').nomes;
  assert.ok(nomes.includes('useAsaas'));
});

test('semAncora normaliza href de menu com ancora e query', () => {
  assert.equal(semAncora('/inteligencia#action-matrix'), '/inteligencia');
  assert.equal(semAncora('/asaas?tab=fila'), '/asaas');
  assert.equal(semAncora('/'), '/');
});
