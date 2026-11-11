// listar-specs-quarentena.ts de ponta a ponta, num repositório git temporário com
// configs Playwright falsos (objetos simples — o script só lê testMatch/testIgnore).
// O script roda em Bun, como no ci.yml; sem `bun` no PATH os cenários são pulados.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'listar-specs-quarentena.ts');
const TEM_BUN = spawnSync('bun', ['--version'], { encoding: 'utf8' }).status === 0;
const opcoes = { skip: TEM_BUN ? false : 'bun não está no PATH' };

const ENV_GIT = {
  PATH: process.env.PATH,
  HOME: tmpdir(),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_AUTHOR_NAME: 't',
  GIT_AUTHOR_EMAIL: 't@exemplo.invalid',
  GIT_COMMITTER_NAME: 't',
  GIT_COMMITTER_EMAIL: 't@exemplo.invalid',
};

const SPECS = ['e2e/auth/login.e2e.ts', 'e2e/auth/logout-real.e2e.ts', 'e2e/financeiro/contas.e2e.ts', 'e2e/financeiro/fluxo/caixa.e2e.ts', 'e2e/legado.e2e.ts', 'e2e/outro-legado.e2e.ts'];
const CONFIGS = {
  'playwright.critical.config.ts': "export default { testDir: './e2e', testMatch: ['**/auth/login.e2e.ts'], testIgnore: ['**/auth/logout-real.e2e.ts'] };\n",
  'playwright.destructive.config.ts': "export default { testMatch: '**/auth/logout-real.e2e.ts' };\n",
  'playwright.financeiro.config.ts': "export default { testMatch: ['e2e/financeiro/**/*.e2e.ts'] };\n",
};

function repo({ specs = SPECS, configs = {}, extras = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'quarentena e2e-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, env: ENV_GIT, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  const escrever = (nome, texto) => {
    mkdirSync(dirname(join(dir, nome)), { recursive: true });
    writeFileSync(join(dir, nome), texto);
  };
  git('init', '-q', '-b', 'main');
  for (const spec of specs) escrever(spec, '// spec\n');
  for (const [nome, texto] of Object.entries({ ...CONFIGS, ...configs, ...extras })) if (texto !== null) escrever(nome, texto);
  git('add', '-A');
  git('commit', '-q', '-m', 'base', '--allow-empty');
  const rodar = () => spawnSync('bun', ['run', SCRIPT], { cwd: dir, encoding: 'utf8', env: ENV_GIT, timeout: 60_000 });
  return { dir, git, escrever, rodar, limpar: () => rmSync(dir, { recursive: true, force: true }) };
}

function comRepo(opts, fn) {
  const r = repo(opts);
  try {
    return fn(r);
  } finally {
    r.limpar();
  }
}

test('quarentena = specs fora de todo gate bloqueante; stdout só com a lista, ordenada', opcoes, () => comRepo({}, (r) => {
  const s = r.rodar();
  assert.equal(s.status, 0, s.stderr);
  assert.equal(s.stdout, 'e2e/legado.e2e.ts\ne2e/outro-legado.e2e.ts\n');
  assert.match(s.stderr, /\[gate\] playwright\.critical\.config\.ts: 1 spec\(s\)/);
  assert.match(s.stderr, /\[gate\] playwright\.financeiro\.config\.ts: 2 spec\(s\)/, '** atravessa subpastas');
  assert.match(s.stderr, /\[quarentena\] 2 de 6 spec\(s\) fora dos gates bloqueantes/);
  assert.equal(r.rodar().stdout, s.stdout, 'idempotente');
}));

test('spec tirada de um gate volta para a quarentena (o motivo de a lista ser derivada)', opcoes, () => comRepo({
  configs: { 'playwright.financeiro.config.ts': "export default { testMatch: ['**/financeiro/contas.e2e.ts'] };\n" },
}, (r) => {
  const s = r.rodar();
  assert.equal(s.status, 0, s.stderr);
  assert.equal(s.stdout, 'e2e/financeiro/fluxo/caixa.e2e.ts\ne2e/legado.e2e.ts\ne2e/outro-legado.e2e.ts\n');
}));

test('testIgnore do config tira a spec da cobertura daquele gate', opcoes, () => comRepo({
  configs: { 'playwright.financeiro.config.ts': "export default { testMatch: ['**/financeiro/**/*.e2e.ts'], testIgnore: /fluxo\\// };\n" },
}, (r) => {
  assert.match(r.rodar().stdout, /^e2e\/financeiro\/fluxo\/caixa\.e2e\.ts\n/);
}));

test('testMatch como RegExp com flag g não oscila entre chamadas (lastIndex)', opcoes, () => comRepo({
  configs: { 'playwright.financeiro.config.ts': 'export default { testMatch: /financeiro\\/.*\\.e2e\\.ts$/g };\n' },
}, (r) => {
  const s = r.rodar();
  assert.equal(s.status, 0, s.stderr);
  assert.match(s.stderr, /playwright\.financeiro\.config\.ts: 2 spec\(s\)/, 'antes: a 2ª spec deixava de casar e caía na quarentena');
  assert.equal(s.stdout, 'e2e/legado.e2e.ts\ne2e/outro-legado.e2e.ts\n');
}));

test('padrão que não casa spec nenhuma reprova: gate verde que não testa nada', opcoes, () => comRepo({
  configs: { 'playwright.critical.config.ts': "export default { testMatch: ['**/auth/login.e2e.ts', '**/auth/renomeada.e2e.ts'] };\n" },
}, (r) => {
  const s = r.rodar();
  assert.equal(s.status, 1);
  assert.equal(s.stdout, '', 'nada em stdout: o CI não pode consumir lista parcial');
  assert.match(s.stderr, /::error::playwright\.critical\.config\.ts: o padrão \*\*\/auth\/renomeada\.e2e\.ts não casa nenhuma spec versionada/);
}));

test('config sem testMatch, config ausente e config que não importa reprovam com ::error::', opcoes, () => {
  const casos = {
    'sem testMatch': [{ 'playwright.destructive.config.ts': 'export default { testDir: "./e2e" };\n' }, /não declara testMatch — cobertura indeterminável/],
    'testMatch vazio': [{ 'playwright.destructive.config.ts': 'export default { testMatch: [] };\n' }, /não declara testMatch/],
    'ausente': [{ 'playwright.destructive.config.ts': null }, /::error::.*playwright\.destructive\.config\.ts/s],
    'erro de sintaxe': [{ 'playwright.destructive.config.ts': 'export default {\n' }, /::error::/],
    'lança ao importar': [{ 'playwright.destructive.config.ts': "throw new Error('config quebrado');\n" }, /::error::config quebrado/],
  };
  for (const [nome, [configs, erro]] of Object.entries(casos)) {
    comRepo({ configs }, (r) => {
      const s = r.rodar();
      assert.equal(s.status, 1, nome);
      assert.equal(s.stdout, '', nome);
      assert.match(s.stderr, erro, nome);
    });
  }
});

test('glob com sintaxe não suportada é rejeitado, não aproximado', opcoes, () => {
  for (const glob of ['**/{login,logout}.e2e.ts', '**/auth/[lg]*.e2e.ts', '**/!(x).e2e.ts', '**/+(a).e2e.ts']) {
    comRepo({ configs: { 'playwright.critical.config.ts': `export default { testMatch: [${JSON.stringify(glob)}] };\n` } }, (r) => {
      const s = r.rodar();
      assert.equal(s.status, 1, glob);
      assert.match(s.stderr, /::error::Glob com sintaxe não suportada por este script/, glob);
    });
  }
});

test('glob: `*` não atravessa diretório, `?` casa um caractere, ponto é literal', opcoes, () => comRepo({
  specs: ['e2e/a/x1.e2e.ts', 'e2e/a/b/x2.e2e.ts', 'e2e/a/x1Xe2e.ts.e2e.ts', 'e2e/resto.e2e.ts', 'e2e/d/logout-real.e2e.ts', 'e2e/f/z.e2e.ts'],
  configs: {
    'playwright.critical.config.ts': "export default { testMatch: ['e2e/a/*.e2e.ts'] };\n",
    'playwright.destructive.config.ts': "export default { testMatch: ['**/logout-rea?.e2e.ts'] };\n",
    'playwright.financeiro.config.ts': "export default { testMatch: ['e2e/f/**'] };\n",
  },
}, (r) => {
  const s = r.rodar();
  assert.equal(s.status, 0, s.stderr);
  assert.equal(s.stdout, 'e2e/a/b/x2.e2e.ts\ne2e/resto.e2e.ts\n', '`e2e/a/*` cobre só o nível direto');
}));

test('disco e git divergentes reprovam — inclusive com a MESMA contagem', opcoes, () => {
  comRepo({}, (r) => {
    r.escrever('e2e/nova-nao-rastreada.e2e.ts', '// nova\n');
    const s = r.rodar();
    assert.equal(s.status, 1);
    assert.match(s.stderr, /Descoberta de specs inconsistente: git=6 vs disco=7\..*e2e\/nova-nao-rastreada\.e2e\.ts \(só no disco\)/);
  });
  comRepo({}, (r) => {
    r.escrever('e2e/nova-nao-rastreada.e2e.ts', '// nova\n');
    rmSync(join(r.dir, 'e2e', 'legado.e2e.ts'));
    const s = r.rodar();
    assert.equal(s.status, 1, 'antes: 6 = 6 passava, e a spec apagada ia para a quarentena como arquivo inexistente');
    assert.equal(s.stdout, '');
    assert.match(s.stderr, /git=6 vs disco=6/);
    assert.match(s.stderr, /e2e\/nova-nao-rastreada\.e2e\.ts \(só no disco\)/);
    assert.match(s.stderr, /e2e\/legado\.e2e\.ts \(só no git\)/);
  });
});

test('nome de spec com espaço e acento sai cru, um por linha (antes: vinha entre aspas e escapado)', opcoes, () => comRepo({
  specs: [...SPECS, 'e2e/relatório de março.e2e.ts'],
}, (r) => {
  const s = r.rodar();
  assert.equal(s.status, 0, s.stderr);
  assert.deepEqual(s.stdout.split('\n').filter(Boolean), ['e2e/legado.e2e.ts', 'e2e/outro-legado.e2e.ts', 'e2e/relatório de março.e2e.ts']);
}));

test('quarentena vazia e pasta e2e ausente são erro, não sucesso', opcoes, () => {
  comRepo({ specs: ['e2e/auth/login.e2e.ts', 'e2e/auth/logout-real.e2e.ts', 'e2e/financeiro/contas.e2e.ts'] }, (r) => {
    const s = r.rodar();
    assert.equal(s.status, 1);
    assert.match(s.stderr, /::error::Nenhuma spec elegível para a quarentena E2E/);
  });
  comRepo({ specs: [] }, (r) => {
    const s = r.rodar();
    assert.equal(s.status, 1);
    assert.equal(s.stdout, '');
    assert.match(s.stderr, /::error::/);
  });
});

test('arquivos que não são spec (.spec.ts, .e2e.tsx, setup) não entram na conta', opcoes, () => comRepo({
  extras: { 'e2e/auth/auth.setup.ts': '//\n', 'e2e/x.spec.ts': '//\n', 'e2e/y.e2e.tsx': '//\n', 'e2e/fixtures/sessao.ts': '//\n', 'outro/z.e2e.ts': '//\n' },
}, (r) => {
  const s = r.rodar();
  assert.equal(s.status, 0, s.stderr);
  assert.match(s.stderr, /\[quarentena\] 2 de 6 spec/);
}));
