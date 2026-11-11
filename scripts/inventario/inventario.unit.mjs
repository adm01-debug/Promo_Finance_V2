#!/usr/bin/env node
/**
 * Testes do inventario (node --test scripts/inventario/inventario.unit.mjs).
 * Nao toca no banco real, na rede externa nem no repo real: fixtures em memoria, repos sinteticos em
 * diretorio temporario (com espaco e acento no nome) e um servidor HTTP em 127.0.0.1 no lugar da
 * Management API. Nenhum teste le GITHUB_TOKEN/SUPABASE_*: o ambiente dos processos filhos e limpo.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  extrairInventario, conferirOrigem, montarInventario, compararEdges, rodaTodoDia,
  contarUsoNoCodigo, lerArgumentos, redigir,
  PARECE_CREDENCIAL, PROJETO_OFICIAL, LIMIARES,
} from './gerar-banco.mjs';
import { semCarimbos, mudou } from './mudou-conteudo.mjs';
import {
  extrairChamadas, extrairImports, semAncora, semComentarios, lerRoutesDoJsx, casaRota, gerarRotas,
} from './gerar-rotas.mjs';

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

// ---------------------------------------------------------------------------------------------
// Regressoes da rodada de endurecimento: comentarios, rotas aninhadas, argumentos, CLI, rede local.
// ---------------------------------------------------------------------------------------------

test('semComentarios apaga comentario de linha e de bloco, mantem string com // e o comprimento', () => {
  const codigo = [
    "const url = 'http://x.com/a'; // comentario com .from('fantasma')",
    '/* bloco',
    "   <Route path=\"/velha\" /> */ const b = `//nao-e-comentario`;",
    "{/* <Route path='/jsx' /> */}<Route path=\"/real\" />",
  ].join('\n');
  const limpo = semComentarios(codigo);
  assert.equal(limpo.length, codigo.length);
  assert.equal(limpo.split('\n').length, codigo.split('\n').length);
  assert.ok(limpo.includes("'http://x.com/a'"));
  assert.ok(limpo.includes('`//nao-e-comentario`'));
  assert.ok(!limpo.includes('fantasma') && !limpo.includes('/velha') && !limpo.includes('/jsx'));
  assert.ok(limpo.includes('<Route path="/real" />'));
});

test('semComentarios: apostrofo em texto JSX nao desalinha as linhas seguintes', () => {
  const codigo = "<p>Don't</p>\n// <Route path=\"/velha\" />\n<Route path=\"/real\" />";
  const limpo = semComentarios(codigo);
  assert.ok(!limpo.includes('/velha'));
  assert.ok(limpo.includes('/real'));
});

test('extrairChamadas e extrairImports ignoram codigo comentado', () => {
  const codigo = [
    "// await supabase.from('tabela_velha').select();",
    "/* supabase.functions.invoke('edge-velha') */",
    "// import { useVelho } from './sumiu';",
    "import { useNovo } from './novo';",
    "await supabase.from('tabela_nova').select();",
  ].join('\n');
  const c = extrairChamadas(codigo);
  assert.deepEqual(c.tabelas, ['tabela_nova']);
  assert.deepEqual(c.edges, []);
  assert.deepEqual(extrairImports(codigo).map((i) => i.especificador), ['./novo']);
});

test('extrairImports: import de efeito colateral nao faz o import de tipo seguinte virar import de valor', () => {
  const texto = "import './estilo.css';\nimport type { useFalso } from './tipos';\nimport { useReal } from './real';";
  const imports = extrairImports(texto);
  const tipos = imports.find((i) => i.especificador === './tipos');
  assert.equal(tipos, undefined, 'import type nao entra');
  assert.deepEqual(imports.find((i) => i.especificador === './real').nomes, ['useReal']);
});

test('lerRoutesDoJsx: aspas simples, chaves, comentadas, aninhadas, index, layout e curinga', () => {
  const jsx = semComentarios(`
    <Routes>
      {/* <Route path="/comentada" element={<X />} /> */}
      // <Route path="/linha" element={<Y />} />
      <Route path='/aspas-simples' element={<A />} />
      <Route path={"/chaves"} element={<B />} />
      <Route path="/pai" element={<Pai />}>
        <Route index element={<Idx />} />
        <Route path="filho" element={<F />} />
        <Route path=":id" element={<D />} />
        <Route path="/abs" element={<Abs />} />
        <Route path="*" element={<NF />} />
      </Route>
      <Route element={<Layout />}>
        <Route path="/dentro-layout" element={<L />} />
        <Route index element={<Home />} />
      </Route>
      <Route path="/arrow" element={cond ? <Foo onClick={() => x > 1} path="falso" /> : null} />
      <Route path={\`/tpl/\${id}\`} element={<T />} />
      {import.meta.env.DEV && <Route path="/dev" element={<Dev />} />}
    </Routes>`);
  const rotas = lerRoutesDoJsx(jsx).filter((r) => r.caminho);
  assert.deepEqual(rotas.map((r) => [r.caminho, r.indice]), [
    ['/aspas-simples', false], ['/chaves', false], ['/pai', false], ['/pai', true], ['/pai/filho', false],
    ['/pai/:id', false], ['/abs', false], ['/pai/*', false], ['/dentro-layout', false], ['/', true],
    ['/arrow', false], ['/dev', false],
  ]);
});

test('casaRota casa :param e curinga final, e nunca o 404', () => {
  assert.equal(casaRota('/reforma/:tab', '/reforma/visao-geral'), 1);
  assert.equal(casaRota('/reforma/:tab', '/reforma'), null);
  assert.equal(casaRota('/a/*', '/a/b/c'), 1);
  assert.equal(casaRota('/a/:id/x', '/a/1/x'), 1);
  assert.equal(casaRota('/a/:id/x', '/a/1/y'), null);
  assert.equal(casaRota('*', '/qualquer'), null);
  assert.equal(casaRota('/*', '/qualquer'), null);
});

// ---- repo sintetico em diretorio temporario com espaco e acento ----------------------------------

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = ['gerar-banco.mjs', 'gerar-repo.mjs', 'gerar-rotas.mjs', 'mudou-conteudo.mjs', 'banco.sql'];
const TEM_RG = spawnSync('rg', ['--version'], { stdio: 'ignore' }).status === 0;
const TEM_GIT = spawnSync('git', ['--version'], { stdio: 'ignore' }).status === 0;
// Montado em tempo de execução: o literal inteiro no fonte acenderia o gitleaks (generic-api-key).
const TOKEN_FALSO = ['sbp', '_', '0123456789abcdef0123456789abcdef01234567'].join('');

const escrever = (raiz, relativo, texto) => {
  const destino = path.join(raiz, relativo);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, texto);
};
const lerTexto = (raiz, relativo) => fs.readFileSync(path.join(raiz, relativo), 'utf8');

const typesTs = (nomes) => `export type Database = {\n  public: {\n    Tables: {\n${nomes
  .map((n) => `      ${n}: {\n        Row: { id: string }\n      }\n`).join('')}    }\n    Views: {\n      v: { Row: { id: string } }\n    }\n  }\n}\n`;

const APP_TSX = `import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
const Contas = lazy(() => import('./pages/Contas'));
const Detalhe = React.lazy(async () => import("./pages/Detalhe"));
const Reforma = lazy(
  () => import('./pages/Reforma'),
);
// const Velha = lazy(() => import('./pages/Velha'));

function AppRoutes() {
  return (
    <Suspense>
      <Routes>
        {/* <Route path="/comentada" element={<Velha />} /> */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route
          path='/contas'
          element={
            <ProtectedRoute requiredRoles={["admin", 'financeiro']}>
              <Contas />
            </ProtectedRoute>
          }
        />
        <Route path={'/detalhe/:id'} element={<ProtectedRoute><Detalhe /></ProtectedRoute>} />
        <Route path="/reforma" element={<ProtectedRoute><Reforma /></ProtectedRoute>} />
        <Route path="/reforma/:tab" element={<ProtectedRoute><Reforma /></ProtectedRoute>} />
        <Route path="/antiga" element={<Navigate to="/contas" replace />} />
        <Route path="/pai" element={<ProtectedRoute><Home /></ProtectedRoute>}>
          <Route index element={<Contas />} />
          <Route path="filho" element={<Detalhe />} />
        </Route>
        <Route path="/contas" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
`;
const MENU_GRUPOS = `import type { NavGroup } from './sidebarNav.types';
import { fiscalNavGroup } from './sidebarFiscalNavGroup';
const navGroups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    items: [
      { label: "Dashboard d'Água", href: '/' },
      // { label: 'Fantasma', href: '/fantasma' },
      { label: 'Contas', href: '/contas', highlight: true, badgeKey: 'contas' },
      { label: 'Contas de novo', href: '/contas' },
      { label: 'Sem Rota', href: '/nao-existe' },
    ],
  },
  fiscalNavGroup,
];
`;
const MENU_FISCAL = `export const fiscalNavGroup = {
  id: 'fiscal', label: 'Fiscal',
  items: [
    { label: 'Reforma', href: '/reforma/visao-geral' },
    { label: 'Detalhe', href: '/detalhe/1' },
  ],
};
`;

/** Cria um repo sintetico completo (App, menu, paginas, hooks, edges, types). `cleanup` apaga. */
function criarRaiz({ tabelas = ['empresas', 'tabela_morta'], app = APP_TSX, menu = MENU_GRUPOS, fiscal = MENU_FISCAL } = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'inv ção '));
  fs.mkdirSync(path.join(raiz, 'scripts/inventario'), { recursive: true });
  for (const f of SCRIPTS) fs.copyFileSync(path.join(AQUI, f), path.join(raiz, 'scripts/inventario', f));
  escrever(raiz, 'src/integrations/supabase/types.ts', typesTs(tabelas));
  escrever(raiz, 'src/App.tsx', app);
  escrever(raiz, 'src/components/layout/sidebar/SidebarNavGroups.tsx', menu);
  escrever(raiz, 'src/components/layout/sidebar/sidebarFiscalNavGroup.ts', fiscal);
  escrever(raiz, 'src/integrations/supabase/client.ts', 'export const supabase = {};\n');
  escrever(raiz, 'src/pages/Home.tsx', "import { useHome } from '@/hooks/useHome';\nexport default function Home() { useHome(); return null; }\n");
  escrever(raiz, 'src/pages/NotFound.tsx', 'export default function NotFound() { return null; }\n');
  escrever(raiz, 'src/pages/Contas.tsx', "// import { useFantasma } from './sumiu';\nimport { supabase } from '@/integrations/supabase/client';\nexport default function Contas() { supabase.from('empresas'); supabase.storage.from('anexos'); return null; }\n");
  escrever(raiz, 'src/pages/Detalhe.tsx', "export default function Detalhe() { return fetch(`${u}/functions/v1/gerar-alertas-dispatcher`); }\n");
  escrever(raiz, 'src/pages/Reforma.tsx', "import { useReforma } from '../hooks/useReforma';\nexport default function Reforma() { useReforma(); return null; }\n");
  escrever(raiz, 'src/hooks/useHome.ts', "export function useHome() { return supabase.from('tabela_morta').select(); }\n");
  escrever(raiz, 'src/hooks/useReforma.ts', "export function useReforma() { return supabase.rpc('calc_reforma'); }\n");
  escrever(raiz, 'src/hooks/useReforma.tsx', "export { useReforma } from './useReforma';\n");
  escrever(raiz, 'supabase/functions/gerar-alertas/index.ts', "const k = Deno.env.get('CHAVE_A');\nconsole.log(k);\n");
  escrever(raiz, 'supabase/functions/gerar-alertas-dispatcher/index.ts', "const k = Deno.env.get('CHAVE_B');\nconsole.log(k);\n");
  escrever(raiz, 'supabase/functions/_shared/util.ts', 'export const x = 1;\n');
  escrever(raiz, 'supabase/migrations/20260101000000_x.sql', "select net.http_post('https://x.supabase.co/functions/v1/gerar-alertas-dispatcher');\n");
  escrever(raiz, 'e2e/a.spec.ts', "await page.request.post('/functions/v1/gerar-alertas-dispatcher');\n");
  escrever(raiz, '.github/workflows/ci.yml', 'name: ci\n');
  escrever(raiz, 'supabase/config.toml', '[functions.gerar-alertas-dispatcher]\nverify_jwt = true\n');
  return { raiz, cleanup: () => fs.rmSync(raiz, { recursive: true, force: true }) };
}

const ambienteLimpo = (extra = {}) => {
  const env = { ...process.env };
  for (const chave of Object.keys(env)) {
    if (/^(GITHUB_TOKEN|GH_TOKEN|SUPABASE_|INVENTARIO_)/.test(chave)) delete env[chave];
  }
  return { ...env, ...extra };
};

/** Roda um script do inventario em processo filho (assincrono: o servidor HTTP vive neste processo). */
function rodar(cwd, script, args = [], { env = {}, stdin = '' } = {}) {
  return new Promise((resolver, rejeitar) => {
    const filho = spawn(process.execPath, [path.join(cwd, 'scripts/inventario', script), ...args], {
      cwd, env: ambienteLimpo(env), stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    filho.stdout.on('data', (d) => { stdout += d; });
    filho.stderr.on('data', (d) => { stderr += d; });
    filho.on('error', rejeitar);
    filho.on('close', (code) => resolver({ code, stdout, stderr }));
    filho.stdin.end(stdin);
  });
}

test('gerar-rotas no repo sintetico: rotas, aninhada, :param no menu, duplicatas e import quebrado', () => {
  const { raiz, cleanup } = criarRaiz();
  try {
    const inv = gerarRotas(raiz);
    const por = {};
    for (const u of inv.urls) por[u.caminho] ??= u; // duplicata: vale a primeira, como no react-router
    assert.deepEqual(inv.urls.map((u) => u.caminho), [
      '*', '/', '/antiga', '/contas', '/contas', '/detalhe/:id', '/pai', '/pai', '/pai/filho', '/reforma', '/reforma/:tab',
    ]);
    assert.equal(por['/contas'].arquivo, 'src/pages/Contas.tsx');
    assert.deepEqual(por['/contas'].papeis, ['admin', 'financeiro']);
    assert.equal(por['/detalhe/:id'].arquivo, 'src/pages/Detalhe.tsx', 'React.lazy(async () => import("..."))');
    assert.equal(por['/reforma'].arquivo, 'src/pages/Reforma.tsx', 'lazy quebrado em varias linhas');
    assert.equal(por['/'].arquivo, 'src/pages/Home.tsx', 'import estatico de pagina');
    assert.equal(por['*'].arquivo, 'src/pages/NotFound.tsx');
    assert.equal(por['/antiga'].redireciona, '/contas');
    assert.equal(inv.urls.some((u) => u.caminho === '/comentada' || u.caminho === '/fantasma'), false);
    // .from() de tabela vs storage.from() de bucket; edge chamada por URL; rpc via hook
    assert.deepEqual(por['/contas'].tabelas, ['empresas']);
    assert.deepEqual(por['/contas'].buckets, ['anexos']);
    assert.deepEqual(por['/detalhe/:id'].edges, ['gerar-alertas-dispatcher']);
    assert.deepEqual(por['/reforma'].rpcs, ['calc_reforma']);
    assert.deepEqual(por['/'].tabelas, ['tabela_morta']);
    // useReforma.ts e useReforma.tsx coexistem: vale o .ts (ordem do TS/Vite)
    assert.equal(por['/reforma'].hooks.find((h) => h.nome === 'useReforma').arquivo, 'src/hooks/useReforma.ts');
    // item de menu com href concreto vai para a rota :param
    assert.deepEqual(por['/reforma/:tab'].menu.map((m) => m.href), ['/reforma/visao-geral']);
    assert.deepEqual(por['/detalhe/:id'].menu.map((m) => m.href), ['/detalhe/1']);
    assert.equal(por['/'].menu[0].rotulo, "Dashboard d'Água", 'label com aspas duplas por causa do apostrofo');
    assert.equal(por['/contas'].menu[0].destaque, true);
    const tipos = inv.problemas.map((p) => `${p.tipo}:${p.id}`);
    assert.ok(tipos.includes('menu_sem_rota:/nao-existe'));
    assert.ok(!tipos.includes('menu_sem_rota:/reforma/visao-geral'));
    assert.ok(tipos.includes('menu_duplicado:/contas'));
    assert.ok(tipos.includes('rota_duplicada:/contas'));
    assert.ok(!tipos.includes('rota_duplicada:/pai'), 'rota index no mesmo caminho do pai nao e duplicata');
    assert.deepEqual(inv.urls.filter((u) => u.caminho === '/contas').map((u) => u.menu.length), [1, 0], 'menu so na primeira declaracao');
    assert.equal(tipos.some((t) => t.includes('Fantasma') || t.includes('sumiu')), false, 'import comentado nao e import quebrado');
    assert.equal(inv.problemas.some((p) => p.tipo === 'import_quebrado'), false);
  } finally { cleanup(); }
});

test('gerar-rotas recusa App sem <Routes>, sem <Route path> e menu vazio (inventario vazio nao e sucesso)', () => {
  for (const [rotulo, opcoes, esperado] of [
    ['sem Routes', { app: 'export default function App() { return null; }\n' }, /sem bloco <Routes>/],
    ['Routes comentado', { app: '// <Routes><Route path="/x" element={<A />} /></Routes>\nexport default 1;\n' }, /sem bloco <Routes>/],
    ['Routes sem Route', { app: 'const a = <Routes></Routes>;\n' }, /nenhuma <Route path>/],
    ['menu vazio', { menu: 'export const x = [];\n', fiscal: 'export const y = [];\n' }, /menu lateral sem nenhum href/],
  ]) {
    const { raiz, cleanup } = criarRaiz(opcoes);
    try {
      assert.throws(() => gerarRotas(raiz), esperado, rotulo);
    } finally { cleanup(); }
  }
});

test('gerar-rotas aceita <Routes> com props', () => {
  const { raiz, cleanup } = criarRaiz({ app: 'const Home = lazy(() => import("./pages/Home"));\nconst a = <Routes location={loc}><Route path="/" element={<Home />} /></Routes>;\n' });
  try {
    assert.deepEqual(gerarRotas(raiz).urls.map((u) => u.caminho), ['/']);
  } finally { cleanup(); }
});

test('gerar-rotas CLI: dois runs byte a byte iguais, sem .tmp, --check e flag invalida', async () => {
  const { raiz, cleanup } = criarRaiz();
  try {
    const um = await rodar(raiz, 'gerar-rotas.mjs');
    assert.equal(um.code, 0, um.stderr);
    const primeiro = lerTexto(raiz, 'inventario/estado/rotas.json');
    assert.equal((await rodar(raiz, 'gerar-rotas.mjs')).code, 0);
    assert.equal(lerTexto(raiz, 'inventario/estado/rotas.json'), primeiro);
    assert.deepEqual(fs.readdirSync(path.join(raiz, 'inventario/estado')), ['rotas.json']);
    assert.equal((await rodar(raiz, 'gerar-rotas.mjs', ['--check'])).code, 0);
    escrever(raiz, 'inventario/estado/rotas.json', '{}\n');
    const velho = await rodar(raiz, 'gerar-rotas.mjs', ['--check']);
    assert.equal(velho.code, 1);
    assert.match(velho.stderr, /desatualizado/);
    for (const flag of ['--chek', '--check=1', 'rotas.json']) {
      const r = await rodar(raiz, 'gerar-rotas.mjs', [flag]);
      assert.equal(r.code, 2, `${flag}: ${r.stdout}`);
      assert.match(r.stderr, /argumento desconhecido/);
    }
    // flag errada nao pode ter regravado o arquivo
    assert.equal(lerTexto(raiz, 'inventario/estado/rotas.json'), '{}\n');
    assert.equal((await rodar(raiz, 'gerar-rotas.mjs', ['--help'])).code, 0);
  } finally { cleanup(); }
});

test('gerar-rotas CLI: App sem rotas sai 2 e nao apaga o rotas.json anterior', async () => {
  const { raiz, cleanup } = criarRaiz({ app: 'export default 1;\n' });
  try {
    escrever(raiz, 'inventario/estado/rotas.json', '{"bom":true}\n');
    const r = await rodar(raiz, 'gerar-rotas.mjs');
    assert.equal(r.code, 2);
    assert.match(r.stderr, /ERRO: .*sem bloco <Routes>/);
    assert.equal(lerTexto(raiz, 'inventario/estado/rotas.json'), '{"bom":true}\n');
  } finally { cleanup(); }
});

test('CLIs rodam por symlink (guarda import.meta.url nao pode virar no-op com exit 0)', async () => {
  const { raiz, cleanup } = criarRaiz();
  const link = `${raiz}-link`;
  try {
    fs.symlinkSync(raiz, link);
    const r = await rodar(link, 'gerar-rotas.mjs');
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /rotas\.json: \d+ URLs/);
    assert.ok(fs.existsSync(path.join(raiz, 'inventario/estado/rotas.json')));
    const b = await rodar(link, 'gerar-banco.mjs');
    assert.equal(b.code, 2, 'sem token e sem --entrada tem de falhar, nao sair 0 calado');
    assert.match(b.stderr, /sem --entrada e sem SUPABASE_ACCESS_TOKEN/);
    const m = await rodar(link, 'mudou-conteudo.mjs', ['inventario/estado/rotas.json']);
    assert.match(m.stdout, /^(true|false)\n$/, `mudou-conteudo calou: code=${m.code} err=${m.stderr}`);
  } finally { fs.rmSync(link, { force: true }); cleanup(); }
});

test('gerar-repo: caminho com espaco/acento, linhas sem o +1 do \\n final, nome de edge delimitado', { skip: !TEM_RG && 'ripgrep (rg) ausente' }, async () => {
  const { raiz, cleanup } = criarRaiz();
  try {
    const r = await rodar(raiz, 'gerar-repo.mjs');
    assert.equal(r.code, 0, r.stderr);
    assert.match(r.stdout, /edges: 2 /);
    const e = JSON.parse(lerTexto(raiz, 'inventario/estado/edges.json'));
    assert.equal(e.total, 2);
    assert.equal(e.edge_functions['gerar-alertas'].linhas, 2, 'duas linhas, nao tres');
    assert.deepEqual(e.edge_functions['gerar-alertas'].segredos_lidos, ['CHAVE_A']);
    // chamadas do `-dispatcher` (migration, e2e, config.toml, src) nao valem para `gerar-alertas`
    assert.deepEqual(e.edge_functions['gerar-alertas'].chamada_em, { src: 0, migrations: 0, outras_edges: 0, e2e: 0, ci_config: 0 });
    assert.equal(e.edge_functions['gerar-alertas'].sem_chamador, true);
    assert.deepEqual(e.edge_functions['gerar-alertas-dispatcher'].chamada_em, { src: 1, migrations: 1, outras_edges: 0, e2e: 1, ci_config: 1 });
    assert.deepEqual(e.sem_chamador_no_repo, ['gerar-alertas']);
    // idempotente fora do carimbo de data declarado
    const antes = JSON.stringify({ ...e, gerado_em: null });
    await rodar(raiz, 'gerar-repo.mjs');
    assert.equal(JSON.stringify({ ...JSON.parse(lerTexto(raiz, 'inventario/estado/edges.json')), gerado_em: null }), antes);
  } finally { cleanup(); }
});

test('gerar-repo: nomes de tabela no stdin geram tabelas-uso.json; argumento solto e erro; sem edges e erro', { skip: !TEM_RG && 'ripgrep (rg) ausente' }, async () => {
  const { raiz, cleanup } = criarRaiz();
  try {
    const r = await rodar(raiz, 'gerar-repo.mjs', [], { stdin: 'empresas\ntabela_morta\nnao_usada\n' });
    assert.equal(r.code, 0, r.stderr);
    const uso = JSON.parse(lerTexto(raiz, 'inventario/estado/tabelas-uso.json'));
    assert.equal(uso.tabelas.empresas.from_src, 1);
    assert.deepEqual(uso.sem_from_em_src_nem_edges, ['nao_usada']);
    assert.equal(uso.tabelas.empresas.em_types_ts, true);
    const solto = await rodar(raiz, 'gerar-repo.mjs', ['--out']);
    assert.equal(solto.code, 2);
    assert.match(solto.stderr, /argumento desconhecido/);
  } finally { cleanup(); }
  const vazio = criarRaiz();
  try {
    fs.rmSync(path.join(vazio.raiz, 'supabase/functions/gerar-alertas'), { recursive: true });
    fs.rmSync(path.join(vazio.raiz, 'supabase/functions/gerar-alertas-dispatcher'), { recursive: true });
    const r = await rodar(vazio.raiz, 'gerar-repo.mjs');
    assert.equal(r.code, 2);
    assert.match(r.stderr, /nenhuma edge function/);
    assert.ok(!fs.existsSync(path.join(vazio.raiz, 'inventario/estado/edges.json')));
  } finally { vazio.cleanup(); }
});

test('gerar-repo: importar o modulo nao escreve nada nem le stdin (sem efeito colateral no import)', async () => {
  const { raiz, cleanup } = criarRaiz();
  try {
    const filho = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(path.join(raiz, 'scripts/inventario/gerar-repo.mjs'))}); console.log('importou');`], {
      cwd: raiz, env: ambienteLimpo(), encoding: 'utf8', input: '', timeout: 15000,
    });
    assert.equal(filho.status, 0, filho.stderr);
    assert.match(filho.stdout, /importou/);
    assert.ok(!fs.existsSync(path.join(raiz, 'inventario')), 'import nao pode criar inventario/');
  } finally { cleanup(); }
});

// ---- gerar-banco: argumentos, estrutura da entrada, uso no codigo, edges ------------------------

test('lerArgumentos: flag desconhecida, sem valor ou orfa e erro (nunca ignorada)', () => {
  assert.deepEqual(lerArgumentos([]), {});
  assert.deepEqual(lerArgumentos(['--entrada', 'a.json', '--functions', 'f.json']), { entrada: 'a.json', functions: 'f.json' });
  assert.equal(lerArgumentos(['--help']).ajuda, true);
  for (const ruim of [['--entrda', 'a.json'], ['--entrada'], ['--entrada', ''], ['--entrada', '--functions', 'x'], ['--functions', 'f.json'], ['--entrada=a.json'], ['solto']]) {
    assert.throws(() => lerArgumentos(ruim), /exige o caminho|desconhecido|so vale junto/, JSON.stringify(ruim));
  }
});

test('extrairInventario recusa estrutura que quebraria depois (cron incompleto, tabela sem nome, extensoes)', () => {
  const semJobs = clonar(BASE); delete semJobs.cron.jobs;
  assert.throws(() => extrairInventario(semJobs), /`cron` incompleto/);
  const semHistorico = clonar(BASE); semHistorico.cron.historico = null;
  assert.throws(() => extrairInventario(semHistorico), /`cron` incompleto/);
  const semNome = clonar(BASE); semNome.tabelas.push({ rls: true });
  assert.throws(() => extrairInventario(semNome), /tabela sem `nome`/);
  const extensoesRuins = { ...clonar(BASE), extensoes: null };
  assert.throws(() => extrairInventario(extensoesRuins), /`extensoes`/);
});

test('contarUsoNoCodigo: ignora comentario, teste (inclusive _test.ts), bucket; pasta-pai com .test. nao zera tudo', () => {
  const pai = fs.mkdtempSync(path.join(os.tmpdir(), 'uso '));
  const raiz = path.join(pai, 'projeto.test.d');
  try {
    escrever(raiz, 'src/a.tsx', [
      "// supabase.from('comentada')",
      "supabase.from('Minha Tabela').select();",
      "supabase.storage.from('empresas');",
      "supabase.from('empresas').select(); /* .from('comentada') */",
      "fetch(`${u}/rest/v1/boletos?select=id`); Array.from('empresas_x'); supabase.from('constructor');",
    ].join('\n'));
    escrever(raiz, 'src/b.test.tsx', "supabase.from('so_em_teste');\n");
    escrever(raiz, 'supabase/functions/f/index.ts', "supabase.from('empresas');\n");
    escrever(raiz, 'supabase/functions/f/layout_test.ts', "supabase.from('so_em_teste');\n");
    escrever(raiz, 'supabase/functions/__tests__/x.ts', "supabase.from('so_em_teste');\n");
    const uso = contarUsoNoCodigo(raiz, ['Minha Tabela', 'empresas', 'comentada', 'so_em_teste', 'boletos', 'nunca']);
    assert.deepEqual(uso['Minha Tabela'], { src: 1, edges: 0 });
    assert.deepEqual(uso.empresas, { src: 1, edges: 1 }, 'storage.from(empresas) e bucket, nao tabela');
    assert.deepEqual(uso.comentada, { src: 0, edges: 0 });
    assert.deepEqual(uso.so_em_teste, { src: 0, edges: 0 });
    assert.deepEqual(uso.boletos, { src: 1, edges: 0 });
    assert.deepEqual(uso.nunca, { src: 0, edges: 0 });
    assert.equal(Object.hasOwn(uso, 'constructor'), false, 'nome de prototype nao vira tabela');
  } finally { fs.rmSync(pai, { recursive: true, force: true }); }
});

test('compararEdges: ordem por code point, data invalida ou numerica sem derrubar o inventario', () => {
  const edges = compararEdges([
    { slug: 'b_x', version: 1, status: 'ACTIVE', verify_jwt: true, updated_at: 'lixo' },
    { slug: 'a', version: 1, status: 'ACTIVE', verify_jwt: true, updated_at: 1762000000000 },
    { slug: 'B', version: 1, status: 'ACTIVE', verify_jwt: true, updated_at: undefined },
    { slug: 'b-y', version: 1, status: 'ACTIVE', verify_jwt: false, updated_at: '2026-11-01T10:00:59.999Z' },
  ], ['a']);
  assert.deepEqual(edges.publicadas.map((f) => f.slug), ['B', 'a', 'b-y', 'b_x']);
  assert.deepEqual(edges.publicadas.map((f) => f.atualizada_em), [null, '2025-11-01T12:26Z', '2026-11-01T10:00Z', null]);
  assert.deepEqual(edges.publicadas_sem_codigo_no_repo, ['B', 'b-y', 'b_x']);
});

test('redigir tira o token e qualquer coisa com cara de credencial da mensagem de erro', () => {
  const antes = process.env.SUPABASE_ACCESS_TOKEN;
  process.env.SUPABASE_ACCESS_TOKEN = ` ${TOKEN_FALSO}\n`;
  try {
    const msg = redigir(`falhou com ${TOKEN_FALSO} e Authorization: Bearer abcdefghijklmnopqrstuvwxyz e sb_secret_zzz`);
    assert.ok(!msg.includes(TOKEN_FALSO) && !msg.includes('abcdefghijklmnopqrstuvwxyz') && !msg.includes('sb_secret_'));
    assert.ok(msg.includes('falhou com ***'));
  } finally {
    if (antes === undefined) delete process.env.SUPABASE_ACCESS_TOKEN; else process.env.SUPABASE_ACCESS_TOKEN = antes;
  }
});

// ---- gerar-banco contra a Management API simulada em 127.0.0.1 ------------------------------

async function servidor(responder) {
  const pedidos = [];
  const srv = http.createServer((req, res) => {
    let corpo = '';
    req.on('data', (d) => { corpo += d; });
    req.on('end', () => {
      pedidos.push({ metodo: req.method, url: req.url, autorizacao: req.headers.authorization, corpo });
      responder(req, res, pedidos);
    });
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  return {
    url: `http://127.0.0.1:${srv.address().port}`,
    pedidos,
    fechar: () => new Promise((ok) => { srv.closeAllConnections?.(); srv.close(ok); }),
  };
}
const json = (res, status, corpo) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(typeof corpo === 'string' ? corpo : JSON.stringify(corpo)); };
const FUNCOES = [
  { slug: 'gerar-alertas', version: 3, status: 'ACTIVE', verify_jwt: true, updated_at: 1762000000000 },
  { slug: 'fantasma', version: 1, status: 'ACTIVE', verify_jwt: true, updated_at: 1762000000000 },
];
const ambienteApi = (srv, extra = {}) => ({ SUPABASE_API_URL: srv.url, SUPABASE_ACCESS_TOKEN: TOKEN_FALSO, ...extra });
const BANCO_ANTERIOR = '{"banco":"anterior"}\n';
const prepararRaizBanco = () => {
  const r = criarRaiz();
  escrever(r.raiz, 'inventario/estado/banco.json', BANCO_ANTERIOR);
  return r;
};
const semVazamento = (r) => assert.ok(!(r.stdout + r.stderr).includes(TOKEN_FALSO), 'token vazou para stdout/stderr');

test('gerar-banco via API: grava, so le (POST read-only + GET functions), token so no cabecalho, 2 runs iguais', async () => {
  const { raiz, cleanup } = prepararRaizBanco();
  const srv = await servidor((req, res) => (req.method === 'POST' ? json(res, 201, [{ inventario: clonar(BASE) }]) : json(res, 200, FUNCOES)));
  try {
    const r = await rodar(raiz, 'gerar-banco.mjs', [], { env: ambienteApi(srv) });
    assert.equal(r.code, 0, r.stderr);
    semVazamento(r);
    assert.deepEqual(srv.pedidos.map((p) => `${p.metodo} ${p.url}`), [
      `POST /v1/projects/${PROJETO_OFICIAL}/database/query/read-only`,
      `GET /v1/projects/${PROJETO_OFICIAL}/functions`,
    ]);
    assert.ok(srv.pedidos.every((p) => p.autorizacao === `Bearer ${TOKEN_FALSO}`));
    assert.equal(JSON.parse(srv.pedidos[0].corpo).query, fs.readFileSync(path.join(AQUI, 'banco.sql'), 'utf8'));
    const gravado = lerTexto(raiz, 'inventario/estado/banco.json');
    assert.ok(!gravado.includes(TOKEN_FALSO));
    const inv = JSON.parse(gravado);
    assert.equal(inv.tabelas.length, 2);
    assert.deepEqual(inv.edge_functions.publicadas_sem_codigo_no_repo, ['fantasma']);
    assert.deepEqual(inv.edge_functions.no_repo_sem_deploy, ['gerar-alertas-dispatcher']);
    assert.deepEqual(fs.readdirSync(path.join(raiz, 'inventario/estado')), ['banco.json'], 'sem .tmp sobrando');
    await rodar(raiz, 'gerar-banco.mjs', [], { env: ambienteApi(srv) });
    assert.equal(lerTexto(raiz, 'inventario/estado/banco.json'), gravado, 'mesma entrada, mesma saida byte a byte');
  } finally { await srv.fechar(); cleanup(); }
});

test('gerar-banco: banco indisponivel ou resposta vazia/invalida sai 2 e preserva o banco.json anterior', async () => {
  const cenarios = [
    ['lista vazia', (res) => json(res, 200, []), /entrada sem as chaves/],
    ['mensagem de erro com HTTP 200', (res) => json(res, 200, { message: 'relation "cron.job" does not exist' }), /entrada sem as chaves/],
    ['sem tabelas', (res) => json(res, 200, [{ inventario: { ...clonar(BASE), tabelas: [] } }]), /entrada sem tabelas/],
    ['banco irmao', (res) => json(res, 200, [{ inventario: { ...clonar(BASE), tabelas: [{ ...clonar(BASE).tabelas[0], nome: 'outra_a' }] } }]), /nao parece ser do banco oficial/],
    ['cron incompleto', (res) => json(res, 200, [{ inventario: { ...clonar(BASE), cron: {} } }]), /`cron` incompleto/],
    ['HTTP 401 (definitivo, sem retry)', (res) => json(res, 401, { message: `token ${TOKEN_FALSO} invalido` }), /HTTP 401/],
  ];
  for (const [rotulo, resposta, esperado] of cenarios) {
    const { raiz, cleanup } = prepararRaizBanco();
    const srv = await servidor((req, res) => (req.method === 'GET' ? json(res, 200, FUNCOES) : resposta(res)));
    try {
      const r = await rodar(raiz, 'gerar-banco.mjs', [], { env: ambienteApi(srv) });
      assert.equal(r.code, 2, `${rotulo}: ${r.stdout}`);
      assert.match(r.stderr, esperado, rotulo);
      semVazamento(r);
      assert.equal(lerTexto(raiz, 'inventario/estado/banco.json'), BANCO_ANTERIOR, `${rotulo}: banco.json anterior intacto`);
      if (rotulo.startsWith('HTTP 401')) assert.equal(srv.pedidos.length, 1, '4xx definitivo nao tem retry');
    } finally { await srv.fechar(); cleanup(); }
  }
});

test('gerar-banco: 5xx transitorio tenta de novo e passa; 5xx permanente falha com 3 tentativas', async () => {
  const ok = prepararRaizBanco();
  let chamadas = 0;
  const srvOk = await servidor((req, res) => {
    if (req.method === 'GET') return json(res, 200, FUNCOES);
    chamadas++;
    return chamadas < 2 ? json(res, 503, 'indisponivel') : json(res, 201, [{ inventario: clonar(BASE) }]);
  });
  try {
    const r = await rodar(ok.raiz, 'gerar-banco.mjs', [], { env: ambienteApi(srvOk) });
    assert.equal(r.code, 0, r.stderr);
    assert.equal(chamadas, 2);
  } finally { await srvOk.fechar(); ok.cleanup(); }
  const ruim = prepararRaizBanco();
  const srvRuim = await servidor((req, res) => json(res, 503, 'indisponivel'));
  try {
    const r = await rodar(ruim.raiz, 'gerar-banco.mjs', [], { env: ambienteApi(srvRuim) });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /HTTP 503/);
    assert.equal(srvRuim.pedidos.length, 3);
    assert.equal(lerTexto(ruim.raiz, 'inventario/estado/banco.json'), BANCO_ANTERIOR);
  } finally { await srvRuim.fechar(); ruim.cleanup(); }
});

test('gerar-banco: servidor fora do ar sai 2 sem vazar o token e sem apagar o anterior', async () => {
  const { raiz, cleanup } = prepararRaizBanco();
  const srv = await servidor(() => {});
  const url = srv.url;
  await srv.fechar();
  try {
    const r = await rodar(raiz, 'gerar-banco.mjs', [], { env: { SUPABASE_API_URL: url, SUPABASE_ACCESS_TOKEN: TOKEN_FALSO } });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /Management API .* sem resposta valida/);
    semVazamento(r);
    assert.equal(lerTexto(raiz, 'inventario/estado/banco.json'), BANCO_ANTERIOR);
  } finally { cleanup(); }
});

test('gerar-banco: token com caractere invalido no meio nao ecoa o token na mensagem de erro', async () => {
  const { raiz, cleanup } = prepararRaizBanco();
  const srv = await servidor((req, res) => json(res, 200, []));
  try {
    const r = await rodar(raiz, 'gerar-banco.mjs', [], { env: ambienteApi(srv, { SUPABASE_ACCESS_TOKEN: `${TOKEN_FALSO}\nSEGUNDA-LINHA` }) });
    assert.equal(r.code, 2);
    semVazamento(r);
    assert.ok(!(r.stdout + r.stderr).includes('SEGUNDA-LINHA'));
  } finally { await srv.fechar(); cleanup(); }
});

test('gerar-banco: argumento invalido sai 2 antes de qualquer rede (typo nao cai na API viva)', async () => {
  const { raiz, cleanup } = prepararRaizBanco();
  const srv = await servidor((req, res) => json(res, 200, []));
  try {
    for (const args of [['--entrda', 'x.json'], ['--entrada'], ['--functions', 'f.json'], ['--entrada=x.json'], ['x.json']]) {
      const r = await rodar(raiz, 'gerar-banco.mjs', args, { env: ambienteApi(srv) });
      assert.equal(r.code, 2, JSON.stringify(args));
      assert.match(r.stderr, /ERRO: /);
    }
    assert.equal(srv.pedidos.length, 0, 'nenhuma chamada de rede');
    const ajuda = await rodar(raiz, 'gerar-banco.mjs', ['--help'], { env: ambienteApi(srv) });
    assert.equal(ajuda.code, 0);
    assert.match(ajuda.stdout, /uso: node scripts\/inventario\/gerar-banco\.mjs/);
    const outroProjeto = await rodar(raiz, 'gerar-banco.mjs', [], { env: ambienteApi(srv, { SUPABASE_PROJECT_REF: 'pgxfvjmuubtbowutlide' }) });
    assert.equal(outroProjeto.code, 2);
    assert.match(outroProjeto.stderr, /nao e o banco oficial/);
    assert.equal(srv.pedidos.length, 0);
    assert.equal(lerTexto(raiz, 'inventario/estado/banco.json'), BANCO_ANTERIOR);
  } finally { await srv.fechar(); cleanup(); }
});

test('gerar-banco --entrada: arquivo (caminho com espaco, envelope MCP) sem token nao faz rede; com token busca as functions', async () => {
  const { raiz, cleanup } = prepararRaizBanco();
  const srv = await servidor((req, res) => json(res, 200, FUNCOES));
  try {
    const envelope = { result: { content: [{ type: 'text', text: JSON.stringify({ rows: [{ inventario: clonar(BASE) }] }) }] } };
    escrever(raiz, 'entradas/resposta mcp ção.json', JSON.stringify(envelope));
    escrever(raiz, 'entradas/functions.json', JSON.stringify(FUNCOES));
    const arquivo = path.join(raiz, 'entradas/resposta mcp ção.json');
    const sem = await rodar(raiz, 'gerar-banco.mjs', ['--entrada', arquivo], { env: { SUPABASE_API_URL: srv.url } });
    assert.equal(sem.code, 0, sem.stderr);
    assert.match(sem.stdout, /publicadas nao consultadas/);
    assert.equal(srv.pedidos.length, 0);
    const comArquivo = await rodar(raiz, 'gerar-banco.mjs', ['--entrada', arquivo, '--functions', path.join(raiz, 'entradas/functions.json')], { env: { SUPABASE_API_URL: srv.url } });
    assert.equal(comArquivo.code, 0, comArquivo.stderr);
    assert.match(comArquivo.stdout, /2 publicadas\/2 no repo/);
    const comToken = await rodar(raiz, 'gerar-banco.mjs', ['--entrada', arquivo], { env: ambienteApi(srv) });
    assert.equal(comToken.code, 0, comToken.stderr);
    assert.deepEqual(srv.pedidos.map((p) => `${p.metodo} ${p.url}`), [`GET /v1/projects/${PROJETO_OFICIAL}/functions`]);
    const faltando = await rodar(raiz, 'gerar-banco.mjs', ['--entrada', path.join(raiz, 'nao-existe.json')]);
    assert.equal(faltando.code, 2);
    assert.match(faltando.stderr, /ENOENT/);
    escrever(raiz, 'entradas/functions-ruim.json', '{"message":"erro"}');
    const ruim = await rodar(raiz, 'gerar-banco.mjs', ['--entrada', arquivo, '--functions', path.join(raiz, 'entradas/functions-ruim.json')]);
    assert.equal(ruim.code, 2);
    assert.match(ruim.stderr, /nao e uma lista/);
  } finally { await srv.fechar(); cleanup(); }
});

test('gerar-banco: saida com cara de credencial e recusada (exit 2) e nao toca no arquivo anterior', async () => {
  const { raiz, cleanup } = prepararRaizBanco();
  try {
    const dado = clonar(BASE);
    dado.cron.jobs[0].nome = 'Bearer abcdefghijklmnopqrstuvwxyz0123';
    escrever(raiz, 'entradas/r.json', JSON.stringify({ rows: [{ inventario: dado }] }));
    const r = await rodar(raiz, 'gerar-banco.mjs', ['--entrada', path.join(raiz, 'entradas/r.json')]);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /cara de credencial/);
    assert.ok(!(r.stdout + r.stderr).includes('abcdefghijklmnopqrstuvwxyz0123'));
    assert.equal(lerTexto(raiz, 'inventario/estado/banco.json'), BANCO_ANTERIOR);
  } finally { cleanup(); }
});

// ---- mudou-conteudo.mjs de ponta a ponta com um repo git temporario --------------------------------

function git(cwd, ...args) {
  const r = spawnSync('git', ['-c', 'user.name=teste', '-c', 'user.email=teste@example.com', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8', env: ambienteLimpo({ GIT_CONFIG_NOSYSTEM: '1', HOME: cwd }) });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}
function repoComInventario() {
  const { raiz, cleanup } = criarRaiz();
  const banco = montarInventario(clonar(BASE), USO);
  escrever(raiz, 'inventario/estado/banco.json', JSON.stringify(banco, null, 2) + '\n');
  escrever(raiz, 'inventario/estado/rotas.json', JSON.stringify({ format_version: 1, urls: [{ caminho: '/' }] }, null, 2) + '\n');
  escrever(raiz, 'inventario/estado/edges.json', JSON.stringify({ gerado_em: '2026-11-01T00:00:00Z', total: 0, edge_functions: {} }) + '\n');
  git(raiz, 'init', '-q', '-b', 'main');
  git(raiz, 'add', 'inventario');
  git(raiz, 'commit', '-q', '-m', 'base');
  return { raiz, cleanup, banco };
}

test('mudou-conteudo CLI: carimbo e telemetria nao contam, estrutura conta, stdout e so true/false', { skip: !TEM_GIT && 'git ausente' }, async () => {
  const { raiz, cleanup, banco } = repoComInventario();
  try {
    const exec = (args = [], env = {}) => rodar(raiz, 'mudou-conteudo.mjs', args, { env: { HOME: raiz, ...env } });
    const igual = await exec();
    assert.deepEqual([igual.code, igual.stdout, igual.stderr], [0, 'false\n', '']);

    const rolante = clonar(banco);
    rolante.medido_em = '2026-12-01T00:00:00Z';
    rolante.cron.jobs[1].taxa_falha_7d_pct = 12.3;
    rolante.cron.jobs[1].execucoes_24h = 1;
    rolante.cron.historico.linhas = 99;
    rolante.alertas = rolante.alertas.map((a) => (a.tipo === 'cron_falhando' ? { ...a, detalhe: a.detalhe.map((d) => d.replace('9.9%', '12.3%')) } : a));
    escrever(raiz, 'inventario/estado/banco.json', JSON.stringify(rolante));
    assert.equal((await exec()).stdout, 'false\n', 'so carimbo/telemetria/ordem de chaves');

    const estrutural = clonar(rolante);
    estrutural.tabelas[0].rls = false;
    escrever(raiz, 'inventario/estado/banco.json', JSON.stringify(estrutural));
    assert.equal((await exec()).stdout, 'true\n');

    const outroJob = clonar(rolante);
    outroJob.alertas = outroJob.alertas.map((a) => (a.tipo === 'cron_falhando' ? { ...a, detalhe: [...a.detalhe, 'novo (7.0% em 7d)'] } : a));
    escrever(raiz, 'inventario/estado/banco.json', JSON.stringify(outroJob));
    assert.equal((await exec()).stdout, 'true\n', 'job novo na lista de falhando e mudanca real');

    escrever(raiz, 'inventario/estado/banco.json', JSON.stringify(banco, null, 2) + '\n');
    escrever(raiz, 'inventario/estado/rotas.json', '{"format_version":1,"urls":[{"caminho":"/x"}]}\n');
    assert.equal((await exec()).stdout, 'true\n');
    assert.equal((await exec(['inventario/estado/banco.json'])).stdout, 'false\n', 'so o arquivo pedido');
    assert.equal((await exec([], { INVENTARIO_REF: 'refs/nao/existe' })).stdout, 'true\n', 'ref inexistente: na duvida, publica');
  } finally { cleanup(); }
});

test('mudou-conteudo CLI: arquivo gerado ausente e ref invalida sao erro (exit 2), nunca false', { skip: !TEM_GIT && 'git ausente' }, async () => {
  const { raiz, cleanup } = repoComInventario();
  try {
    fs.rmSync(path.join(raiz, 'inventario/estado/edges.json'));
    const ausente = await rodar(raiz, 'mudou-conteudo.mjs', [], { env: { HOME: raiz } });
    assert.equal(ausente.code, 2);
    assert.equal(ausente.stdout, '');
    assert.match(ausente.stderr, /ausente\(s\): inventario\/estado\/edges\.json/);
    const typo = await rodar(raiz, 'mudou-conteudo.mjs', ['inventario/estado/typo.json'], { env: { HOME: raiz } });
    assert.equal(typo.code, 2, 'ausente nos dois lados nao pode virar "nao mudou"');
    const ref = await rodar(raiz, 'mudou-conteudo.mjs', ['inventario/estado/banco.json'], { env: { HOME: raiz, INVENTARIO_REF: '--output=/tmp/x' } });
    assert.equal(ref.code, 2);
    assert.match(ref.stderr, /INVENTARIO_REF invalida/);
  } finally { cleanup(); }
});
