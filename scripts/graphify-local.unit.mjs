import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  readdir,
  symlink,
  open,
  lstat,
  rename,
  truncate,
  stat,
  copyFile,
} from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  main,
  acquire,
  acquireGlobal,
  fingerprint,
  validateGraph,
  run,
  adoptInitial,
  assertResources,
  GraphError,
  redact,
  secretPath,
} from './graphify-local.mjs';

function git(root, ...args) {
  const result = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-C', root, ...args], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'graphify-adapter-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const root = path.join(dir, 'repo'),
    env = path.join(root, '.tools/graphify/.venv');
  await mkdir(path.join(root, 'src'), { recursive: true });
  await mkdir(path.join(env, 'bin'), { recursive: true });
  await writeFile(path.join(root, '.gitignore'), '.tools/\ngraphify-out/\nnode_modules/\n');
  await writeFile(path.join(root, 'package.json'), '{"name":"fixture","type":"commonjs"}');
  await writeFile(path.join(root, 'src/value.ts'), 'export const value = "v1";\n');
  const python = `#!${process.execPath}\nconst path=require('node:path');const prefix=path.resolve(__dirname,'..');console.log(JSON.stringify({version:'0.9.97',prefix,module:path.join(prefix,'lib/graphify/__init__.py')}));\n`;
  await writeFile(path.join(env, 'bin/python'), python, { mode: 0o700 });
  const graphify = `#!${process.execPath}\nconst fs=require('node:fs'),path=require('node:path');const a=process.argv.slice(2);const base=path.resolve(__dirname,'..');
if(a[0]==='--version'){console.log('graphify 0.9.97');process.exit(0);}
if(a[0]==='extract'){
 if(process.env.GRAPHIFY_FIXTURE_SECRET||fs.existsSync(path.join(a[1],'.env'))||fs.existsSync(path.join(a[1],'credentials.json'))||fs.existsSync(path.join(a[1],'node_modules')))process.exit(99);
 const source=fs.readFileSync(path.join(a[1],'src/value.ts'),'utf8');
 if(source.includes('TIMEOUT'))setInterval(()=>{},1000);else{
 const out=path.join(a[a.indexOf('--out')+1],'graphify-out');fs.mkdirSync(out,{recursive:true});
 const graph=source.includes('INVALID')?{nodes:[],links:[]}:{nodes:[{id:'value',label:source,source_file:'src/value.ts'}],links:[]};
 fs.writeFileSync(path.join(out,'graph.json'),JSON.stringify(graph));
 fs.appendFileSync(path.join(base,'calls'),'extract\\n');
 if(source.includes('MUTATE'))fs.appendFileSync(path.resolve(base,'../../..','src/value.ts'),'// concurrent change\\n');
 }}else if(a[0]==='cluster-only'){}else{const file=a[a.indexOf('--graph')+1];console.log(a[0]+':'+JSON.parse(fs.readFileSync(file,'utf8')).nodes[0].label);}
`;
  await writeFile(path.join(env, 'bin/graphify'), graphify, { mode: 0o700 });
  const config = {
    version: 1,
    project: 'fixture',
    environment: '.tools/graphify/.venv',
    pin: '0.9.97',
    pythonVersion: '3.11',
    state: '.tools/graphify/state',
    output: 'graphify-out',
    adapter: 'generic',
    scope: ['.'],
    partial: false,
    timeoutMs: 3000,
    minAvailableMb: 1,
    metadata: ['.gitignore', 'package.json'],
  };
  const configFile = path.join(dir, 'config.json');
  await writeFile(configFile, JSON.stringify(config));
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'user.email', 'fixture@example.invalid');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'base');
  const options = {
    globalLock: path.join(dir, 'fleet.lock'),
    fixtureOfflinePrefix: [],
    resourceProbe: async () => ({ availableMb: 32768, load: 0, parallelism: 2 }),
  };
  const args = (action, ...terms) => [action, ...terms, '--config', configFile, '--root', root];
  const call = (action, ...terms) => main(args(action, ...terms), options);
  const graph = path.join(root, 'graphify-out/graph.json');
  return { dir, root, env, config, configFile, options, args, call, graph };
}

test('mark é leve, aceita flags intercaladas e não importa runtime nem gera grafo', async (t) => {
  const f = await fixture(t);
  await rm(path.join(f.env, 'bin/python'));
  const result = await main(['--root', f.root, 'mark', '--config', f.configFile], f.options);
  assert.equal(result.exitCode, 0);
  assert.equal(result.report.status, 'marked');
  assert.equal(
    (await readdir(path.join(f.root, '.tools/graphify/state'))).includes('dirty.json'),
    true
  );
  await assert.rejects(readFile(f.graph), /ENOENT/);
});

test('ensure gera em staging, valida e status usa fonte/config/versão/HEAD', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call('status')).report.status, 'missing_graph');
  const first = await f.call('ensure');
  assert.equal(first.exitCode, 0, JSON.stringify(first.report));
  assert.equal(first.report.status, 'generated');
  assert.equal((await f.call('status')).report.status, 'current');
  await writeFile(path.join(f.root, 'src/value.ts'), 'export const value = "dirty";\n');
  assert.equal((await f.call('status')).report.status, 'stale');
  const second = await f.call('ensure');
  assert.equal(second.exitCode, 0, JSON.stringify(second.report));
  assert.ok(second.report.backup);
  assert.match(await readFile(path.join(second.report.backup, 'graph.json'), 'utf8'), /v1/);
  assert.equal((await f.call('status')).report.status, 'current');
  assert.match(await readFile(f.graph, 'utf8'), /dirty/);
});

test('query/path/explain sempre verificam freshness e usam CLI local', async (t) => {
  const f = await fixture(t);
  const first = await f.call('query', 'value');
  assert.equal(first.exitCode, 0, JSON.stringify(first.report));
  assert.equal(first.report.status, 'queried');
  assert.match(first.report.output, /v1/);
  await writeFile(path.join(f.root, 'src/value.ts'), 'export const value = "v2";\n');
  const updated = await f.call('path', 'first', 'second');
  assert.equal(updated.exitCode, 0, JSON.stringify(updated.report));
  assert.match(updated.report.output, /v2/);
  assert.equal((await f.call('explain', 'value')).exitCode, 0);
  assert.equal((await f.call('query', '--root')).exitCode, 1);
});

test('mark com hash igual não desperdiça nova extração', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call('ensure')).exitCode, 0);
  const counter = path.join(f.env, 'calls'),
    before = await readFile(counter, 'utf8');
  assert.equal((await f.call('mark')).exitCode, 0);
  assert.equal((await f.call('ensure')).exitCode, 0);
  assert.equal(await readFile(counter, 'utf8'), before);
});

test('arquivo novo e alteração de configuração tornam o snapshot stale', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call('ensure')).exitCode, 0);
  await writeFile(path.join(f.root, 'src/new.ts'), 'export const created = true;\n');
  assert.equal((await f.call('status')).report.status, 'stale');
  assert.equal((await f.call('ensure')).exitCode, 0);
  await writeFile(f.configFile, JSON.stringify({ ...f.config, timeoutMs: 4000 }));
  assert.equal((await f.call('status')).report.status, 'stale');
});

test('fingerprint ignora secrets/env, dependências, saídas e symlinks', async (t) => {
  const f = await fixture(t),
    before = await fingerprint(f.root, f.config);
  await writeFile(path.join(f.root, '.env'), 'PRIVATE_FIXTURE_TOKEN=private-value');
  await writeFile(path.join(f.root, 'credentials.json'), '{"token":"private-value"}');
  await mkdir(path.join(f.root, 'node_modules'));
  await writeFile(path.join(f.root, 'node_modules/pkg.js'), 'module.exports=1');
  await symlink(path.join(f.dir, 'outside.ts'), path.join(f.root, 'src/link.ts'));
  await writeFile(path.join(f.dir, 'outside.ts'), 'export const outside = true;');
  const after = await fingerprint(f.root, f.config);
  assert.deepEqual(after.files, before.files);
  assert.ok(after.skipped.includes('src/link.ts'));
  assert.equal(
    Object.keys(after.files).some((file) => file.includes('credentials') || file.includes('.env')),
    false
  );
});

test('runtime ausente/divergente e CLI global por symlink falham fechados', async (t) => {
  const f = await fixture(t);
  await writeFile(f.configFile, JSON.stringify({ ...f.config, pin: '0.9.68' }));
  assert.equal((await f.call('ensure')).report.status, 'missing_runtime');
  await writeFile(f.configFile, JSON.stringify(f.config));
  await rm(path.join(f.env, 'bin/graphify'));
  await symlink(process.execPath, path.join(f.env, 'bin/graphify'));
  assert.equal((await f.call('ensure')).report.status, 'missing_runtime');
});

test('grafo vazio ou inválido não substitui snapshot anterior', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call('ensure')).exitCode, 0);
  const before = await readFile(f.graph, 'utf8');
  await writeFile(path.join(f.root, 'src/value.ts'), 'export const value = "INVALID";\n');
  const result = await f.call('ensure');
  assert.equal(result.exitCode, 1);
  assert.equal(await readFile(f.graph, 'utf8'), before);
});

test('mudança de código durante geração impede promoção', async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.root, 'src/value.ts'), 'export const value = "MUTATE";\n');
  const result = await f.call('ensure');
  assert.equal(result.exitCode, 1);
  assert.match(result.report.message, /Fonte mudou/);
  await assert.rejects(readFile(f.graph), /ENOENT/);
});

test('saída rastreada é preservada e exige fluxo versionado', async (t) => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.graph));
  await writeFile(f.graph, JSON.stringify({ nodes: [{ id: 'old' }], links: [] }));
  git(f.root, 'add', '-f', 'graphify-out/graph.json');
  git(f.root, 'commit', '-m', 'tracked graph');
  const result = await f.call('ensure');
  assert.equal(result.exitCode, 1);
  assert.match(result.report.message, /rastreada/);
  assert.match(await readFile(f.graph, 'utf8'), /old/);
});

test('corpus parcial permite apenas imports externos documentados', async (t) => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.graph));
  await writeFile(
    f.graph,
    JSON.stringify({
      nodes: [{ id: 'source' }],
      edges: [{ source: 'source', target: 'external', relation: 'imports' }],
    })
  );
  assert.equal((await validateGraph(f.graph, true)).unresolvedImports, 1);
  await assert.rejects(validateGraph(f.graph), /sem origem/);
  await writeFile(
    f.graph,
    JSON.stringify({
      nodes: [{ id: 'source' }],
      edges: [{ source: 'missing', target: 'external', relation: 'imports' }],
    })
  );
  await assert.rejects(validateGraph(f.graph, true), /sem origem/);
});

test('trava local impede concorrência e recupera apenas dono comprovadamente morto', async (t) => {
  const f = await fixture(t),
    lock = path.join(f.dir, 'local.lock'),
    release = await acquire(lock);
  await assert.rejects(acquire(lock), (e) => e.status === 'busy');
  await release();
  await mkdir(lock);
  await writeFile(path.join(lock, 'owner.json'), JSON.stringify({ pid: 2147483647, token: 'old' }));
  const recovered = await acquire(lock);
  await recovered();
});

test('lease global é interoperável com flock e libera FD ao terminar', async (t) => {
  const f = await fixture(t),
    file = path.join(f.dir, 'shared.lock'),
    release = await acquireGlobal(file);
  const held = spawnSync('flock', ['-n', '-E', '75', file, 'true']);
  assert.equal(held.status, 75);
  await release();
  const free = spawnSync('flock', ['-n', '-E', '75', file, 'true']);
  assert.equal(free.status, 0);
});

test('timeout termina grupos de subprocessos e não deixa grafo parcial', async (t) => {
  const f = await fixture(t);
  await writeFile(f.configFile, JSON.stringify({ ...f.config, timeoutMs: 100 }));
  await writeFile(path.join(f.root, 'src/value.ts'), 'export const value = "TIMEOUT";\n');
  const started = Date.now(),
    result = await f.call('ensure');
  assert.equal(result.exitCode, 1);
  assert.ok(Date.now() - started < 5000);
  await assert.rejects(readFile(f.graph), /ENOENT/);
  const child = await run(
    [process.execPath, '-e', 'setInterval(()=>{},1000)'],
    f.root,
    { PATH: process.env.PATH },
    100
  );
  assert.equal(child.timedOut, true);
  assert.notEqual(child.code, 0);
});

test('configuração não pode desativar rede, escapar raiz ou trocar corpus silenciosamente', async (t) => {
  const f = await fixture(t);
  for (const update of [
    { environment: '../outside' },
    { offline: false },
    { adapter: 'finance', partial: false },
  ]) {
    await writeFile(f.configFile, JSON.stringify({ ...f.config, ...update }));
    assert.equal((await f.call('mark')).exitCode, 1);
  }
});

test('adoção inicial exige bytes, corpus, commit, pin e escopo iguais', async (t) => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.graph));
  await writeFile(f.graph, JSON.stringify({ nodes: [{ id: 'initial' }], links: [] }));
  const fp = await fingerprint(f.root, f.config),
    info = await validateGraph(f.graph);
  const initial = path.join(f.root, 'graphify-out/graphify-local-initial-provenance.json');
  await writeFile(
    initial,
    JSON.stringify({
      generator: 'initial-code-only',
      root: f.root,
      graphifyVersion: '0.9.97',
      partial: false,
      scope: ['.'],
      sourceFingerprint: { head: fp.head, files: fp.files },
      graphSha256: info.sha256,
      createdAt: new Date(Date.now() + 1000).toISOString(),
    })
  );
  const ctx = {
    root: f.root,
    config: f.config,
    graph: f.graph,
    outputRoot: path.dirname(f.graph),
    provenance: path.join(path.dirname(f.graph), 'graphify-local-provenance.json'),
  };
  await writeFile(f.graph, JSON.stringify({ nodes: [{ id: 'tampered' }], links: [] }));
  assert.equal(await adoptInitial(ctx, fp), false);
  await writeFile(f.graph, JSON.stringify({ nodes: [{ id: 'initial' }], links: [] }));
  assert.equal(await adoptInitial(ctx, fp), true);
  assert.equal((await f.call('status')).report.status, 'current');
  await assert.rejects(readFile(path.join(f.env, 'calls')), /ENOENT/);
});

test('lock global da manutenção impede extração e libera lock local', async (t) => {
  const f = await fixture(t),
    release = await acquireGlobal(f.options.globalLock);
  const result = await f.call('ensure');
  assert.equal(result.exitCode, 75);
  assert.equal(result.report.status, 'busy');
  await release();
  assert.equal((await f.call('ensure')).exitCode, 0);
});

test('install preserva ambiente individual válido sem chamar CLI global', async (t) => {
  const f = await fixture(t),
    result = await f.call('install');
  assert.equal(result.exitCode, 0);
  assert.equal(result.report.runtime.prefix, f.env);
  await assert.rejects(readFile(f.graph), /ENOENT/);
});

test('install ressincroniza ambiente existente quando o pin muda, mantendo hashes', async (t) => {
  const f = await fixture(t),
    log = path.join(f.dir, 'uv.log');
  await mkdir(path.join(f.root, 'scripts/graphify'), { recursive: true });
  await writeFile(
    path.join(f.root, 'scripts/graphify/requirements.lock'),
    'graphifyy[sql]==0.9.115 --hash=sha256:aa\ntree-sitter==0.21.0 --hash=sha256:bb\n'
  );
  // uv falso: registra o argv e, no sync, troca os binários pelo pin do lock —
  // mesmo efeito da instalação real, sem rede.
  const uv = [
    `#!${process.execPath}`,
    "const fs=require('node:fs'),path=require('node:path');",
    'const a=process.argv.slice(2);',
    `fs.appendFileSync(${JSON.stringify(log)},a.join(' ')+'\\n');`,
    "if(a[0]==='venv')process.exit(0);",
    "const pin=(fs.readFileSync(a[a.length-1],'utf8').match(/graphifyy(?:\\[sql\\])?==([0-9.]+)/)||[])[1];",
    `const env=${JSON.stringify(f.env)};`,
    "fs.writeFileSync(path.join(env,'bin/python'),'#!'+process.execPath+'\\n'+'const path=require(\"node:path\");const prefix=path.resolve(__dirname,\"..\");console.log(JSON.stringify({version:\"'+pin+'\",prefix,module:path.join(prefix,\"lib/graphify/__init__.py\")}));\\n',{mode:0o700});",
    "fs.writeFileSync(path.join(env,'bin/graphify'),'#!'+process.execPath+'\\n'+'if(process.argv[2]===\"--version\")console.log(\"graphify '+pin+'\");\\n',{mode:0o700});",
    '',
  ].join('\n');
  await mkdir(path.join(f.dir, '.local/bin'), { recursive: true });
  await writeFile(path.join(f.dir, '.local/bin/uv'), uv, { mode: 0o700 });
  // environment() monta o PATH a partir de homedir(): HOME da fixture isola o uv falso.
  const homeAntes = process.env.HOME;
  process.env.HOME = f.dir;
  t.after(() => {
    process.env.HOME = homeAntes;
  });
  await writeFile(f.configFile, JSON.stringify({ ...f.config, pin: '0.9.115' }));
  const divergente = await f.call('ensure');
  assert.equal(divergente.report.status, 'missing_runtime', JSON.stringify(divergente.report));
  const result = await f.call('install');
  assert.equal(result.exitCode, 0, JSON.stringify(result.report));
  assert.equal(result.report.status, 'installed');
  assert.equal(result.report.runtime.version, '0.9.115');
  const argv = await readFile(log, 'utf8');
  assert.match(argv, /^venv --allow-existing --python 3\.11 /m);
  assert.match(argv, /^pip sync --python .*--require-hashes --link-mode copy .*requirements\.lock$/m);
  // Ressincroniza pelo lock com hashes: nunca cai em install sem hashes.
  assert.doesNotMatch(argv, /^pip install /m);
});

test('chaves do processo pai não chegam ao extrator', async (t) => {
  const f = await fixture(t);
  process.env.GRAPHIFY_FIXTURE_SECRET = 'private-fixture-value';
  t.after(() => delete process.env.GRAPHIFY_FIXTURE_SECRET);
  const result = await f.call('ensure');
  assert.equal(result.exitCode, 0, JSON.stringify(result.report));
});

test('corpus de geração contém apenas arquivos permitidos e hashes grandes usam streaming', async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.root, '.env'), 'PRIVATE_FIXTURE_TOKEN=private');
  await writeFile(path.join(f.root, 'credentials.json'), '{"token":"private"}');
  await mkdir(path.join(f.root, 'node_modules'));
  await writeFile(path.join(f.root, 'node_modules/dep.js'), 'dep');
  await mkdir(path.join(f.root, 'src/tools'));
  await writeFile(path.join(f.root, 'src/tools/tool.ts'), 'export const tool=1');
  await writeFile(path.join(f.root, 'src/large.sql'), Buffer.alloc(11 * 1024 * 1024, 32));
  const fp = await fingerprint(f.root, f.config);
  assert.ok(fp.files['src/tools/tool.ts']);
  assert.ok(fp.files['src/large.sql']);
  assert.equal((await f.call('ensure')).exitCode, 0);
  const states = await readdir(path.join(f.root, f.config.state, 'runs'));
  const corpus = path.join(f.root, f.config.state, 'runs', states[0], 'corpus');
  await assert.rejects(readdir(corpus), /ENOENT/);
  assert.equal((await f.call('status')).report.status, 'current');
});

test('config relativo resolve em root mesmo com cwd diferente', async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.root, 'graphify.local.json'), JSON.stringify(f.config));
  const r = await main(['--root', f.root, '--config', 'graphify.local.json', 'mark'], f.options);
  assert.equal(r.exitCode, 0);
});

for (const mode of ['symlink', 'regular', 'write'])
  test(`descritor do grafo bloqueia troca concorrente: ${mode}`, async (t) => {
    const f = await fixture(t);
    await mkdir(path.dirname(f.graph), { recursive: true });
    const original = JSON.stringify({ nodes: [{ id: 'original' }], links: [] });
    const replacement = JSON.stringify({
      nodes: [{ id: 'substituto' }, { id: 'outro' }],
      links: [],
    });
    await writeFile(f.graph, original);
    const target = path.join(f.dir, 'replacement.json');
    await writeFile(target, replacement);
    const originalStats = await lstat(f.graph, { bigint: true });
    const probe = await open(f.graph, 'r'),
      prototype = Object.getPrototypeOf(probe);
    await probe.close();
    const stat = prototype.stat;
    let swapped = false;
    t.mock.method(prototype, 'stat', async function (...args) {
      const info = await Reflect.apply(stat, this, args);
      if (!swapped && info.ino === originalStats.ino && info.dev === originalStats.dev) {
        swapped = true;
        if (mode === 'write') await writeFile(f.graph, replacement);
        else {
          await rename(f.graph, path.join(f.dir, 'original.json'));
          if (mode === 'symlink') await symlink(target, f.graph);
          else await rename(target, f.graph);
        }
      }
      return info;
    });
    try {
      const info = await validateGraph(f.graph);
      assert.equal(info.nodes, 1);
      assert.equal(info.sha256, createHash('sha256').update(original).digest('hex'));
    } catch (error) {
      assert.match(error.message, /mudou durante a leitura/);
    }
    assert.equal(swapped, true);
    t.mock.restoreAll();
    if (mode === 'symlink') await assert.rejects(validateGraph(f.graph), (e) => e.code === 'ELOOP');
  });

test('grafo recusa diretório, FIFO e arquivo maior que512MB sem seguir caminhos', async (t) => {
  const f = await fixture(t);
  await assert.rejects(validateGraph(f.dir), /regular/);
  const fifo = path.join(f.dir, 'graph.fifo');
  assert.equal(spawnSync('mkfifo', [fifo]).status, 0);
  await assert.rejects(validateGraph(fifo), /regular/);
  const large = path.join(f.dir, 'large.json');
  await writeFile(large, '');
  await truncate(large, 512 * 1024 * 1024 + 1);
  await assert.rejects(validateGraph(large), /512MB/);
});

test('política de recursos usa amostra determinística e bloqueia memória/carga insuficientes', async (t) => {
  assert.doesNotThrow(() => assertResources({ availableMb: 6144, load: 2, parallelism: 2 }, 6144));
  for (const sample of [
    { availableMb: 6143, load: 0, parallelism: 2 },
    { availableMb: 8192, load: 2.01, parallelism: 2 },
    { availableMb: NaN, load: 0, parallelism: 2 },
  ])
    assert.throws(
      () => assertResources(sample, 6144),
      (e) => e.status === 'resources'
    );
  const f = await fixture(t);
  const denied = await main(f.args('ensure'), {
    ...f.options,
    resourceProbe: async () => ({ availableMb: 0, load: 0, parallelism: 2 }),
  });
  assert.equal(denied.exitCode, 75);
  assert.equal(denied.report.status, 'resources');
  await assert.rejects(readFile(f.graph), /ENOENT/);
  assert.equal((await f.call('ensure')).exitCode, 0);
  for (const key of ['resourceProbe', 'fixtureOfflinePrefix']) {
    await writeFile(f.configFile, JSON.stringify({ ...f.config, [key]: { availableMb: 1e9 } }));
    assert.equal((await f.call('ensure')).exitCode, 1);
  }
});

// ---------------------------------------------------------------------------------------------
// Rodada 2 de endurecimento
// ---------------------------------------------------------------------------------------------

const script = fileURLToPath(new URL('./graphify-local.mjs', import.meta.url));
const cleanEnv = { PATH: process.env.PATH, HOME: process.env.HOME };
const cli = (file, args) =>
  spawnSync(process.execPath, [file, ...args], { encoding: 'utf8', env: cleanEnv });

test('CLI executa mesmo via symlink e caminho com espaço/acento (não pode sair 0 mudo)', async (t) => {
  const f = await fixture(t);
  const real = path.join(f.dir, 'pasta real');
  await mkdir(real);
  await copyFile(script, path.join(real, 'graphify-local.mjs'));
  const linkFile = path.join(f.dir, 'atalho.mjs');
  await symlink(path.join(real, 'graphify-local.mjs'), linkFile);
  const linkDir = path.join(f.dir, 'atalho-dir');
  await symlink(real, linkDir);
  const accented = path.join(f.dir, 'ação ç');
  await mkdir(accented);
  await copyFile(script, path.join(accented, 'g.mjs'));
  for (const file of [
    linkFile,
    path.join(linkDir, 'graphify-local.mjs'),
    path.join(accented, 'g.mjs'),
    path.join(real, 'graphify-local.mjs'),
  ]) {
    const r = cli(file, ['status', '--config', f.configFile, '--root', f.root]);
    assert.equal(r.status, 3, `${file}: ${r.stderr}`);
    assert.equal(JSON.parse(r.stdout).status, 'missing_graph', file);
  }
});

test('importar o módulo não executa o CLI nem escreve nada', async (t) => {
  const f = await fixture(t);
  const r = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `await import(${JSON.stringify(script)})`],
    { encoding: 'utf8', env: cleanEnv, cwd: f.root }
  );
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '');
});

test('argumentos inválidos falham com mensagem que nomeia a opção e termos vazios são recusados', async (t) => {
  const f = await fixture(t);
  const cases = [
    [['--dryrun', 'status'], /desconhecida: --dryrun/],
    [['status', '--root=/x'], /--root VALOR/],
    [['status', '--config'], /--config duplicada ou sem valor/],
    [['status', '--root', f.root, '--root', f.root], /--root duplicada ou sem valor/],
    [['query', ''], /Termo de consulta inválido/],
    [['query', '   '], /Termo de consulta inválido/],
    [['query', '-x'], /Termo de consulta inválido/],
    [['path', 'a'], /Quantidade de argumentos/],
    [['ensure', 'extra'], /Quantidade de argumentos/],
    [[], /Use install/],
    [['limpar'], /Use install/],
  ];
  for (const [args, message] of cases) {
    const r = await main(args, f.options);
    assert.equal(r.exitCode, 1, JSON.stringify(args));
    assert.match(r.report.message, message, JSON.stringify(args));
  }
  await assert.rejects(readFile(f.graph), /ENOENT/);
});

test('config e raiz ilegíveis dão mensagem acionável, não "Falha interna"', async (t) => {
  const f = await fixture(t);
  const missing = await main([
    'status',
    '--config',
    path.join(f.dir, 'nao-existe.json'),
    '--root',
    f.root,
  ]);
  assert.equal(missing.exitCode, 1);
  assert.match(missing.report.message, /Configuração Graphify ilegível \(ENOENT\)/);
  await writeFile(f.configFile, '{quebrado');
  const broken = await f.call('status');
  assert.match(broken.report.message, /ilegível \(SyntaxError\)/);
  const noRoot = await main(['status', '--root', path.join(f.dir, 'nao-existe')]);
  assert.match(noRoot.report.message, /--root inexistente/);
  const notGit = await main(['status', '--root', f.dir, '--config', f.configFile]);
  assert.match(notGit.report.message, /Leitura Git falhou: .*(not a git repository|repositório)/i);
});

const corruptGraphs = {
  vazio: '',
  truncado: '{"nodes":[{"id":"a"}',
  null: 'null',
  'nó nulo': '{"nodes":[null],"links":[]}',
  'nó escalar': '{"nodes":[1],"links":[]}',
  'relação nula': '{"nodes":[{"id":"a"}],"links":[null]}',
  'relações objeto': '{"nodes":[{"id":"a"}],"links":{}}',
  lista: '[]',
};
for (const [name, body] of Object.entries(corruptGraphs))
  test(`grafo ${name} é recusado com erro de domínio (GraphError), nunca SyntaxError/TypeError`, async (t) => {
    const f = await fixture(t);
    const file = path.join(f.dir, 'graph.json');
    await writeFile(file, body);
    await assert.rejects(
      validateGraph(file),
      (e) => e instanceof GraphError && e.status === 'failed'
    );
    await assert.rejects(validateGraph(file, true), (e) => e instanceof GraphError);
  });

test('status e ensure com graph.json corrompido preservam o arquivo e explicam o motivo', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call('ensure')).exitCode, 0);
  await writeFile(f.graph, '{truncado');
  for (const action of ['status', 'ensure']) {
    const r = await f.call(action);
    assert.equal(r.exitCode, 1, action);
    assert.match(r.report.message, /não é JSON válido/, action);
  }
  assert.equal(await readFile(f.graph, 'utf8'), '{truncado');
});

for (const body of ['', 'null', '[]', '{quebrado', '"texto"', '{"version":1,"graph":null}'])
  test(`proveniência ilegível (${JSON.stringify(body)}) vira stale e ensure regenera`, async (t) => {
    const f = await fixture(t);
    assert.equal((await f.call('ensure')).exitCode, 0);
    const prov = path.join(path.dirname(f.graph), 'graphify-local-provenance.json');
    await writeFile(prov, body);
    const status = await f.call('status');
    assert.equal(status.report.status, 'stale', JSON.stringify(status.report));
    assert.equal(status.exitCode, 3);
    const again = await f.call('ensure');
    assert.equal(again.exitCode, 0, JSON.stringify(again.report));
    assert.equal(again.report.status, 'generated');
    assert.equal((await f.call('status')).report.status, 'current');
  });

test('redact cobre DSN, Authorization, JSON, valores com espaço e prefixos de token, sem deixar resto', () => {
  const cases = [
    ['postgres://user:p4ss@db.host:5432/x', ['p4ss'], 'postgres://[REDIGIDO]@db.host:5432/x'],
    ['https://u:ghp_abcdefghijklmnop@github.com/x', ['ghp_abcdefghijklmnop']],
    ['Authorization: Basic dXNlcjpwYXNz', ['dXNlcjpwYXNz']],
    ['authorization: token abc123', ['abc123']],
    ['Authorization: Bearer abc.def', ['abc.def']],
    ['{"api_key":"abc123def","password": "hunter2"}', ['abc123def', 'hunter2']],
    [
      'SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ.eyJzdWIiOiJ.sig',
      ['eyJ', 'sig'],
      'SUPABASE_SERVICE_ROLE_KEY=[REDIGIDO]',
    ],
    ['API_KEY="duas palavras"', ['duas', 'palavras'], 'API_KEY=[REDIGIDO]'],
    ["DB_PASSWORD='a b c' next", ['a b c', ' c'], 'DB_PASSWORD=[REDIGIDO] next'],
    ['AUTH_TOKEN=Bearer abc123', ['abc123']],
    // Tokens fictícios montados em tempo de execução: o literal inteiro no fonte bloqueia o push (secret scanning).
    ['password=hunter2&x=1', ['hunter2'], 'password=[REDIGIDO]&x=1'],
    ['?access_token=zzz999&y=2', ['zzz999']],
    [['sbp', '_0123456789abcdef0123456789abcdef01234567'].join(''), ['0123456789abcdef']],
    [['npm', '_abcdefghijklmnopqrstuvwxyz0123456789'].join(''), ['abcdefghijklmnop']],
    [['AK', 'IAIOSFODNN7EXAMPLE'].join(''), ['IOSFODNN7']],
    [
      `export OPENAI_API_KEY=${['sk', '-abcdefghijklmnopqrstuvwxyz'].join('')}`,
      ['abcdefghijklmnop'],
      'export OPENAI_API_KEY=[REDIGIDO]',
    ],
    [['xox', 'b-1234567890-abcdefghij'].join(''), ['1234567890']],
    ['eyJhbGciOi.eyJzdWIi.c2ln', ['eyJzdWIi']],
  ];
  for (const [input, leaked, expected] of cases) {
    const out = redact(input);
    for (const secret of leaked) assert.ok(!out.includes(secret), `vazou ${secret}: ${out}`);
    if (expected) assert.equal(out, expected);
  }
});

test('redact não destrói texto comum nem URLs sem credencial e é idempotente', () => {
  for (const text of [
    'http://localhost:3000/foo@bar',
    'git@github.com:org/repo.git',
    'tokenCount: number',
    'const key = chave;',
    'risk-assessment-engine-component-name',
    'Nada a ocultar aqui, ação concluída.',
  ])
    assert.equal(redact(text), text);
  const once = redact('API_KEY=abc password=zzz https://u:p@h/x');
  assert.equal(redact(once), once);
});

test('saída de query não vaza segredos do rótulo do grafo', async (t) => {
  const f = await fixture(t);
  await writeFile(
    path.join(f.root, 'src/value.ts'),
    'export const v = "postgres://user:s3cretpw@db/x"; // SUPABASE_KEY="aa bb"\n'
  );
  const r = await f.call('query', 'v');
  assert.equal(r.exitCode, 0, JSON.stringify(r.report));
  assert.ok(!r.report.output.includes('s3cretpw'), r.report.output);
  assert.ok(!r.report.output.includes('aa bb'), r.report.output);
  const saved = await readFile(path.join(f.root, f.config.state, 'last-report.json'), 'utf8');
  assert.ok(!saved.includes('s3cretpw'));
});

test('secretPath exclui arquivos de dados com nome de credencial e preserva código comum', () => {
  for (const file of [
    'google-credentials.json',
    'service-account.json',
    'config/client_secret_123.json',
    'secrets.local.json',
    'firebase-adminsdk-abc.json',
    'app.private_key.yaml',
    'x/.env',
    'x/.env.local',
    'chave.pem',
    'id.key',
    'ops/Credentials.TOML',
  ])
    assert.equal(secretPath(file), true, file);
  for (const file of [
    'src/secret-santa.ts',
    'src/lib/token.ts',
    'package.json',
    'supabase/config.toml',
    'src/secretaria/lista.json',
    'src/accounts.json',
    'src/a.envrc.ts',
  ])
    assert.equal(secretPath(file), false, file);
});

test('fingerprint e corpus isolado não incluem JSON com nome de credencial', async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.root, 'src/client_secret_9.json'), '{"k":"v"}');
  await writeFile(path.join(f.root, 'src/service-account.json'), '{"k":"v"}');
  const fp = await fingerprint(f.root, f.config);
  assert.equal(
    Object.keys(fp.files).some((x) => /secret|service-account/.test(x)),
    false
  );
});

test('run() decodifica UTF-8 por fluxo (multibyte cortado entre chunks) e reporta spawn inexistente', async (t) => {
  const code =
    "const w=Buffer.from('€ação');process.stdout.write(w.subarray(0,2));setTimeout(()=>process.stdout.write(w.subarray(2)),80)";
  const r = await run(
    [process.execPath, '-e', code],
    process.cwd(),
    { PATH: process.env.PATH },
    5000
  );
  assert.equal(r.code, 0);
  assert.equal(r.output, '€ação');
  const missing = await run(
    ['comando-que-nao-existe-xyz'],
    process.cwd(),
    { PATH: '/nonexistent' },
    5000
  );
  assert.equal(missing.code, 1);
  assert.equal(missing.spawnError, 'ENOENT');
});

test('adoção inicial recusa createdAt ausente/inválido e JSON malformado sem lançar', async (t) => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.graph));
  await writeFile(f.graph, JSON.stringify({ nodes: [{ id: 'initial' }], links: [] }));
  const fp = await fingerprint(f.root, f.config),
    info = await validateGraph(f.graph);
  const initial = path.join(f.root, 'graphify-out/graphify-local-initial-provenance.json');
  const valid = {
    generator: 'initial-code-only',
    root: f.root,
    graphifyVersion: '0.9.97',
    partial: false,
    scope: ['.'],
    sourceFingerprint: { head: fp.head, files: fp.files },
    graphSha256: info.sha256,
    createdAt: new Date(Date.now() + 1000).toISOString(),
  };
  const ctx = {
    root: f.root,
    config: f.config,
    graph: f.graph,
    outputRoot: path.dirname(f.graph),
    provenance: path.join(path.dirname(f.graph), 'graphify-local-provenance.json'),
  };
  // metadado alterado DEPOIS da extração inicial: createdAt inválido não pode desligar essa checagem
  const { createdAt, ...semData } = valid;
  const { scope, ...semEscopo } = valid;
  for (const [body, esperado] of [
    [JSON.stringify(semData), false],
    [JSON.stringify({ ...valid, createdAt: 'ontem' }), false],
    [JSON.stringify(semEscopo), false],
    ['{quebrado', false],
    ['null', false],
    ['', false],
    [JSON.stringify(valid), true],
  ]) {
    await rm(ctx.provenance, { force: true });
    await writeFile(initial, body);
    assert.equal(await adoptInitial(ctx, fp), esperado, body.slice(0, 40));
  }
});

test('promoção não deixa .tmp órfão e relatório sai atômico', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call('ensure')).exitCode, 0);
  await writeFile(path.join(f.root, 'src/value.ts'), 'export const value = "v3";\n');
  assert.equal((await f.call('ensure')).exitCode, 0);
  const out = await readdir(path.dirname(f.graph));
  assert.deepEqual(
    out.filter((n) => n.endsWith('.tmp')),
    []
  );
  const state = await readdir(path.join(f.root, f.config.state));
  assert.deepEqual(
    state.filter((n) => n.endsWith('.tmp')),
    []
  );
});

test('saída determinística: duas execuções de status idênticas salvo carimbos de tempo', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call('ensure')).exitCode, 0);
  const strip = ({ startedAt, finishedAt, ...rest }) => JSON.stringify(rest);
  const a = strip((await f.call('status')).report),
    b = strip((await f.call('status')).report);
  assert.equal(a, b);
  const g1 = await readFile(f.graph, 'utf8');
  assert.equal((await f.call('ensure')).report.status, 'current');
  assert.equal(await readFile(f.graph, 'utf8'), g1);
});

// --- adaptador Finance (perfil real do repositório): antes sem nenhuma cobertura ---------------

const PILOT_FILES = [
  'src/lib/arquitetura/analisador-imports.ts',
  'src/lib/arquitetura/modulos.ts',
  'src/integrations/supabase/client.ts',
  'supabase/functions/_shared/auth-guard.ts',
  'supabase/functions/_shared/webhook-auth.ts',
];
async function financeFixture(t, { mode = 'ok', wrapperFiles = PILOT_FILES } = {}) {
  const f = await fixture(t);
  const bin = path.join(f.env, 'bin');
  await writeFile(path.join(bin, 'package.json'), '{"type":"commonjs"}');
  await writeFile(path.join(bin, 'mode'), mode);
  const python = `#!${process.execPath}
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const a=process.argv.slice(2);
if(a[0]==='-I'){const prefix=path.resolve(__dirname,'..');console.log(JSON.stringify({version:'0.9.97',prefix,module:path.join(prefix,'lib/graphify/__init__.py')}));process.exit(0);}
const mode=fs.readFileSync(path.join(__dirname,'mode'),'utf8');
const probe=cp.spawnSync('graphify',['extract','x','--max-workers','4'],{encoding:'utf8'});
if(probe.status!==0)process.exit(7);
const make=(name,status)=>{const dir=path.join('graphify-out/pilot',name);fs.mkdirSync(path.join(dir,'graphify-out'),{recursive:true});
 fs.writeFileSync(path.join(dir,'evidencia.json'),JSON.stringify({status}));
 fs.writeFileSync(path.join(dir,'graphify-out/graph.json'),JSON.stringify({nodes:[{id:'n1',source_file:'${PILOT_FILES[0]}'}],links:[{source:'n1',target:'externo',relation:'imports'}]}));};
if(mode==='ok')make('execucao-aaa','validado_com_limitacoes');
if(mode==='recusa')make('execucao-aaa','falhou');
if(mode==='duas'){make('execucao-aaa','validado_com_limitacoes');make('execucao-bbb','validado_com_limitacoes');}
`;
  await writeFile(path.join(bin, 'python'), python, { mode: 0o700 });
  await writeFile(
    path.join(bin, 'graphify'),
    `#!${process.execPath}
const fs=require('node:fs'),path=require('node:path');const a=process.argv.slice(2);
if(a[0]==='--version'){console.log('graphify 0.9.97');process.exit(0);}
fs.appendFileSync(path.resolve(__dirname,'..','args.log'),a.join(' ')+'\\n');
if(a[0]==='query'){console.log('ok:'+a.join(' '));}
`,
    { mode: 0o700 }
  );
  await writeFile(path.join(f.root, 'package.json'), '{"name":"fixture","type":"module"}');
  for (const file of PILOT_FILES) {
    await mkdir(path.dirname(path.join(f.root, file)), { recursive: true });
    await writeFile(path.join(f.root, file), `export const x = ${JSON.stringify(file)};\n`);
  }
  await mkdir(path.join(f.root, 'scripts/graphify'), { recursive: true });
  await writeFile(
    path.join(f.root, 'scripts/graphify/config.json'),
    JSON.stringify({ version: '0.9.97', profiles: { pilot: { files: wrapperFiles } } })
  );
  await writeFile(path.join(f.root, 'scripts/graphify/run.py'), '# emulado pelo python falso\n');
  git(f.root, 'add', '.');
  git(f.root, 'commit', '-m', 'finance');
  const config = {
    ...f.config,
    adapter: 'finance',
    scope: PILOT_FILES,
    partial: true,
    output: 'graphify-out/pilot',
    metadata: [
      '.gitignore',
      'package.json',
      'scripts/graphify/config.json',
      'scripts/graphify/run.py',
    ],
  };
  await writeFile(f.configFile, JSON.stringify(config));
  return { ...f, config, argsLog: path.join(f.env, 'args.log') };
}

test('Finance: wrapper roda com shim --max-workers 1, grafo parcial é promovido e vira current', async (t) => {
  const f = await financeFixture(t);
  const r = await f.call('ensure');
  assert.equal(r.exitCode, 0, JSON.stringify(r.report));
  assert.equal(r.report.status, 'generated');
  assert.equal(r.report.graph.unresolvedImports, 1);
  assert.match(await readFile(f.argsLog, 'utf8'), /^extract x --max-workers 1$/m);
  const meta = JSON.parse(await readFile(r.report.provenance, 'utf8'));
  assert.match(meta.wrapperEvidence, /execucao-aaa\/evidencia\.json$/);
  assert.equal(meta.partial, true);
  assert.equal((await f.call('status')).report.status, 'current');
  const q = await f.call('query', 'x');
  assert.equal(q.exitCode, 0, JSON.stringify(q.report));
  assert.match(q.report.output, /^ok:query x --graph .*graph\.json --budget 1500$/);
});

test('Finance: wrapper que recusa o corpus ou gera 0/2 execuções não promove nada', async (t) => {
  for (const [mode, message] of [
    ['recusa', /recusou o corpus/],
    ['nenhuma', /execução única/],
    ['duas', /execução única/],
  ]) {
    const f = await financeFixture(t, { mode });
    const r = await f.call('ensure');
    assert.equal(r.exitCode, 1, mode);
    assert.match(r.report.message, message, mode);
    await assert.rejects(readFile(f.graph), /ENOENT/);
  }
});

test('Finance: perfil divergente ou config do wrapper ausente falha fechado com mensagem clara', async (t) => {
  const f = await financeFixture(t, { wrapperFiles: PILOT_FILES.slice(1) });
  const diverge = await f.call('ensure');
  assert.equal(diverge.exitCode, 1);
  assert.match(diverge.report.message, /diverge do wrapper/);
  await rm(path.join(f.root, 'scripts/graphify/config.json'));
  const ausente = await f.call('ensure');
  assert.equal(ausente.exitCode, 1);
  assert.match(ausente.report.message, /Config do wrapper Finance ilegível \(ENOENT\)/);
  await writeFile(path.join(f.root, 'scripts/graphify/config.json'), '{"version":"0.9.97"}');
  const semPerfil = await f.call('ensure');
  assert.match(semPerfil.report.message, /diverge do wrapper/);
});

test('install do Finance sem lock com hashes recusa antes de criar o ambiente', async (t) => {
  const f = await financeFixture(t);
  await rm(f.env, { recursive: true, force: true });
  const r = await f.call('install');
  assert.equal(r.exitCode, 1, JSON.stringify(r.report));
  assert.match(r.report.message, /Lock com hashes ausente/);
  await assert.rejects(stat(f.env), /ENOENT/);
});
