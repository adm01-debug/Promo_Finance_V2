import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
  utimes,
  lstat,
  rename,
  readdir,
  chmod,
} from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import { main, parseArgs, networkPrefix, allowedSourceFiles } from './run.mjs';
import {
  git,
  run,
  acquire,
  validateConfig,
  exists,
  dependencyFingerprint,
  inspect,
  readRegularDependency,
} from './lib.mjs';

async function fixture(
  t,
  {
    content = 'bad',
    failure = '',
    emptyTypes = false,
    trackedEnv = false,
    formatterEscapes = false,
    nativeTypes = false,
  } = {}
) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maintenance-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const root = path.join(dir, 'repo'),
    state = path.join(dir, 'state');
  await mkdir(root);
  await mkdir(path.join(root, 'src'));
  await mkdir(path.join(root, 'scripts'));
  await git(root, ['init', '-q', '-b', 'main']);
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'fixture', type: 'module', private: true })
  );
  await writeFile(path.join(root, 'package-lock.json'), '{}');
  await writeFile(path.join(root, '.gitignore'), 'node_modules/\ndist/\n');
  await writeFile(path.join(root, 'src/value.ts'), `export const value = '${content}';\n`);
  await writeFile(
    path.join(root, 'tsconfig.app.json'),
    JSON.stringify({ files: emptyTypes ? [] : ['src/value.ts'] })
  );
  if (trackedEnv)
    await writeFile(path.join(root, '.env'), 'MAINTENANCE_TEST_SECRET=private-fixture-value\n');
  const gates = `import fs from 'node:fs';import {spawnSync} from 'node:child_process';\nconst text=fs.readFileSync('src/value.ts','utf8'); const phase=process.argv[2];\nif(fs.existsSync('.env') || process.env.MAINTENANCE_TEST_SECRET) {console.error('secret environment was present');process.exit(40);}\nif(${JSON.stringify(failure)}==='baseline' && phase==='lint') {console.error('Error: baseline fixture');process.exit(21);}\nif(${JSON.stringify(failure)}==='patched' && phase==='test' && text.includes('good')) {console.error('Error: patched fixture');process.exit(22);}\nif(${JSON.stringify(failure)}==='staged' && phase==='lint'){fs.appendFileSync('package.json','\\n');spawnSync('git',['add','package.json']);}\nif(${JSON.stringify(failure)}==='mutating' && phase==='test' && text.includes('good'))fs.writeFileSync('src/value.ts',text.replace('good','different'));\nif(${JSON.stringify(failure)}==='timeout' && phase==='test') await new Promise(r=>setTimeout(r,30000));\n`;
  await writeFile(path.join(root, 'scripts/gate.mjs'), gates);
  const tsDir = path.join(root, 'node_modules/typescript');
  await mkdir(tsDir, { recursive: true });
  await writeFile(
    path.join(tsDir, 'package.json'),
    JSON.stringify({ name: 'typescript', main: 'index.cjs' })
  );
  await mkdir(path.join(tsDir, 'bin'));
  await writeFile(
    path.join(tsDir, 'bin/tsc'),
    nativeTypes
      ? `const fs=require('fs'),path=require('path');if(process.argv.includes('--listFilesOnly')){const cfg=process.argv[process.argv.indexOf('--project')+1];console.log(JSON.parse(fs.readFileSync(cfg,'utf8')).files.map(f=>path.resolve(f)).join('\\n'));}`
      : 'process.exit(0);'
  );
  await writeFile(
    path.join(tsDir, 'index.cjs'),
    nativeTypes
      ? 'module.exports={version:"7.0.2",versionMajorMinor:"7.0"};'
      : `const fs=require('fs'),path=require('path');module.exports={sys:{readFile:f=>fs.readFileSync(f,'utf8')},readConfigFile:(f,read)=>({config:JSON.parse(read(f))}),parseJsonConfigFileContent:(c,sys,base)=>({errors:[],fileNames:(c.files||[]).map(f=>path.resolve(base,f))})};`
  );
  for (const name of ['eslint', 'prettier']) {
    const d = path.join(root, 'node_modules', name);
    await mkdir(d, { recursive: true });
    await writeFile(
      path.join(d, 'package.json'),
      JSON.stringify({ name, type: 'module', bin: { [name]: 'bin.mjs' } })
    );
    await writeFile(
      path.join(d, 'bin.mjs'),
      name === 'prettier'
        ? `import fs from 'node:fs';const f='src/value.ts';if(process.argv.includes('--list-different')){if(fs.readFileSync(f,'utf8').includes('bad')){console.log(f);process.exit(1);}process.exit(0);}fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('bad','good'));${formatterEscapes ? "fs.writeFileSync('package.json','{}');" : ''}`
        : ''
    );
  }
  const config = {
    version: 1,
    manager: 'npm',
    tsconfigs: ['tsconfig.app.json'],
    gates: ['lint', 'types', 'test', 'build'].map((name) => ({
      name,
      command:
        name === 'types'
          ? ['node', new URL('./typecheck.mjs', import.meta.url).pathname, 'tsconfig.app.json']
          : ['node', 'scripts/gate.mjs', name],
    })),
    fix: { roots: ['src'], prettier: true, eslintRules: [] },
    timeoutMs: failure === 'timeout' ? 300 : 5000,
    maxFiles: 20,
    maxChangedLines: 400,
  };
  const configFile = path.join(dir, 'config.json');
  await writeFile(configFile, JSON.stringify(config));
  await git(root, ['add', '.']);
  await git(root, [
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@localhost',
    'commit',
    '-qm',
    'base',
  ]);
  const args = (action = 'heal') => [
    action,
    '--root',
    root,
    '--ref',
    'main',
    '--config',
    configFile,
    '--state',
    state,
  ];
  return { root, state, configFile, args, config, dir };
}
const sandboxAvailable = await networkPrefix(process.cwd()).then(
  () => true,
  () => false
);
const isolated = { skip: !sandboxAvailable };
test('CLI e config desconhecidas falham fechadas', () => {
  assert.throws(() => parseArgs(['heal', '--root', '/tmp/x']), /--ref/);
  assert.throws(() => parseArgs(['doctor', '--root', '/tmp/x', '--apply', 'yes']), /Argumento/);
  assert.throws(() => validateConfig({ version: 1, surprise: true }), /Configuração/);
});
test('tsconfig vazio impede doctor saudável', async (t) => {
  const f = await fixture(t, { emptyTypes: true });
  const result = await main(f.args('doctor'));
  assert.equal(result.exitCode, 1);
  assert.equal(result.report.status, 'failed');
  assert.match(result.report.message, /Projeto TypeScript vazio/);
});
test('trava atômica impede segundo executor', async (t) => {
  const d = await mkdtemp(path.join(os.tmpdir(), 'maintenance-lock-'));
  t.after(() => rm(d, { recursive: true, force: true }));
  const unlock = await acquire(path.join(d, 'lock'));
  await assert.rejects(acquire(path.join(d, 'lock')), (e) => e.code === 'skipped_busy');
  await unlock();
  const again = await acquire(path.join(d, 'lock'));
  await again();
});
test('timeout mata grupo de subprocessos e distingue resultado', async () => {
  const start = Date.now();
  const result = await run(['node', '-e', 'setInterval(()=>{},1000)'], process.cwd(), 100);
  assert.equal(result.timedOut, true);
  assert.notEqual(result.code, 0);
  assert.ok(Date.now() - start < 2500);
});
test('gate baseline falha sem criar branch ou tocar clone sujo', isolated, async (t) => {
  const f = await fixture(t, { failure: 'baseline' });
  await writeFile(path.join(f.root, 'src/value.ts'), 'human dirty edit\n');
  const before = await git(f.root, ['show-ref']);
  const result = await main(f.args());
  assert.equal(result.report.status, 'blocked_baseline');
  assert.equal(result.exitCode, 3);
  assert.equal(await readFile(path.join(f.root, 'src/value.ts'), 'utf8'), 'human dirty edit\n');
  assert.equal(await git(f.root, ['show-ref']), before);
  assert.equal(
    (await git(f.root, ['worktree', 'list', '--porcelain'])).match(/worktree /g).length,
    1
  );
});
test('patch isolado é validado, commitado localmente e não duplicado', isolated, async (t) => {
  const f = await fixture(t, { trackedEnv: true });
  const base = await git(f.root, ['rev-parse', 'HEAD']);
  process.env.MAINTENANCE_TEST_SECRET = 'must-not-reach-child';
  t.after(() => delete process.env.MAINTENANCE_TEST_SECRET);
  const result = await main(f.args());
  assert.equal(result.report.status, 'validated_patch', JSON.stringify(result.report));
  assert.equal(result.exitCode, 0);
  assert.equal(await git(f.root, ['rev-parse', 'HEAD']), base);
  assert.match(await readFile(path.join(f.root, 'src/value.ts'), 'utf8'), /bad/);
  assert.equal(result.report.steps.filter((s) => s.phase === 'patched').length, 4);
  const patch = await readFile(result.report.patch, 'utf8');
  assert.match(patch, /good/);
  assert.ok(!patch.includes('private-fixture-value'));
  assert.match(await git(f.root, ['show', `${result.report.commit}:src/value.ts`]), /good/);
  assert.equal(
    await git(f.root, ['show', `${result.report.commit}:.env`]),
    'MAINTENANCE_TEST_SECRET=private-fixture-value'
  );
  assert.equal((await main(f.args())).report.status, 'pending_patch');
  assert.equal(
    (await git(f.root, ['worktree', 'list', '--porcelain'])).match(/worktree /g).length,
    1
  );
});
test('gate após patch falha sem commit nem branch restante', isolated, async (t) => {
  const f = await fixture(t, { failure: 'patched' });
  const before = await git(f.root, ['show-ref']);
  const result = await main(f.args());
  assert.equal(result.report.status, 'failed');
  assert.match(result.report.message, /patched/);
  assert.equal(await git(f.root, ['show-ref']), before);
  assert.match(await readFile(path.join(f.root, 'src/value.ts'), 'utf8'), /bad/);
});
test('formatter fora do escopo é descartado antes de commit', isolated, async (t) => {
  const f = await fixture(t, { formatterEscapes: true });
  const result = await main(f.args());
  assert.equal(result.report.status, 'failed');
  assert.match(result.report.message, /fora do escopo/);
  assert.equal(
    JSON.parse(await readFile(path.join(f.root, 'package.json'), 'utf8')).name,
    'fixture'
  );
});
test('código de saída baseline timeout é bloqueante', isolated, async (t) => {
  const f = await fixture(t, { failure: 'timeout' });
  const result = await main(f.args());
  assert.equal(result.report.status, 'blocked_baseline');
  assert.equal(result.exitCode, 3);
  assert.ok(result.report.steps.some((s) => s.timeout));
});
test('sem alterações termina sem branch ou pending', isolated, async (t) => {
  const f = await fixture(t, { content: 'good' });
  const result = await main(f.args());
  assert.equal(result.report.status, 'no_changes', JSON.stringify(result.report));
  assert.equal(result.exitCode, 0);
  assert.equal((await git(f.root, ['branch', '--format=%(refname:short)'])).split('\n').length, 1);
});
test('dependências divergentes da referência bloqueiam reutilização', isolated, async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.root, 'package-lock.json'), '{"changed":true}');
  const result = await main(f.args());
  assert.equal(result.report.status, 'missing_dependencies');
  assert.equal(result.exitCode, 2);
});

test('índice alterado por gate bloqueia commit de arquivos indevidos', isolated, async (t) => {
  const f = await fixture(t, { failure: 'staged' });
  const before = await git(f.root, ['show-ref']);
  const result = await main(f.args());
  assert.equal(result.report.status, 'failed');
  assert.match(result.report.message, /índice Git/);
  assert.equal(await git(f.root, ['show-ref']), before);
});
test('gate que modifica o patch é descartado', isolated, async (t) => {
  const f = await fixture(t, { failure: 'mutating' });
  const before = await git(f.root, ['show-ref']);
  const result = await main(f.args());
  assert.equal(result.report.status, 'failed');
  assert.match(result.report.message, /alterou o patch/);
  assert.equal(await git(f.root, ['show-ref']), before);
});
test('trava de pid morto é recuperada, trava recente sem dono fica bloqueante', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maintenance-stale-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const lock = path.join(dir, 'lock');
  await mkdir(lock);
  await writeFile(path.join(lock, 'owner.json'), JSON.stringify({ pid: 2147483647 }));
  const release = await acquire(lock);
  await release();
  await mkdir(lock);
  await assert.rejects(acquire(lock), (e) => e.code === 'skipped_busy');
});
test('namespace de rede impede acesso externo de todos os filhos', isolated, async () => {
  const prefix = await networkPrefix(process.cwd());
  const result = await run(
    [
      ...prefix,
      'node',
      '-e',
      "fetch('http://192.0.2.1:9').then(()=>process.exit(7),()=>process.exit(0))",
    ],
    process.cwd(),
    5000
  );
  assert.equal(result.code, 0);
  assert.equal(result.timedOut, false);
});
test('patch integrado por squash é reconhecido e não bloqueia manutenção', isolated, async (t) => {
  const f = await fixture(t);
  const first = await main(f.args());
  assert.equal(first.report.status, 'validated_patch');
  await git(f.root, ['cherry-pick', '--no-commit', first.report.commit]);
  await git(f.root, [
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@localhost',
    'commit',
    '-qm',
    'squash integration',
  ]);
  const second = await main(f.args());
  assert.equal(second.report.status, 'no_changes', JSON.stringify(second.report));
});

test('TypeScript 7 sem API usa CLI isolada e valida o patch', isolated, async (t) => {
  const f = await fixture(t, { nativeTypes: true });
  const result = await main(f.args());
  assert.equal(result.report.status, 'validated_patch', JSON.stringify(result.report));
  assert.equal(result.report.doctor.coverage[0].method, 'cli');
  assert.equal(result.report.doctor.coverage[0].sourceFiles, 1);
});
test('TypeScript 7 com CLI sem arquivos bloqueia doctor', isolated, async (t) => {
  const f = await fixture(t, { nativeTypes: true, emptyTypes: true });
  const result = await main(f.args('doctor'));
  assert.equal(result.report.status, 'failed');
  assert.match(result.report.message, /vazio ou inválido/);
});

async function saveFixture(f) {
  await git(f.root, ['add', '.']);
  await git(f.root, [
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@localhost',
    'commit',
    '-qm',
    'fixture alterada',
  ]);
}
async function saveConfig(f) {
  await writeFile(f.configFile, JSON.stringify(f.config));
}
async function formatter(f, body) {
  await writeFile(path.join(f.root, 'node_modules/prettier/bin.mjs'), body);
}

for (const [name, body] of [
  ['crash de inicialização', `throw new Error('formatter fixture failed');`],
  ['exit 1 vazio', 'process.exit(1);'],
  [
    'lista misturada com diagnóstico',
    `console.log('src/value.ts');console.log('Error: invalid formatter');process.exit(1);`,
  ],
  [
    'diagnóstico em stderr',
    `console.log('src/value.ts');console.error('Error: invalid formatter');process.exit(1);`,
  ],
  ['exit 0 com lista contraditória', `console.log('src/value.ts');`],
])
  test(`scan Prettier rejeita ${name}`, isolated, async (t) => {
    const f = await fixture(t);
    await formatter(f, body);
    const result = await main(f.args());
    assert.equal(result.report.status, 'failed', JSON.stringify(result.report));
    assert.match(result.report.message, /lista válida|Gate.*scan/);
    assert.equal(await git(f.root, ['branch', '--format=%(refname:short)']), 'main');
  });

test(
  'check/heal validam tsconfig da ref e doctor continua validando checkout sujo',
  isolated,
  async (t) => {
    const f = await fixture(t);
    await writeFile(path.join(f.root, 'tsconfig.app.json'), '{"files":[]}');
    assert.equal((await main(f.args('check'))).report.status, 'checked');
    assert.equal((await main(f.args())).report.status, 'validated_patch');
    assert.equal((await main(f.args('doctor'))).report.status, 'failed');
    assert.equal(await readFile(path.join(f.root, 'tsconfig.app.json'), 'utf8'), '{"files":[]}');
  }
);

test('stdout e stderr preservam UTF8 partido entre eventos', async () => {
  const code = `process.stdout.write(Buffer.from([0xc3]));process.stderr.write(Buffer.from([0xf0,0x9f]));setTimeout(()=>{process.stdout.write(Buffer.from([0xa7]));process.stderr.write(Buffer.from([0x98,0x80]));},30);`;
  const result = await run(['node', '-e', code], process.cwd(), 1000);
  assert.equal(result.stdout, 'ç');
  assert.equal(result.stderr, '😀');
  assert.ok(!result.output.includes('\ufffd'));
});
test(
  'patch Git real com linha longa UTF8 é preservado na exportação e no commit',
  isolated,
  async (t) => {
    const text = 'ç'.repeat(90000),
      f = await fixture(t, { content: `bad${text}` });
    const result = await main(f.args());
    assert.equal(result.report.status, 'validated_patch', JSON.stringify(result.report));
    const patch = await readFile(result.report.patch, 'utf8');
    assert.ok(!patch.includes('\ufffd'));
    assert.ok(patch.includes(text));
    assert.equal(
      await git(f.root, ['show', `${result.report.commit}:src/value.ts`]),
      `export const value = 'good${text}';`
    );
  }
);

test('trava recovery abandonada também é recuperada e recovery de dono vivo permanece', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maintenance-recovery-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const lock = path.join(dir, 'lock');
  for (const name of [lock, `${lock}.recovery`]) {
    await mkdir(name);
    await writeFile(
      path.join(name, 'owner.json'),
      JSON.stringify({ pid: 2147483647, token: 'dead' })
    );
  }
  const release = await acquire(lock);
  await release();
  assert.equal(await exists(`${lock}.recovery`), false);
  await mkdir(`${lock}.recovery`);
  await writeFile(
    path.join(`${lock}.recovery`, 'owner.json'),
    JSON.stringify({ pid: process.pid, token: 'live' })
  );
  await assert.rejects(acquire(lock), (error) => error.code === 'skipped_busy');
  assert.equal(
    JSON.parse(await readFile(path.join(`${lock}.recovery`, 'owner.json'), 'utf8')).token,
    'live'
  );
});

test('recovery antiga sem dono é recuperada e token alheio impede limpeza', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maintenance-recovery-age-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const lock = path.join(dir, 'lock');
  await mkdir(`${lock}.recovery`);
  const old = new Date(Date.now() - 600000);
  await utimes(`${lock}.recovery`, old, old);
  const release = await acquire(lock);
  await writeFile(
    path.join(lock, 'owner.json'),
    JSON.stringify({ pid: process.pid, token: 'different-owner' })
  );
  await assert.rejects(release(), /Dono da trava mudou/);
  assert.equal(await exists(lock), true);
});

test('crash libera flock automaticamente e permite recuperar a trava de PID morto', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maintenance-lock-crash-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const lock = path.join(dir, 'lock');
  const child = spawn(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import {acquire} from ${JSON.stringify(new URL('./lib.mjs', import.meta.url).href)};await acquire(${JSON.stringify(lock)});console.log('ready');setInterval(()=>{},1000);`,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
  t.after(() => child.kill('SIGKILL'));
  await once(child.stdout, 'data');
  const closed = once(child, 'close');
  child.kill('SIGKILL');
  await closed;
  let release;
  for (let attempt = 0; attempt < 50 && !release; attempt++) {
    try {
      release = await acquire(lock);
    } catch (error) {
      if (error.code !== 'skipped_busy') throw error;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  assert.equal(typeof release, 'function');
  await release();
});

async function vendorFixture(t) {
  const f = await fixture(t),
    vendor = path.join(f.root, 'vendor/local-dep');
  await mkdir(vendor, { recursive: true });
  await writeFile(
    path.join(vendor, 'package.json'),
    JSON.stringify({ name: 'local-dep', version: '1.0.0', main: 'index.cjs' })
  );
  await writeFile(path.join(vendor, 'index.cjs'), "module.exports = 'base';\n");
  await writeFile(
    path.join(f.root, 'package.json'),
    JSON.stringify({
      name: 'fixture',
      type: 'module',
      dependencies: { 'local-dep': 'file:vendor/local-dep' },
    })
  );
  await writeFile(
    path.join(f.root, 'package-lock.json'),
    JSON.stringify({
      packages: { 'node_modules/local-dep': { resolved: 'vendor/local-dep', link: true } },
    })
  );
  await symlink('../vendor/local-dep', path.join(f.root, 'node_modules/local-dep'), 'dir');
  await saveFixture(f);
  return { ...f, vendor };
}
test(
  'dependência vendor por link idêntico é reutilizada sem instalar pacotes',
  isolated,
  async (t) => {
    const f = await vendorFixture(t);
    const result = await main(f.args());
    assert.equal(result.report.status, 'validated_patch', JSON.stringify(result.report));
    assert.equal(typeof result.report.dependencies.local['vendor/local-dep'], 'string');
  }
);
test(
  'vendor sujo e referência com vendor diferente bloqueiam antes dos gates',
  isolated,
  async (t) => {
    const f = await vendorFixture(t),
      base = await git(f.root, ['rev-parse', 'HEAD']);
    await writeFile(path.join(f.vendor, 'index.cjs'), "module.exports = 'modified';\n");
    const dirty = await main(f.args());
    assert.equal(dirty.report.status, 'missing_dependencies');
    assert.equal(dirty.report.steps.length, 0);
    await saveFixture(f);
    const args = f.args();
    args[args.indexOf('--ref') + 1] = base;
    const old = await main(args);
    assert.equal(old.report.status, 'missing_dependencies');
    assert.equal(old.report.steps.length, 0);
  }
);
test(
  'link instalado para outro vendor divergente e file externo são recusados',
  isolated,
  async (t) => {
    const f = await vendorFixture(t),
      outside = path.join(f.dir, 'other');
    await mkdir(outside);
    await writeFile(path.join(outside, 'package.json'), '{"name":"local-dep"}');
    await rm(path.join(f.root, 'node_modules/local-dep'));
    await symlink(outside, path.join(f.root, 'node_modules/local-dep'));
    const result = await main(f.args());
    assert.equal(result.report.status, 'missing_dependencies');
    await writeFile(
      path.join(f.root, 'package.json'),
      '{"dependencies":{"outside":"file:../other"}}'
    );
    await assert.rejects(dependencyFingerprint(f.root), /fora do repositório/);
  }
);
test(
  'mudança do vendor durante gate impede sucesso mesmo em check sem patch',
  isolated,
  async (t) => {
    const f = await vendorFixture(t);
    await writeFile(
      path.join(f.root, 'scripts/gate.mjs'),
      `import fs from 'node:fs';if(process.argv[2]==='build')fs.writeFileSync(${JSON.stringify(path.join(f.vendor, 'index.cjs'))}, 'modified during gate');`
    );
    await saveFixture(f);
    const result = await main(f.args('check'));
    assert.equal(result.report.status, 'failed');
    assert.match(result.report.message, /Dependências do clone mudaram/);
  }
);

for (const name of ['pre-commit', 'commit-msg'])
  test(`hook ${name} bloqueante impede commit validado`, isolated, async (t) => {
    const f = await fixture(t);
    await mkdir(path.join(f.root, '.husky'));
    await writeFile(path.join(f.root, '.husky', name), '#!/bin/sh\nexit 19\n');
    await saveFixture(f);
    const refs = await git(f.root, ['show-ref']);
    const result = await main(f.args());
    assert.equal(result.report.status, 'failed');
    assert.match(result.report.message, /Hook\/commit obrigatório/);
    assert.equal(await git(f.root, ['show-ref']), refs);
    assert.equal(await exists(path.join(f.root, '.husky/_')), false);
  });
test(
  'hooks versionados rodam offline sem .env/segredo e commit inclui escopo obrigatório',
  isolated,
  async (t) => {
    const f = await fixture(t, { trackedEnv: true });
    await mkdir(path.join(f.root, '.husky'));
    await writeFile(
      path.join(f.root, '.husky/pre-commit'),
      `#!/bin/sh\ntest "$HUSKY" != 0\ntest ! -e .env\ntest -z "\${MAINTENANCE_TEST_SECRET:-}"\nnode -e "fetch('http://192.0.2.1:9').then(()=>process.exit(7),()=>process.exit(0))"\necho hook-offline-validado\n`
    );
    await writeFile(
      path.join(f.root, '.husky/commit-msg'),
      `#!/bin/sh\ngrep -q '^style(manutencao): aplica correcoes locais verificadas$' "$1"\necho escopo-validado\n`
    );
    await saveFixture(f);
    await git(f.root, ['config', 'core.hooksPath', '.husky/_']);
    process.env.MAINTENANCE_TEST_SECRET = 'must-not-reach-hook';
    t.after(() => delete process.env.MAINTENANCE_TEST_SECRET);
    const result = await main(f.args());
    assert.equal(result.report.status, 'validated_patch', JSON.stringify(result.report));
    const hookLog = await readFile(
      path.join(path.dirname(result.report.reportFile), result.report.hooks.log),
      'utf8'
    );
    assert.deepEqual(result.report.hooks.names, ['pre-commit', 'commit-msg']);
    assert.match(hookLog, /hook-offline-validado/);
    assert.match(hookLog, /escopo-validado/);
    assert.equal(
      (await run(['git', 'config', '--get', 'core.hooksPath'], f.root)).stdout.trim(),
      '.husky/_'
    );
    assert.equal(
      await git(f.root, ['log', '-1', '--format=%s', result.report.commit]),
      'style(manutencao): aplica correcoes locais verificadas'
    );
  }
);
test(
  'hook que altera e adiciona o patch é rejeitado depois do commit isolado',
  isolated,
  async (t) => {
    const f = await fixture(t);
    await mkdir(path.join(f.root, '.husky'));
    await writeFile(
      path.join(f.root, '.husky/pre-commit'),
      `#!/bin/sh\necho 'changed by hook' > src/value.ts\ngit add src/value.ts\n`
    );
    await saveFixture(f);
    const refs = await git(f.root, ['show-ref']),
      result = await main(f.args());
    assert.equal(result.report.status, 'failed');
    assert.match(result.report.message, /Hook alterou o patch commitado/);
    assert.equal(await git(f.root, ['show-ref']), refs);
  }
);
test('hook que remove o escopo da mensagem não produz commit validado', isolated, async (t) => {
  const f = await fixture(t);
  await mkdir(path.join(f.root, '.husky'));
  await writeFile(
    path.join(f.root, '.husky/commit-msg'),
    `#!/bin/sh\nprintf 'style: mensagem sem escopo\\n' > "$1"\n`
  );
  await saveFixture(f);
  const refs = await git(f.root, ['show-ref']),
    result = await main(f.args());
  assert.equal(result.report.status, 'failed');
  assert.match(result.report.message, /mensagem obrigatória/);
  assert.equal(await git(f.root, ['show-ref']), refs);
});
test(
  'hook customizado instalado fora dos arquivos versionados não é ignorado',
  isolated,
  async (t) => {
    const f = await fixture(t);
    await mkdir(path.join(f.root, '.hooks'));
    await writeFile(path.join(f.root, '.gitignore'), 'node_modules/\ndist/\n.hooks/\n');
    await saveFixture(f);
    await writeFile(path.join(f.root, '.hooks/pre-commit'), '#!/bin/sh\nexit 24\n', {
      mode: 0o700,
    });
    await git(f.root, ['config', 'core.hooksPath', '.hooks']);
    const result = await main(f.args());
    assert.equal(result.report.status, 'failed');
    assert.match(result.report.message, /Hook\/commit obrigatório/);
    assert.deepEqual(result.report.hooks.names, ['pre-commit']);
  }
);
test('post-commit que altera a worktree também invalida o resultado', isolated, async (t) => {
  const f = await fixture(t);
  await mkdir(path.join(f.root, '.husky'));
  await writeFile(
    path.join(f.root, '.husky/post-commit'),
    '#!/bin/sh\necho hook-modified > src/value.ts\n'
  );
  await saveFixture(f);
  const result = await main(f.args());
  assert.equal(result.report.status, 'failed');
  assert.match(result.report.message, /Hook alterou a worktree/);
});

test(
  'NODE_ENV é escolhido por gate e variáveis privadas não chegam aos filhos',
  isolated,
  async (t) => {
    const f = await fixture(t);
    await writeFile(
      path.join(f.root, 'scripts/gate.mjs'),
      `const phase=process.argv[2];const expected=phase==='test'?'test':phase==='build'?'production':undefined;if(process.env.NODE_ENV!==expected||process.env.SECRET_KEY||process.env.VITE_SUPABASE_URL)process.exit(11);`
    );
    await saveFixture(f);
    process.env.NODE_ENV = 'development';
    process.env.SECRET_KEY = 'private-placeholder';
    process.env.VITE_SUPABASE_URL = 'https://production.invalid';
    t.after(() => {
      delete process.env.NODE_ENV;
      delete process.env.SECRET_KEY;
      delete process.env.VITE_SUPABASE_URL;
    });
    assert.equal((await main(f.args('check'))).report.status, 'checked');
  }
);
test(
  'ambiente público explícito aceita placeholders e rejeita secret/host de produção',
  isolated,
  async (t) => {
    const f = await fixture(t);
    f.config.gates.find((gate) => gate.name === 'build').env = {
      VITE_SUPABASE_URL: 'https://maintenance.invalid',
      VITE_SUPABASE_PROJECT_ID: 'maintenance_test',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_maintenance_test',
    };
    await saveConfig(f);
    await writeFile(
      path.join(f.root, 'scripts/gate.mjs'),
      `if(process.argv[2]==='build'&&(process.env.NODE_ENV!=='production'||process.env.VITE_SUPABASE_URL!=='https://maintenance.invalid'||process.env.VITE_SUPABASE_PROJECT_ID!=='maintenance_test'||process.env.VITE_SUPABASE_PUBLISHABLE_KEY!=='sb_publishable_maintenance_test'))process.exit(12);`
    );
    await saveFixture(f);
    assert.equal((await main(f.args('check'))).report.status, 'checked');
    for (const env of [
      { SECRET_KEY: 'fixture' },
      { NODE_ENV: 'test' },
      { VITE_SUPABASE_URL: 'https://production.supabase.co' },
      { VITE_SUPABASE_PROJECT_ID: 'abcdefghijklmnopqrst' },
      { VITE_SUPABASE_ANON_KEY: 'eyJ.production.token' },
    ]) {
      const copy = structuredClone(f.config);
      copy.gates[3].env = env;
      assert.throws(() => validateConfig(copy));
    }
    const alternate = structuredClone(f.config);
    alternate.gates[3].env.VITE_SUPABASE_PROJECT_ID = 'test_fixture';
    assert.doesNotThrow(() => validateConfig(alternate));
    const invalidExclude = structuredClone(f.config);
    invalidExclude.fix.exclude = ['src/**/*.ts'];
    assert.throws(() => validateConfig(invalidExclude), /sem globs/);
  }
);

const genericFormatter = `import fs from 'node:fs';const args=process.argv.slice(2),files=args.slice(args.indexOf('--')+1);if(args.includes('--list-different')){const bad=files.filter(f=>fs.readFileSync(f,'utf8').includes('bad'));if(bad.length)console.log(bad.join('\\n'));process.exit(bad.length?1:0);}const file=args.at(-1);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('bad','good'));`;
test(
  'generated e types.ts ficam fora de candidatos e alterações laterais são rejeitadas',
  isolated,
  async (t) => {
    const f = await fixture(t);
    await formatter(f, genericFormatter);
    await mkdir(path.join(f.root, 'src/integrations/supabase'), { recursive: true });
    await writeFile(
      path.join(f.root, 'src/integrations/supabase/types.ts'),
      "export const generated = 'bad';\n"
    );
    await writeFile(
      path.join(f.root, 'src/auto.ts'),
      "// @generated DO NOT EDIT\nexport const generated = 'bad';\n"
    );
    await writeFile(
      path.join(f.root, 'src/component.generated.ts'),
      "export const generated = 'bad';\n"
    );
    await writeFile(path.join(f.root, 'src/excluded.ts'), "export const excluded = 'bad';\n");
    f.config.fix.exclude = ['src/excluded.ts'];
    await saveConfig(f);
    await saveFixture(f);
    const result = await main(f.args());
    assert.equal(result.report.status, 'validated_patch', JSON.stringify(result.report));
    assert.deepEqual(result.report.scope.selected, ['src/value.ts']);
    for (const file of [
      'src/auto.ts',
      'src/component.generated.ts',
      'src/excluded.ts',
      'src/integrations/supabase/types.ts',
    ])
      assert.match(await git(f.root, ['show', `${result.report.commit}:${file}`]), /bad/);
    const second = await fixture(t);
    await mkdir(path.join(second.root, 'src/integrations/supabase'), { recursive: true });
    await writeFile(
      path.join(second.root, 'src/integrations/supabase/types.ts'),
      "// generated\nexport const x = 'bad';\n"
    );
    await saveFixture(second);
    await formatter(
      second,
      genericFormatter + "fs.writeFileSync('src/integrations/supabase/types.ts','changed');"
    );
    const rejected = await main(second.args());
    assert.equal(rejected.report.status, 'failed');
    assert.match(rejected.report.message, /gerado ou excluído/);
  }
);
test('formatter não pode mudar permissões ou remover arquivos rastreados', isolated, async (t) => {
  const f = await fixture(t);
  await formatter(f, genericFormatter + 'fs.chmodSync(file,0o755);');
  const result = await main(f.args());
  assert.equal(result.report.status, 'failed');
  assert.match(result.report.message, /modo\/tipo/);
});

async function fakeEslint(f) {
  const parser = path.join(f.root, 'node_modules/typescript-eslint');
  await mkdir(parser);
  await writeFile(
    path.join(parser, 'package.json'),
    '{"name":"typescript-eslint","main":"index.cjs"}'
  );
  await writeFile(path.join(parser, 'index.cjs'), 'module.exports={parser:{}};');
  const bin = path.join(f.root, 'node_modules/eslint/bin');
  await mkdir(bin);
  await writeFile(
    path.join(bin, 'eslint.js'),
    `import fs from 'node:fs';import path from 'node:path';const args=process.argv.slice(2);if(!args.includes('--no-inline-config'))process.exit(23);let files=args.includes('--')?args.slice(args.indexOf('--')+1):args.includes('--fix')?[args.at(-1)]:fs.readdirSync('src').filter(f=>f.endsWith('.ts')).map(f=>'src/'+f);if(args.includes('--fix-dry-run')){console.log(JSON.stringify(files.map(f=>{const text=fs.readFileSync(f,'utf8');return {filePath:path.resolve(f),messages:[],fatalErrorCount:0,...(text.includes('bad')?{output:text.replaceAll('bad','good')}:{})};})));}else{for(const f of files)fs.writeFileSync(f,fs.readFileSync(f,'utf8').replaceAll('bad','good'));}`
  );
  f.config.fix.prettier = false;
  f.config.fix.eslintRules = ['semi'];
  await saveConfig(f);
}
test('ESLint não aceita diretivas inline para regras fora da allowlist', isolated, async (t) => {
  const f = await fixture(t);
  await fakeEslint(f);
  await writeFile(
    path.join(f.root, 'src/value.ts'),
    "/* eslint no-unused-vars: error */\nexport const value = 'bad';\n"
  );
  await saveFixture(f);
  const result = await main(f.args());
  assert.equal(result.report.status, 'validated_patch', JSON.stringify(result.report));
  assert.match(
    await git(f.root, ['show', `${result.report.commit}:src/value.ts`]),
    /eslint no-unused-vars.*\nexport const value = 'good'/
  );
});
test(
  'scans ESLint em lotes cabem em 4MB e orçamento de 20 arquivos continua global',
  isolated,
  async (t) => {
    const f = await fixture(t);
    await fakeEslint(f);
    for (let i = 0; i < 39; i++)
      await writeFile(
        path.join(f.root, `src/batch-${String(i).padStart(2, '0')}.ts`),
        `// ${'x'.repeat(150000)}\nexport const value = 'bad';\n`
      );
    await saveFixture(f);
    const result = await main(f.args());
    assert.equal(result.report.status, 'validated_patch', JSON.stringify(result.report));
    assert.equal(result.report.scope.candidates, 40);
    assert.equal(result.report.scope.selected.length, 20);
    assert.equal(result.report.scope.skippedBudget.length, 20);
    assert.equal(result.report.steps.filter((step) => step.phase === 'scan').length, 3);
    assert.ok(result.report.change.lines <= 400);
  }
);

test('API TypeScript rejeita cada projeto vazio mesmo com outro projeto válido', async (t) => {
  const f = await fixture(t);
  await writeFile(
    path.join(f.root, 'tsconfig.json'),
    JSON.stringify({ files: [], references: [{ path: './tsconfig.app.json' }] })
  );
  await assert.rejects(
    inspect(f.root, { ...f.config, tsconfigs: ['tsconfig.app.json', 'tsconfig.json'] }),
    /Projeto TypeScript vazio ou inválido: tsconfig.json/
  );
});

test('leitura vendor rejeita symlink trocado após inspeção sem seguir seu alvo', async (t) => {
  const f = await fixture(t),
    file = path.join(f.root, 'src/value.ts');
  const expected = await lstat(file),
    outside = path.join(f.dir, 'outside.ts');
  await writeFile(outside, 'outside fixture');
  await rm(file);
  await symlink(outside, file);
  await assert.rejects(
    readRegularDependency(file, expected),
    (e) => e.code === 'missing_dependencies'
  );
  assert.equal(await readFile(outside, 'utf8'), 'outside fixture');
});

test('leitura vendor vincula validação e bytes ao mesmo inode', async (t) => {
  const f = await fixture(t),
    file = path.join(f.root, 'src/value.ts');
  const expected = await lstat(file),
    replacement = path.join(f.dir, 'replacement.ts');
  await writeFile(replacement, 'replacement fixture');
  await rename(replacement, file);
  await assert.rejects(readRegularDependency(file, expected), /substituído durante a inspeção/);
});

// ---- Endurecimento: run.sh, guarda de CLI, typecheck, config, pending, sinais, gitleaks, redação ----
const here = path.dirname(new URL(import.meta.url).pathname);
const cliEnv = (extra = {}) => {
  const env = { ...process.env, ...extra };
  delete env.GITHUB_TOKEN;
  delete env.GH_TOKEN;
  return env;
};
async function exec(command, args, { env = cliEnv(), cwd = here } = {}) {
  const child = spawn(command, args, { env, cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '',
    stderr = '';
  child.stdout.on('data', (d) => (stdout += d));
  child.stderr.on('data', (d) => (stderr += d));
  const [code] = await once(child, 'close');
  return { code, stdout, stderr };
}
async function copiaComEspaco(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maintenance-cópia com espaço-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const name of ['run.sh', 'run.mjs', 'lib.mjs', 'typecheck.mjs', 'config.json'])
    await writeFile(path.join(dir, name), await readFile(path.join(here, name)));
  return dir;
}

test('run.sh sem HOME falha em JSON com exit 1, nunca 2 nem sem mensagem', async (t) => {
  const env = cliEnv();
  delete env.HOME;
  const r = await exec('sh', [path.join(here, 'run.sh'), 'doctor'], { env });
  assert.equal(r.code, 1, r.stderr);
  assert.equal(JSON.parse(r.stdout).status, 'failed');
  assert.match(JSON.parse(r.stdout).message, /HOME/);
});
test('run.sh com HOME vazio não cria estado na raiz do sistema', async () => {
  const r = await exec('sh', [path.join(here, 'run.sh'), 'doctor'], { env: cliEnv({ HOME: '' }) });
  assert.equal(r.code, 1, r.stderr);
  assert.match(JSON.parse(r.stdout).message, /HOME/);
});
test('run.sh com diretório de trava impossível falha em JSON', async () => {
  const r = await exec('sh', [path.join(here, 'run.sh'), 'doctor'], {
    env: cliEnv({ HOME: '/proc/inexistente-maintenance' }),
  });
  assert.equal(r.code, 1);
  assert.match(JSON.parse(r.stdout).message, /trava global/);
});
test('run.sh sem node no PATH falha em JSON em vez de exit 127', async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'maintenance-home-')),
    bin = await mkdtemp(path.join(os.tmpdir(), 'maintenance-bin-'));
  t.after(() => Promise.all([home, bin].map((d) => rm(d, { recursive: true, force: true }))));
  for (const tool of ['mkdir', 'chmod', 'flock', 'dirname']) {
    const found = (await exec('sh', ['-c', `command -v ${tool}`])).stdout.trim();
    await symlink(found, path.join(bin, tool));
  }
  const r = await exec('/bin/sh', [path.join(here, 'run.sh'), 'doctor'], {
    env: cliEnv({ HOME: home, PATH: bin }),
  });
  assert.equal(r.code, 1, r.stderr);
  assert.match(JSON.parse(r.stdout).message, /node/);
});
test('run.sh em caminho com espaço/acento propaga argumentos e exit code do node', async (t) => {
  const dir = await copiaComEspaco(t),
    home = await mkdtemp(path.join(os.tmpdir(), 'maintenance-home-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  const r = await exec('sh', [path.join(dir, 'run.sh'), 'doctor', '--root'], {
    env: cliEnv({ HOME: home }),
  });
  assert.equal(r.code, 1);
  assert.match(JSON.parse(r.stdout).message, /Argumento desconhecido, duplicado ou sem valor/);
  const bare = await exec('sh', [path.join(dir, 'run.sh')], { env: cliEnv({ HOME: home }) });
  assert.equal(bare.code, 1);
  assert.match(JSON.parse(bare.stdout).message, /Use doctor, check ou heal/);
});
test('run.sh devolve 75 com trava global ocupada', async (t) => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'maintenance-home-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  const state = path.join(home, '.cache/repo-maintenance');
  await mkdir(state, { recursive: true });
  const holder = spawn('flock', [path.join(state, 'fleet.lock'), 'sleep', '30'], {
    stdio: 'ignore',
  });
  t.after(() => holder.kill('SIGKILL'));
  await new Promise((resolve) => setTimeout(resolve, 300));
  const r = await exec('sh', [path.join(here, 'run.sh'), 'doctor'], {
    env: cliEnv({ HOME: home }),
  });
  assert.equal(r.code, 75, r.stderr);
  assert.equal(JSON.parse(r.stdout).status, 'skipped_busy');
});

test('run.mjs chamado por symlink ou caminho com espaço executa em vez de sair 0 calado', async (t) => {
  const dir = await copiaComEspaco(t),
    link = path.join(dir, 'link-para-cópia');
  await symlink(dir, link);
  for (const entry of [path.join(dir, 'run.mjs'), path.join(link, 'run.mjs')]) {
    const r = await exec(process.execPath, [entry], { env: cliEnv({ HOME: dir }) });
    assert.equal(r.code, 1, `${entry}: ${r.stdout}${r.stderr}`);
    assert.match(JSON.parse(r.stdout).message, /Use doctor, check ou heal/);
  }
});

test('parseArgs recusa flag vazia, sem valor, duplicada, desconhecida e posicional', () => {
  const casos = [
    ['check', '--root', '/x', '--ref'],
    ['check', '--root', '', '--ref', 'main'],
    ['check', '--root', '/x', '--ref', '--config'],
    ['check', '--root', '/x', '--ref', 'a', '--ref', 'b'],
    ['check', '--root=/x', '--ref', 'main'],
    ['check', '--root', '/x', '--ref', 'main', '--dryrun', 'yes'],
    ['check', 'extra', '--root', '/x', '--ref', 'main'],
    ['', '--root', '/x'],
    [],
  ];
  for (const argv of casos)
    assert.throws(() => parseArgs(argv), /Argumento|Use doctor|--root/, argv.join(' '));
});

test('validateConfig devolve erro acionável (não TypeError) para tipos errados', async () => {
  const base = JSON.parse(await readFile(path.join(here, 'config.json'), 'utf8'));
  const variantes = {
    'gate nulo': (c) => (c.gates[0] = null),
    'gate array': (c) => (c.gates[0] = []),
    'raiz numérica': (c) => (c.fix.roots = [1]),
    'raiz nula': (c) => (c.fix.roots = [null]),
    'raiz com barra final': (c) => (c.fix.roots = ['src/']),
    'raiz com ponto': (c) => (c.fix.roots = ['src/./x']),
    'raiz com barra dupla': (c) => (c.fix.roots = ['src//x']),
  };
  for (const [nome, mutar] of Object.entries(variantes)) {
    const c = JSON.parse(JSON.stringify(base));
    mutar(c);
    assert.throws(
      () => validateConfig(c),
      (e) => e.code === 'failed' && e.constructor.name === 'MaintenanceError',
      nome
    );
  }
  assert.doesNotThrow(() => validateConfig(JSON.parse(JSON.stringify(base))));
  const exemplo = JSON.parse(await readFile(path.join(here, 'config.example.json'), 'utf8'));
  assert.doesNotThrow(() => validateConfig(exemplo));
});

test('mensagens de erro de entrada dizem a causa (ref, root, config, git)', async (t) => {
  const f = await fixture(t);
  const falha = async (argv) => (await main(argv)).report;
  const [, ...resto] = f.args('check');
  const com = (troca) => {
    const a = ['check', ...resto];
    for (const [k, v] of Object.entries(troca)) a[a.indexOf(k) + 1] = v;
    return a;
  };
  let r = await falha(com({ '--ref': 'origin/main' }));
  assert.equal(r.status, 'failed');
  assert.match(r.message, /Referência origin\/main não resolve para um commit/);
  r = await falha(com({ '--root': path.join(f.dir, 'nao-existe') }));
  assert.match(r.message, /--root inexistente/);
  r = await falha(com({ '--root': f.dir }));
  assert.match(r.message, /not a git repository/);
  r = await falha(com({ '--config': path.join(f.dir, 'nao-existe.json') }));
  assert.match(r.message, /Não foi possível ler a configuração .*nao-existe\.json: ENOENT/);
  await writeFile(path.join(f.dir, 'quebrado.json'), '{oops');
  r = await falha(com({ '--config': path.join(f.dir, 'quebrado.json') }));
  assert.match(r.message, /Configuração não é JSON válido/);
});
test('--root via symlink é aceito e resolve para a raiz real', isolated, async (t) => {
  const f = await fixture(t);
  const link = path.join(f.dir, 'link-repo');
  await symlink(f.root, link);
  const r = await main(f.args('check').map((v) => (v === f.root ? link : v)));
  assert.equal(r.report.status, 'checked', JSON.stringify(r.report));
  assert.equal(r.report.root, await (await import('node:fs/promises')).realpath(f.root));
});
test('XDG_STATE_HOME relativo é ignorado (estado não depende do cwd)', async (t) => {
  const f = await fixture(t);
  const home = await mkdtemp(path.join(os.tmpdir(), 'maintenance-xdg-')),
    antes = process.cwd(),
    env = { HOME: process.env.HOME, XDG: process.env.XDG_STATE_HOME };
  t.after(async () => {
    process.chdir(antes);
    process.env.HOME = env.HOME;
    if (env.XDG === undefined) delete process.env.XDG_STATE_HOME;
    else process.env.XDG_STATE_HOME = env.XDG;
    await rm(home, { recursive: true, force: true });
  });
  process.chdir(home);
  process.env.HOME = home;
  process.env.XDG_STATE_HOME = 'estado-relativo';
  const args = f.args('doctor');
  args.splice(args.indexOf('--state'), 2);
  const r = await main(args);
  assert.equal(r.report.status, 'healthy', JSON.stringify(r.report));
  assert.ok(r.report.reportFile.startsWith(path.join(home, '.local/state/repo-maintenance')));
  assert.equal(await exists(path.join(home, 'estado-relativo')), false);
});

test(
  'fix.roots sem nenhum arquivo rastreado falha em vez de aprovar por vacuidade',
  isolated,
  async (t) => {
    const f = await fixture(t);
    f.config.fix.roots = ['src/inexistente'];
    await saveConfig(f);
    const r = await main(f.args());
    assert.equal(r.report.status, 'failed', JSON.stringify(r.report));
    assert.match(r.report.message, /Nenhum arquivo rastreado em fix\.roots/);
    await assert.rejects(allowedSourceFiles(f.root, f.config), /Nenhum arquivo rastreado/);
  }
);
test('detecção de arquivo gerado é linear e continua reconhecendo cabeçalhos', async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.root, 'src/vazio.ts'), '\n'.repeat(60000) + 'export const a = 1;\n');
  await writeFile(path.join(f.root, 'src/gen-crlf.ts'), '\r\n\r\n  // Generated by tool\r\nx\r\n');
  await writeFile(path.join(f.root, 'src/gen-meio.ts'), 'x\n\n\n   /* do not edit */\n');
  await writeFile(path.join(f.root, 'src/normal.ts'), 'const generated = 1; // ok\n');
  await git(f.root, ['add', '.']);
  const inicio = Date.now();
  const allowed = await allowedSourceFiles(f.root, f.config);
  assert.ok(Date.now() - inicio < 1500, `lento: ${Date.now() - inicio}ms`);
  assert.ok(
    allowed.has('src/vazio.ts') && allowed.has('src/normal.ts') && allowed.has('src/value.ts')
  );
  assert.ok(!allowed.has('src/gen-crlf.ts') && !allowed.has('src/gen-meio.ts'));
});

test(
  'pending cuja branch foi removida pelo dono não bloqueia o heal para sempre',
  isolated,
  async (t) => {
    const f = await fixture(t);
    const first = await main(f.args());
    assert.equal(first.report.status, 'validated_patch', JSON.stringify(first.report));
    const blocked = await main(f.args());
    assert.equal(blocked.report.status, 'pending_patch');
    assert.match(blocked.report.message, /manifesto .*pending\.json/);
    await git(f.root, ['branch', '-D', first.report.branch]);
    const second = await main(f.args());
    assert.equal(second.report.status, 'validated_patch', JSON.stringify(second.report));
    assert.notEqual(second.report.commit, first.report.commit);
    const stateDir = path.join(f.state, (await readdir(f.state))[0]);
    assert.equal(
      await exists(path.join(stateDir, 'discarded', `${first.report.commit}.json`)),
      true
    );
    assert.equal(await exists(first.report.patch), true);
  }
);
test(
  'pending com branch viva e manifesto inválido continuam bloqueando/falhando',
  isolated,
  async (t) => {
    const f = await fixture(t);
    const first = await main(f.args());
    assert.equal((await main(f.args())).report.status, 'pending_patch');
    assert.equal(
      await git(f.root, ['rev-parse', '--verify', first.report.branch]),
      first.report.commit
    );
    const stateDir = path.join(f.state, (await readdir(f.state))[0]);
    await writeFile(path.join(stateDir, 'pending.json'), '{"commit":"x"}');
    const r = await main(f.args());
    assert.equal(r.report.status, 'failed');
    assert.match(r.report.message, /Manifesto de patch pendente inválido/);
    assert.equal(await exists(path.join(stateDir, 'pending.json')), true);
  }
);

test(
  'SIGTERM durante gate é falha por sinal, não blocked_baseline, e limpa a worktree',
  isolated,
  async (t) => {
    const f = await fixture(t, { failure: 'timeout' });
    f.config.timeoutMs = 20000;
    await saveConfig(f);
    const child = spawn(process.execPath, [path.join(here, 'run.mjs'), ...f.args('heal')], {
      env: cliEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    t.after(() => child.kill('SIGKILL'));
    let stdout = '';
    child.stdout.on('data', (d) => (stdout += d));
    const closed = once(child, 'close');
    const logs = async () => {
      const root = path.join(
        f.state,
        ...(await readdir(f.state).catch(() => [])).slice(0, 1),
        'runs'
      );
      const runs = await readdir(root).catch(() => []);
      return runs.length ? readdir(path.join(root, runs[0])).catch(() => []) : [];
    };
    for (let i = 0; i < 200 && !(await logs()).includes('1-baseline-types.log'); i++)
      await new Promise((resolve) => setTimeout(resolve, 50));
    await new Promise((resolve) => setTimeout(resolve, 300));
    child.kill('SIGTERM');
    const [code] = await closed;
    const report = JSON.parse(stdout);
    assert.equal(report.status, 'failed', stdout);
    assert.match(report.message, /interrompida por sinal/);
    assert.equal(code, 1);
    assert.equal(
      (await git(f.root, ['worktree', 'list', '--porcelain'])).match(/worktree /g).length,
      1
    );
    assert.equal(await git(f.root, ['branch', '--format=%(refname:short)']), 'main');
  }
);

async function fakeGitleaks(t, exitCode = 0) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maintenance-gitleaks-'));
  const args = path.join(dir, 'args.txt');
  await writeFile(
    path.join(dir, 'gitleaks'),
    `#!/bin/sh\nprintf '%s\\n' "$@" > '${args}'\nprev=''; for a in "$@"; do if [ "$prev" = '--baseline-path' ] && [ ! -f "$a" ]; then echo 'baseline ausente' >&2; exit 9; fi; prev="$a"; done\nexit ${exitCode}\n`,
    { mode: 0o755 }
  );
  const antes = process.env.PATH;
  process.env.PATH = `${dir}:${antes}`;
  t.after(async () => {
    process.env.PATH = antes;
    await rm(dir, { recursive: true, force: true });
  });
  return args;
}
test(
  'gitleaks sem .gitleaks-baseline.json no repo não recebe --baseline-path',
  isolated,
  async (t) => {
    const args = await fakeGitleaks(t);
    const f = await fixture(t);
    const r = await main(f.args());
    assert.equal(r.report.status, 'validated_patch', JSON.stringify(r.report));
    const recebido = (await readFile(args, 'utf8')).split('\n');
    assert.deepEqual(recebido.slice(0, 3), ['git', '--staged', '--no-banner']);
    assert.ok(!recebido.includes('--baseline-path'));
  }
);
test(
  'gitleaks com baseline versionado recebe --baseline-path e reprovação bloqueia',
  isolated,
  async (t) => {
    const args = await fakeGitleaks(t);
    const f = await fixture(t);
    await writeFile(path.join(f.root, '.gitleaks-baseline.json'), '[]');
    await saveFixture(f);
    const ok = await main(f.args());
    assert.equal(ok.report.status, 'validated_patch', JSON.stringify(ok.report));
    assert.ok((await readFile(args, 'utf8')).includes('.gitleaks-baseline.json'));
    const reprovado = await fixture(t);
    const bin = await fakeGitleaks(t, 1);
    const r = await main(reprovado.args());
    assert.equal(r.report.status, 'failed');
    assert.match(r.report.message, /gitleaks/);
    assert.equal(await git(reprovado.root, ['branch', '--format=%(refname:short)']), 'main');
    assert.ok(await exists(bin));
  }
);

test('segredos em saída de gate são redigidos no relatório e no log', isolated, async (t) => {
  const f = await fixture(t);
  await writeFile(
    path.join(f.root, 'scripts/gate.mjs'),
    `console.error('Error: postgres://app:S3cr3tPw@db.example:5432/x Authorization: Basic dXNlcjpwYXNz sbp${'_'}0123456789abcdef0123456789 ok');process.exit(21);\n`
  );
  await saveFixture(f);
  const r = await main(f.args());
  assert.equal(r.report.status, 'blocked_baseline', JSON.stringify(r.report));
  const visto =
    JSON.stringify(r.report) +
    (await readFile(path.join(path.dirname(r.report.reportFile), r.report.steps[0].log), 'utf8'));
  for (const segredo of ['S3cr3tPw', 'dXNlcjpwYXNz', 'sbp_0123456789'])
    assert.ok(!visto.includes(segredo), `vazou ${segredo}`);
  assert.match(visto, /postgres:\/\/\[REDIGIDO\]@db\.example/);
  assert.match(r.report.steps[0].diagnostics[0], /Error: /);
});

const typescriptReal = (() => {
  try {
    return path.dirname(createRequire(import.meta.url).resolve('typescript/package.json'));
  } catch {
    return null;
  }
})();
async function projetoTs(t, arquivos) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maintenance-tsc com espaço-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'src'));
  await mkdir(path.join(dir, 'node_modules'));
  await symlink(typescriptReal, path.join(dir, 'node_modules/typescript'));
  await writeFile(path.join(dir, 'package.json'), '{"name":"p"}');
  for (const [nome, conteudo] of Object.entries(arquivos))
    await writeFile(path.join(dir, nome), conteudo);
  return dir;
}
const tsc = { skip: !typescriptReal && 'typescript indisponível' };
test(
  'typecheck.mjs: projeto válido passa e erro de tipo reprova com o diagnóstico',
  tsc,
  async (t) => {
    const dir = await projetoTs(t, {
      'src/ok.ts': 'export const a: number = 1;\n',
      'src/err.ts': 'export const b: number = "x";\n',
      'ok.json': '{"compilerOptions":{"strict":true,"noEmit":true},"include":["src/ok.ts"]}',
      'err.json': '{"compilerOptions":{"strict":true,"noEmit":true},"include":["src/err.ts"]}',
    });
    const script = path.join(here, 'typecheck.mjs');
    assert.equal((await exec(process.execPath, [script, 'ok.json'], { cwd: dir })).code, 0);
    const bad = await exec(process.execPath, [script, 'ok.json', 'err.json'], { cwd: dir });
    assert.notEqual(bad.code, 0);
    assert.match(bad.stdout + bad.stderr, /error TS2322/);
  }
);
test(
  'typecheck.mjs: config inválida/ausente nunca vira verde e explica a causa',
  tsc,
  async (t) => {
    const dir = await projetoTs(t, {
      'src/ok.ts': 'export const a: number = 1;\n',
      'quebrado.json': '{"compilerOptions":{"strict":true,',
      'vazio.json': '{"compilerOptions":{"strict":true},"include":["nada"]}',
      'opcao.json': '{"compilerOptions":{"bogusOption":true},"include":["src/ok.ts"]}',
      'extends.json': '{"extends":"./nope.json","include":["src"]}',
    });
    const script = path.join(here, 'typecheck.mjs');
    for (const [config, causa] of [
      ['quebrado.json', /Não foi possível ler o projeto TypeScript quebrado\.json: .+/],
      ['inexistente.json', /Não foi possível ler o projeto TypeScript inexistente\.json/],
      ['vazio.json', /vazio ou inválido: vazio\.json \(No inputs were found/],
      ['opcao.json', /vazio ou inválido: opcao\.json \(Unknown compiler option/],
      ['extends.json', /vazio ou inválido: extends\.json \(Cannot read file/],
    ]) {
      const r = await exec(process.execPath, [script, config], { cwd: dir });
      assert.equal(r.code, 1, `${config}: ${r.stdout}${r.stderr}`);
      assert.match(r.stderr, causa, config);
    }
  }
);
test('typecheck.mjs: argumentos inválidos e typescript ausente falham sem stack trace', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'maintenance-tsc-vazio-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(path.join(dir, 'package.json'), '{"name":"p"}');
  const script = path.join(here, 'typecheck.mjs');
  for (const argv of [[], ['/abs.json'], ['-p'], ['../fora.json']]) {
    const r = await exec(process.execPath, [script, ...argv], { cwd: dir });
    assert.equal(r.code, 1);
    assert.match(r.stderr, /Projetos TypeScript explícitos obrigatórios/);
  }
  await mkdir(path.join(dir, 'node_modules/typescript'), { recursive: true });
  await writeFile(
    path.join(dir, 'node_modules/typescript/package.json'),
    '{"name":"typescript","main":"nao-existe.js"}'
  );
  const r = await exec(process.execPath, [script, 'tsconfig.json'], { cwd: dir });
  assert.equal(r.code, 1);
  assert.match(r.stderr, /Cannot find module|Não foi possível carregar o TypeScript/);
  assert.ok(!/\n\s+at /.test(r.stderr), r.stderr);
});
