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
