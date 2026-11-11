import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { CAMPOS, extrairDocs, extrairNaoEBug, nomeDe, renderizar } from './render-workflow-docs.mjs';

const COMPLETO = `# docs:
#   gatilho: push em main
#   prova: o front compila
#   falha: o job fica vermelho
#   avisa: ninguem
# nao-e-bug:
#   - sem-commit: nada mudou desde a ultima publicacao
#   - cache-frio: a primeira run do dia e mais lenta
name: CI Pipeline
on:
  push:
`;

const SEM_BLOCO = `name: Sem Documentacao
on:
  push:
`;

const INCOMPLETO = `# docs:
#   gatilho: semanal
#   prova: alguma coisa
name: Meio Documentado
`;

test('extrairDocs le os quatro campos do bloco do topo', () => {
  const bloco = extrairDocs(COMPLETO);
  assert.deepEqual(Object.keys(bloco).sort(), [...CAMPOS].sort());
  assert.equal(bloco.gatilho, 'push em main');
  assert.equal(bloco.avisa, 'ninguem');
  assert.equal(extrairDocs(SEM_BLOCO), null);
});

test('extrairDocs para no primeiro conteudo que nao e comentario do bloco', () => {
  // `name:` nao e comentario: nao pode ser absorvido como campo do bloco.
  assert.equal(extrairDocs(COMPLETO).name, undefined);
});

test('extrairNaoEBug lista os itens e para no fim do bloco', () => {
  const itens = extrairNaoEBug(COMPLETO);
  assert.deepEqual(
    itens.map((i) => i.chave),
    ['sem-commit', 'cache-frio'],
  );
  assert.equal(itens[0].descricao, 'nada mudou desde a ultima publicacao');
  assert.deepEqual(extrairNaoEBug(SEM_BLOCO), []);
});

test('nomeDe usa o name: do YAML e cai no nome do arquivo quando nao ha', () => {
  assert.equal(nomeDe(COMPLETO, 'ci.yml'), 'CI Pipeline');
  assert.equal(nomeDe('on:\n  push:\n', 'sem-nome.yml'), 'sem-nome');
});

test('renderizar cruza tabela, detalhe e nao-e-bug', () => {
  const md = renderizar([{ arquivo: 'ci.yml', texto: COMPLETO }]);
  assert.match(md, /\*\*1 workflows — 1 com bloco/);
  assert.match(md, /\| CI Pipeline \| \[`ci\.yml`\]\(\.\.\/\.\.\/\.github\/workflows\/ci\.yml\) \| push em main \|/);
  assert.match(md, /### CI Pipeline \(`ci\.yml`\)/);
  assert.match(md, /## O que NÃO é bug/);
  assert.match(md, /\*\*sem-commit\*\*/);
});

test('workflow sem bloco e pendencia listada, nao erro', () => {
  const md = renderizar([
    { arquivo: 'ci.yml', texto: COMPLETO },
    { arquivo: 'orfao.yml', texto: SEM_BLOCO },
  ]);
  assert.match(md, /\*\*2 workflows — 1 com bloco `# docs:`, 1 sem\.\*\*/);
  assert.match(md, /## Workflows sem bloco `# docs:`/);
  assert.match(md, /\| \[`orfao\.yml`\].*\| Sem Documentacao \|/);
});

test('bloco incompleto reprova — contrato pela metade parece documentado', () => {
  assert.throws(() => renderizar([{ arquivo: 'meio.yml', texto: INCOMPLETO }]), /falha, avisa/);
});

test('as colunas de custo e falha saem do kpi.json quando ele existe', () => {
  const kpi = { 'ci.yml': { custo_semana_min: 123.4, taxa_falha_7d: '8.3%' } };
  assert.match(renderizar([{ arquivo: 'ci.yml', texto: COMPLETO }], kpi), /\| 123\.4 \| 8\.3% \|/);
  assert.match(renderizar([{ arquivo: 'ci.yml', texto: COMPLETO }]), /\| — \| — \|/);
});

test('pipe no texto do bloco e escapado para nao quebrar a tabela markdown', () => {
  const comPipe = COMPLETO.replace('push em main', 'push em main | dispatch');
  const md = renderizar([{ arquivo: 'ci.yml', texto: comPipe }]);
  const linha = md.split('\n').find((l) => l.startsWith('| CI Pipeline |'));
  assert.ok(linha.includes('push em main \\| dispatch'), 'o pipe do texto vai escapado para a celula');
  assert.doesNotMatch(linha, /[^\\]\| dispatch/, 'nenhum pipe cru sobrou criando coluna nova');
});

test('o estado-real.yml declara o bloco # docs: que este gerador exige', () => {
  const y = readFileSync(new URL('../../.github/workflows/estado-real.yml', import.meta.url), 'utf8');
  const bloco = extrairDocs(y);
  assert.ok(bloco, 'o proprio workflow do gerador tem de ter bloco # docs:');
  assert.deepEqual(
    CAMPOS.filter((c) => !bloco[c]),
    [],
  );
});

// ---------------------------------------------------------------------------
// CLI ponta a ponta numa árvore temporária (o script deriva a raiz do próprio caminho)
// e bordas do extrator.
// ---------------------------------------------------------------------------
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

function arvore(workflows, { kpi } = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'wf docs-'));
  mkdirSync(join(raiz, 'scripts', 'ci'), { recursive: true });
  mkdirSync(join(raiz, '.github', 'workflows'), { recursive: true });
  copyFileSync(join(AQUI, 'render-workflow-docs.mjs'), join(raiz, 'scripts', 'ci', 'render-workflow-docs.mjs'));
  for (const [nome, texto] of Object.entries(workflows)) writeFileSync(join(raiz, '.github', 'workflows', nome), texto);
  if (kpi !== undefined) {
    mkdirSync(join(raiz, 'docs', 'ci'), { recursive: true });
    writeFileSync(join(raiz, 'docs', 'ci', 'kpi.json'), kpi);
  }
  const script = join(raiz, 'scripts', 'ci', 'render-workflow-docs.mjs');
  const rodar = (args = [], caminho = script) => spawnSync(process.execPath, [caminho, ...args], { encoding: 'utf8', cwd: tmpdir() });
  return { raiz, readme: join(raiz, 'docs', 'ci', 'README.md'), rodar, limpar: () => rmSync(raiz, { recursive: true, force: true }) };
}

test('CLI: gera, --check passa, e é idempotente (rodar duas vezes dá o mesmo arquivo)', () => {
  const a = arvore({ 'b.yml': SEM_BLOCO, 'a.yaml': COMPLETO, 'leia.md': 'não é workflow', 'c.yml.bak': COMPLETO });
  try {
    const gerar = a.rodar();
    assert.equal(gerar.status, 0, gerar.stderr);
    assert.equal(gerar.stdout, 'docs/ci/README.md gerado.\n');
    const primeira = readFileSync(a.readme, 'utf8');
    assert.match(primeira, /\*\*2 workflows — 1 com bloco `# docs:`, 1 sem\.\*\*/, 'só .yml/.yaml contam');
    assert.ok(primeira.indexOf('a.yaml') < primeira.indexOf('b.yml'), 'ordem determinística por nome de arquivo');
    assert.equal(a.rodar().status, 0);
    assert.equal(readFileSync(a.readme, 'utf8'), primeira);
    const check = a.rodar(['--check']);
    assert.equal(check.status, 0, check.stderr);
    assert.equal(check.stdout, 'OK: docs/ci/README.md bate com os workflows.\n');
  } finally {
    a.limpar();
  }
});

test('CLI --check: divergência e README ausente saem com 1 SEM escrever nada', () => {
  const a = arvore({ 'a.yml': COMPLETO });
  try {
    const ausente = a.rodar(['--check']);
    assert.equal(ausente.status, 1);
    assert.match(ausente.stderr, /docs\/ci\/README\.md não existe/);
    assert.equal(existsSync(a.readme), false, '--check não cria o arquivo');
    a.rodar();
    writeFileSync(a.readme, `${readFileSync(a.readme, 'utf8')}\neditado à mão\n`);
    const editado = readFileSync(a.readme, 'utf8');
    const divergiu = a.rodar(['--check']);
    assert.equal(divergiu.status, 1);
    assert.match(divergiu.stderr, /divergiu dos blocos `# docs:`/);
    assert.equal(readFileSync(a.readme, 'utf8'), editado, '--check não conserta o arquivo');
  } finally {
    a.limpar();
  }
});

test('CLI: argumento desconhecido sai com 2 e não escreve (antes: --chek gerava o README)', () => {
  const a = arvore({ 'a.yml': COMPLETO });
  try {
    for (const args of [['--chek'], ['check'], ['--check', '--fix']]) {
      const r = a.rodar(args);
      assert.equal(r.status, 2, args.join(' '));
      assert.match(r.stderr, /argumento desconhecido/);
    }
    assert.equal(existsSync(a.readme), false);
    const ajuda = a.rodar(['--help']);
    assert.equal(ajuda.status, 0);
    assert.match(ajuda.stdout, /Uso: node scripts\/ci\/render-workflow-docs\.mjs \[--check\]/);
    assert.equal(existsSync(a.readme), false);
  } finally {
    a.limpar();
  }
});

test('CLI: bloco incompleto reprova a geração e o --check, sem deixar README pela metade', () => {
  const a = arvore({ 'a.yml': COMPLETO, 'meio.yml': INCOMPLETO });
  try {
    for (const args of [[], ['--check']]) {
      const r = a.rodar(args);
      assert.equal(r.status, 1);
      assert.match(r.stderr, /ERRO: bloco '# docs:' incompleto:\n\s+- meio\.yml: bloco '# docs:' sem falha, avisa/);
    }
    assert.equal(existsSync(a.readme), false);
  } finally {
    a.limpar();
  }
});

test('CLI: kpi.json alimenta as colunas; corrompido ou de formato errado é erro, não "—" calado', () => {
  const ok = arvore({ 'a.yml': COMPLETO }, { kpi: JSON.stringify({ 'a.yml': { custo_semana_min: 12.5, taxa_falha_7d: '3.1%' } }) });
  try {
    assert.equal(ok.rodar().status, 0);
    assert.match(readFileSync(ok.readme, 'utf8'), /\| ninguem \| 12\.5 \| 3\.1% \|/);
  } finally {
    ok.limpar();
  }
  for (const kpi of ['{ "a.yml": ', 'null', '[]', '"texto"']) {
    const a = arvore({ 'a.yml': COMPLETO }, { kpi });
    try {
      const r = a.rodar();
      assert.equal(r.status, 1, `kpi.json = ${kpi} (antes: README gerado com "—" em silêncio)`);
      assert.match(r.stderr, /ERRO: docs\/ci\/kpi\.json/);
      assert.equal(existsSync(a.readme), false);
    } finally {
      a.limpar();
    }
  }
});

test('CLI: sem nenhum workflow ainda gera um README válido; sem a pasta, falha', () => {
  const a = arvore({});
  try {
    assert.equal(a.rodar().status, 0);
    assert.match(readFileSync(a.readme, 'utf8'), /\*\*0 workflows — 0 com bloco `# docs:`, 0 sem\.\*\*/);
    rmSync(join(a.raiz, '.github'), { recursive: true });
    assert.notEqual(a.rodar(['--check']).status, 0);
  } finally {
    a.limpar();
  }
});

test('CLI: invocado por symlink da raiz executa de verdade (antes: --check saía 0 sem conferir)', () => {
  const a = arvore({ 'a.yml': COMPLETO });
  const atalho = `${a.raiz}-atalho`;
  try {
    symlinkSync(a.raiz, atalho);
    const r = a.rodar(['--check'], join(atalho, 'scripts', 'ci', 'render-workflow-docs.mjs'));
    assert.equal(r.status, 1, 'README ausente tem de reprovar também pelo atalho');
    assert.match(r.stderr, /não existe/);
  } finally {
    rmSync(atalho, { force: true });
    a.limpar();
  }
});

test('extrairDocs: CRLF, linha em branco no bloco, bloco fora do topo e chaves hostis', () => {
  const crlf = COMPLETO.replace(/\n/g, '\r\n');
  assert.deepEqual(extrairDocs(crlf), extrairDocs(COMPLETO));
  assert.equal(nomeDe(crlf, 'x.yml'), 'CI Pipeline');
  const comVazio = '# docs:\n#   gatilho: a\n#\n\n#   prova: b\n#   falha: c\n#   avisa: d\nname: X\n';
  assert.deepEqual(Object.keys(extrairDocs(comVazio)), CAMPOS);
  const depois = 'name: X\non: push\n# docs:\n#   gatilho: a\n#   prova: b\n#   falha: c\n#   avisa: d\n';
  assert.equal(extrairDocs(depois).avisa, 'd');
  assert.equal(extrairDocs('# docs:\nname: X\n'), null, 'cabeçalho sem campos é ausência de bloco');
  assert.equal(extrairDocs('#docs: tudo numa linha\nname: X\n'), null);
  const hostil = extrairDocs('# docs:\n#   __proto__: x\n#   constructor: y\n#   gatilho: a\n');
  assert.equal(hostil.gatilho, 'a');
  assert.equal({}.x, undefined, 'protótipo global intacto');
  assert.equal(extrairDocs('# docs:\n#   gatilho: a: b | c\n').gatilho, 'a: b | c', 'dois-pontos e pipe no valor');
});

test('extrairNaoEBug: sem bloco devolve [], descrição com dois-pontos fica inteira', () => {
  assert.deepEqual(extrairNaoEBug(SEM_BLOCO), []);
  const itens = extrairNaoEBug('# nao-e-bug:\n#   - chave: veja https://exemplo.com/x: detalhe\n#\n#   - outra: y\nname: X\n');
  assert.deepEqual(itens, [{ chave: 'chave', descricao: 'veja https://exemplo.com/x: detalhe' }, { chave: 'outra', descricao: 'y' }]);
});

test('renderizar: barra invertida e pipe escapados em todas as tabelas; nome com aspas simples', () => {
  const texto = "# docs:\n#   gatilho: a\\b\n#   prova: p\n#   falha: f\n#   avisa: x | y\n# nao-e-bug:\n#   - k|1: d\\e\nname: 'Com | pipe'\n";
  const md = renderizar([{ arquivo: 'a.yml', texto }, { arquivo: 'b.yml', texto: 'name: "Sem | bloco"\n' }]);
  assert.match(md, /\| Com \\\| pipe \| \[`a\.yml`\]/);
  assert.match(md, /\| a\\\\b \| p \| f \| x \\\| y \|/);
  assert.match(md, /\*\*k\\\|1\*\* \| d\\\\e \|/);
  assert.match(md, /\| \[`b\.yml`\]\(\.\.\/\.\.\/\.github\/workflows\/b\.yml\) \| Sem \\\| bloco \|/);
});

// Não compara com o docs/ci/README.md versionado de propósito: o estado-real.yml roda
// estes testes ANTES de regerar o README — exigir "em dia" aqui deixaria o job vermelho
// justamente quando ele existe para consertar a divergência.
test('repo real: os workflows de verdade renderizam sem erro e todos os arquivos são citados', () => {
  const dirWf = join(AQUI, '..', '..', '.github', 'workflows');
  const arquivos = readdirSync(dirWf).filter((f) => /\.ya?ml$/.test(f)).sort();
  const md = renderizar(arquivos.map((arquivo) => ({ arquivo, texto: readFileSync(join(dirWf, arquivo), 'utf8') })));
  for (const arquivo of arquivos) assert.ok(md.includes(`[\`${arquivo}\`](../../.github/workflows/${arquivo})`), arquivo);
  assert.match(md, new RegExp(`\\*\\*${arquivos.length} workflows — `));
  assert.ok(extrairDocs(readFileSync(join(dirWf, 'estado-real.yml'), 'utf8')), 'o consumidor deste gerador mantém o próprio bloco');
});
