// Guard de integridade das instruções para agentes, exercitado num repositório git
// temporário (nunca no repo real): o script lê AGENTS.md/CLAUDE.md/docs/agentes do
// diretório atual e compara com uma ref git.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'check-claude-md-integrity.mjs');
const SECOES = [
  '## 1. Contexto, stack, IDs',
  '## 2. Como trabalhar',
  '## 3. Bugs e funcionalidades',
  '## 4. Banco de dados',
  '## 5. Front, Edge, CI, segurança',
  '## 6. Git',
  '## 7. Comunicação',
  '## 8. Graphify',
];
const AGENTS = `# AGENTS.md\n\n${SECOES.map((s) => `${s}\n\n${'regra '.repeat(40)}\n`).join('\n')}`;
const DOC = (n) => `# doc ${n}\n\n${'conteúdo de referência '.repeat(60)}\n`;

// Git isolado: sem config global/sistema (hooks, assinatura) e sem herdar GIT_DIR do chamador.
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

function repo(extras = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'claude md-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, env: ENV_GIT, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  mkdirSync(join(dir, 'docs', 'agentes'), { recursive: true });
  const arquivos = { 'AGENTS.md': AGENTS, 'CLAUDE.md': '@AGENTS.md\n', 'docs/agentes/sistema.md': DOC(1), 'docs/agentes/fluxo-git.md': DOC(2), 'docs/agentes/nota.txt': 'não é md', ...extras };
  for (const [nome, texto] of Object.entries(arquivos)) writeFileSync(join(dir, nome), texto);
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  const rodar = (env = {}) => spawnSync(process.execPath, [SCRIPT], { cwd: dir, encoding: 'utf8', env: { ...ENV_GIT, ...env } });
  return { dir, git, rodar, escrever: (nome, texto) => writeFileSync(join(dir, nome), texto), limpar: () => rmSync(dir, { recursive: true, force: true }) };
}

function comRepo(extras, fn) {
  const r = repo(extras);
  try {
    return fn(r);
  } finally {
    r.limpar();
  }
}

test('intacto: exit 0 e a linha de OK conta seções, bytes e arquivos da base', () => comRepo({}, (r) => {
  const s = r.rodar();
  assert.equal(s.status, 0, s.stderr);
  assert.match(s.stdout, /^AGENTS\.md OK: 8 secoes presentes; conjunto com docs\/agentes\/: \d+ bytes \(base HEAD: \d+ bytes em 4 arquivos, cada um >= 50% do tamanho na base\)\.\n$/);
  assert.equal(r.rodar().stdout, s.stdout, 'idempotente');
}));

test('AGENTS.md apagado reprova', () => comRepo({}, (r) => {
  rmSync(join(r.dir, 'AGENTS.md'));
  const s = r.rodar();
  assert.equal(s.status, 1);
  assert.match(s.stderr, /::error::AGENTS\.md nao encontrado/);
}));

test('cada seção obrigatória ausente é nomeada', () => comRepo({}, (r) => {
  for (const secao of SECOES) {
    r.escrever('AGENTS.md', AGENTS.replace(secao, '## removida'));
    const s = r.rodar();
    assert.equal(s.status, 1, secao);
    assert.ok(s.stderr.includes(`::error::AGENTS.md: secao obrigatoria ausente: ${secao}`), s.stderr);
  }
  r.escrever('AGENTS.md', SECOES.slice(0, 2).join('\n'));
  assert.equal(r.rodar().stderr.split('\n').filter((l) => l.includes('secao obrigatoria ausente')).length, 6);
}));

test('conjunto que encolhe mais de 30% reprova; até 30% passa', () => comRepo({}, (r) => {
  // AGENTS.md mantém as 8 seções e fica acima de 50% do próprio tamanho; quem derruba o conjunto é a soma.
  r.escrever('docs/agentes/sistema.md', DOC(1).slice(0, Math.ceil(DOC(1).length * 0.55)));
  r.escrever('docs/agentes/fluxo-git.md', DOC(2).slice(0, Math.ceil(DOC(2).length * 0.55)));
  r.escrever('AGENTS.md', AGENTS.replaceAll('regra '.repeat(40), 'regra '.repeat(22)));
  const s = r.rodar();
  assert.equal(s.status, 1, s.stdout);
  assert.match(s.stderr, /encolheram \d+% vs HEAD .* Possivel wipe por sessao paralela/);
  r.escrever('AGENTS.md', AGENTS);
  r.escrever('docs/agentes/sistema.md', DOC(1).slice(0, Math.ceil(DOC(1).length * 0.8)));
  r.escrever('docs/agentes/fluxo-git.md', DOC(2).slice(0, Math.ceil(DOC(2).length * 0.8)));
  assert.equal(r.rodar().status, 0);
}));

test('um arquivo esvaziado reprova mesmo com o conjunto dentro do limite', () => comRepo({ 'docs/agentes/pequeno.md': 'x'.repeat(200) }, (r) => {
  r.escrever('docs/agentes/pequeno.md', 'x'.repeat(99));
  const s = r.rodar();
  assert.equal(s.status, 1);
  assert.match(s.stderr, /::error::docs\/agentes\/pequeno\.md encolheu 51% vs HEAD \(atual: 99 bytes, base: 200 bytes\); limite por arquivo e 50%\./);
  r.escrever('docs/agentes/pequeno.md', 'x'.repeat(100));
  assert.equal(r.rodar().status, 0, 'exatamente 50% passa');
}));

test('arquivo vigiado que some reprova; todos os sumidos são listados', () => comRepo({}, (r) => {
  rmSync(join(r.dir, 'docs', 'agentes', 'sistema.md'));
  rmSync(join(r.dir, 'docs', 'agentes', 'fluxo-git.md'));
  r.escrever('docs/agentes/novo.md', DOC(3) + DOC(4)); // mantém o conjunto acima de 70%
  const s = r.rodar();
  assert.equal(s.status, 1);
  assert.match(s.stderr, /docs\/agentes\/sistema\.md existia em HEAD \(\d+ bytes\) e sumiu/);
  assert.match(s.stderr, /docs\/agentes\/fluxo-git\.md existia em HEAD/);
}));

test('CLAUDE.md fica fora do limite por arquivo; arquivo novo e crescimento passam', () => comRepo({ 'CLAUDE.md': `@AGENTS.md\n${'x'.repeat(300)}\n` }, (r) => {
  r.escrever('CLAUDE.md', '@AGENTS.md\n');
  r.escrever('docs/agentes/novo.md', DOC(9));
  r.escrever('AGENTS.md', AGENTS + DOC(8));
  const s = r.rodar();
  assert.equal(s.status, 0, s.stderr);
}));

test('base explícita por CLAUDE_MD_BASE; ref inexistente e diretório sem git avisam e não reprovam', () => comRepo({}, (r) => {
  r.git('branch', 'referencia');
  r.escrever('docs/agentes/sistema.md', 'x');
  r.git('commit', '-q', '-am', 'esvazia');
  assert.equal(r.rodar().status, 0, 'contra o próprio HEAD a comparação é no-op (motivo de existir CLAUDE_MD_BASE)');
  const contraBase = r.rodar({ CLAUDE_MD_BASE: 'referencia' });
  assert.equal(contraBase.status, 1);
  assert.match(contraBase.stderr, /docs\/agentes\/sistema\.md encolheu \d+% vs referencia/);
  const semRef = r.rodar({ CLAUDE_MD_BASE: 'nao-existe' });
  assert.equal(semRef.status, 0);
  assert.match(semRef.stdout, /::warning::shrink check pulado: ref base 'nao-existe' nao encontrada/);
  rmSync(join(r.dir, '.git'), { recursive: true });
  const semGit = r.rodar({ GIT_CEILING_DIRECTORIES: dirname(r.dir) });
  assert.equal(semGit.status, 0);
  assert.match(semGit.stdout, /::warning::shrink check pulado/);
}));

test('nome com espaço e acento continua vigiado (antes: saía do conjunto sem aviso)', () => comRepo({ 'docs/agentes/guia de migração.md': DOC(5) }, (r) => {
  assert.match(r.rodar().stdout, /em 5 arquivos/);
  r.escrever('docs/agentes/guia de migração.md', 'x');
  const s = r.rodar();
  assert.equal(s.status, 1);
  assert.match(s.stderr, /docs\/agentes\/guia de migração\.md encolheu/);
}));

test('nome de arquivo e ref com metacaractere de shell não executam nada (antes: iam para execSync)', () => {
  const hostil = 'docs/agentes/a;touch PWNED-NOME;.md';
  comRepo({ [hostil]: DOC(6) }, (r) => {
    const s = r.rodar();
    assert.equal(s.status, 0, s.stderr);
    assert.match(s.stdout, /em 5 arquivos/, 'o arquivo de nome hostil é vigiado como qualquer outro');
    const comRef = r.rodar({ CLAUDE_MD_BASE: 'HEAD; touch PWNED-REF; echo' });
    assert.equal(comRef.status, 0);
    assert.match(comRef.stdout, /::warning::shrink check pulado/);
    const criados = readdirSync(r.dir).filter((n) => n.startsWith('PWNED'));
    assert.deepEqual(criados, []);
    assert.equal(existsSync(join(r.dir, 'docs', 'agentes', 'PWNED-NOME')), false);
  });
});

test('repo real: AGENTS.md atual tem as 8 seções que o guard exige', () => {
  // Só a parte que independe de git/base: o guard completo roda no ci.yml contra a main buscada.
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const s = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, CLAUDE_MD_BASE: 'ref-que-nao-existe-de-proposito' } });
  assert.equal(s.status, 0, s.stderr);
  assert.match(s.stdout, /AGENTS\.md OK: 8 secoes presentes/);
});
