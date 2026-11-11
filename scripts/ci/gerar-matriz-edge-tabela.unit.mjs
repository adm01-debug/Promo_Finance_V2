import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { montarMatriz, renderizar } from "./gerar-matriz-edge-tabela.mjs";

function criarFuncoesFalsas() {
  const dir = mkdtempSync(path.join(tmpdir(), "edge-matriz-"));
  mkdirSync(path.join(dir, "fn-a"));
  mkdirSync(path.join(dir, "fn-b"));
  mkdirSync(path.join(dir, "fn-c"));
  mkdirSync(path.join(dir, "_shared"));
  writeFileSync(
    path.join(dir, "fn-a", "index.ts"),
    "await sb.from('empresas').select();\nawait sb\n  .from(\"contas_pagar\").insert({});\nawait sb.storage.from('financeiro').upload('k', new Blob());\n",
  );
  writeFileSync(path.join(dir, "fn-a", "index.test.ts"), "sb.from('ignorada')");
  writeFileSync(path.join(dir, "fn-b", "index.ts"), "sb.from('empresas'); sb.from('profiles');");
  writeFileSync(path.join(dir, "fn-c", "index.ts"), "await sb.rpc('somar_saldo');");
  writeFileSync(path.join(dir, "_shared", "x.ts"), "sb.from('shared_nao_conta')");
  return dir;
}

test("matriz de funcoes falsas lista as tabelas certas", (t) => {
  const dir = criarFuncoesFalsas();
  t.after(() => rmSync(dir, { recursive: true, force: true })); // não deixa edge-matriz-* no tmp a cada run
  const matriz = montarMatriz(dir);
  assert.deepEqual(
    [...matriz],
    [
      ["fn-a", ["contas_pagar", "empresas"]],
      ["fn-b", ["empresas", "profiles"]],
      ["fn-c", []],
    ],
  );
});

test("markdown cruza funcao x tabela nos dois sentidos", (t) => {
  const dir = criarFuncoesFalsas();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const md = renderizar(montarMatriz(dir));
  assert.match(md, /\| `fn-a` \| `contas_pagar`, `empresas` \|/);
  assert.match(md, /\| `empresas` \| `fn-a`, `fn-b` \|/);
  assert.match(md, /\| `fn-c` \| — \|/);
  assert.match(md, /3 edge functions · 3 tabelas citadas · 1 funções sem/);
  assert.doesNotMatch(md, /ignorada|shared_nao_conta|financeiro/);
});

// ---------------------------------------------------------------------------
// Bordas do extrator e CLI ponta a ponta numa árvore temporária.
// ---------------------------------------------------------------------------
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, readdirSync, symlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { extrairTabelas } from "./gerar-matriz-edge-tabela.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));

test("extrairTabelas: aspas, crase, schema.tabela, espaços e cadeia quebrada em linhas", () => {
  const fonte = [
    "sb.from('a')", 'sb.from("b")', "sb.from(`c`)", "sb.from( 'd' )", "sb\n  .from(\n    'e'\n  )", "sb.schema('x').from('f')",
    "sb.from('publico.g')", "sb.from('h' as never)", "sb.from('a')",
  ].join(";\n");
  assert.deepEqual([...extrairTabelas(fonte)].sort(), ["a", "b", "c", "d", "e", "f", "h", "publico.g"]);
});

test("extrairTabelas: o que NÃO é tabela fica de fora", () => {
  const naoTabela = [
    "sb.storage.from('bucket')",
    // cadeia quebrada em linhas, como o repo escreve — antes só escapava bucket com hífen no nome
    "await sb.storage\n      .from('anexos')\n      .upload(k, b)",
    "sb.storage  .from('espacado')",
    "Buffer.from('abcdef')",
    "Array.from('abc')",
    "Buffer\n  .from(\"hex\")",
    "sb.from(nomeDaTabela)",
    "sb.from(`tabela_${sufixo}`)",
    "sb.from('com-hifen')",
    "sb.from('aspas\")",
    "sb.rpc('funcao')",
    "from('sem_ponto')",
    "sb.from('')",
    "sb.from('9comeca_com_digito')",
  ];
  for (const fonte of naoTabela) assert.deepEqual([...extrairTabelas(fonte)], [], fonte);
  assert.deepEqual([...extrairTabelas("minhaArray.from('t1'); bufferPool.from('t2'); restorage.from('t3')")], ["t1", "t2"], "só o sufixo exato `storage` e os globais Array/Buffer são excluídos");
});

test("montarMatriz: ignora _shared, *.test.ts, *.spec.ts e arquivos soltos; desce em subpastas", () => {
  const dir = criarFuncoesFalsas();
  try {
    mkdirSync(path.join(dir, "fn-a", "lib", "fundo"), { recursive: true });
    writeFileSync(path.join(dir, "fn-a", "lib", "fundo", "repo.ts"), "sb.from('aninhada')");
    writeFileSync(path.join(dir, "fn-a", "lib", "repo.spec.ts"), "sb.from('de_spec')");
    writeFileSync(path.join(dir, "fn-a", "notas.md"), "sb.from('de_markdown')");
    writeFileSync(path.join(dir, "solto_test.ts"), "sb.from('arquivo_solto')");
    mkdirSync(path.join(dir, "fn-vazia"));
    const matriz = montarMatriz(dir);
    assert.deepEqual([...matriz.keys()], ["fn-a", "fn-b", "fn-c", "fn-vazia"]);
    assert.deepEqual(matriz.get("fn-a"), ["aninhada", "contas_pagar", "empresas"]);
    assert.deepEqual(matriz.get("fn-vazia"), []);
    assert.equal(renderizar(matriz), renderizar(montarMatriz(dir)), "saída determinística");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function arvore() {
  const raiz = mkdtempSync(path.join(tmpdir(), "matriz cli-"));
  mkdirSync(path.join(raiz, "scripts", "ci"), { recursive: true });
  copyFileSync(path.join(AQUI, "gerar-matriz-edge-tabela.mjs"), path.join(raiz, "scripts", "ci", "gerar-matriz-edge-tabela.mjs"));
  mkdirSync(path.join(raiz, "supabase", "functions", "fn-a"), { recursive: true });
  writeFileSync(path.join(raiz, "supabase", "functions", "fn-a", "index.ts"), "sb.from('empresas')");
  const script = path.join(raiz, "scripts", "ci", "gerar-matriz-edge-tabela.mjs");
  const rodar = (args = [], caminho = script) => spawnSync(process.execPath, [caminho, ...args], { encoding: "utf8", cwd: tmpdir() });
  return { raiz, doc: path.join(raiz, "docs", "ci", "MATRIZ_EDGE_TABELA.md"), rodar, limpar: () => rmSync(raiz, { recursive: true, force: true }) };
}

test("CLI: gera, --check acompanha o código, e nunca escreve em modo --check", () => {
  const a = arvore();
  try {
    const ausente = a.rodar(["--check"]);
    assert.equal(ausente.status, 1);
    assert.equal(existsSync(a.doc), false);
    const gerar = a.rodar();
    assert.equal(gerar.status, 0, gerar.stderr);
    assert.equal(gerar.stdout, "docs/ci/MATRIZ_EDGE_TABELA.md gerado\n");
    const md = readFileSync(a.doc, "utf8");
    assert.match(md, /\*\*1 edge functions · 1 tabelas citadas · 0 funções sem `\.from\(\)` literal\.\*\*/);
    assert.equal(a.rodar(["--check"]).status, 0);
    writeFileSync(path.join(a.raiz, "supabase", "functions", "fn-a", "index.ts"), "sb.from('empresas'); sb.from('nova')");
    const defasado = a.rodar(["--check"]);
    assert.equal(defasado.status, 1);
    assert.match(defasado.stderr, /desatualizado/);
    assert.equal(readFileSync(a.doc, "utf8"), md, "--check não regenera");
  } finally {
    a.limpar();
  }
});

test("CLI: argumento desconhecido sai com 2 sem escrever (antes: --chek gerava o documento); --help sai 0", () => {
  const a = arvore();
  try {
    for (const args of [["--chek"], ["check"], ["--check", "--fix"]]) {
      const r = a.rodar(args);
      assert.equal(r.status, 2, args.join(" "));
      assert.match(r.stderr, /argumento desconhecido/);
    }
    assert.equal(a.rodar(["--help"]).status, 0);
    assert.equal(existsSync(a.doc), false);
  } finally {
    a.limpar();
  }
});

test("CLI: invocado por symlink da raiz executa de verdade (antes: --check saía 0 sem conferir)", () => {
  const a = arvore();
  const atalho = `${a.raiz}-atalho`;
  try {
    symlinkSync(a.raiz, atalho);
    const r = a.rodar(["--check"], path.join(atalho, "scripts", "ci", "gerar-matriz-edge-tabela.mjs"));
    assert.equal(r.status, 1, "documento ausente tem de reprovar também pelo atalho");
  } finally {
    rmSync(atalho, { force: true });
    a.limpar();
  }
});

test("CLI: sem supabase/functions falha em vez de gerar matriz vazia", () => {
  const a = arvore();
  try {
    rmSync(path.join(a.raiz, "supabase"), { recursive: true });
    assert.notEqual(a.rodar().status, 0);
    assert.equal(existsSync(a.doc), false);
  } finally {
    a.limpar();
  }
});

// Não compara com o MATRIZ_EDGE_TABELA.md versionado: o estado-real.yml roda estes
// testes ANTES de regerar o documento.
test("repo real: toda pasta de função aparece na matriz, uma linha cada, sem _shared", () => {
  const dirFuncoes = path.join(AQUI, "..", "..", "supabase", "functions");
  const pastas = readdirSync(dirFuncoes, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith("_")).map((e) => e.name).sort();
  const matriz = montarMatriz(dirFuncoes);
  assert.deepEqual([...matriz.keys()], pastas);
  assert.ok(pastas.length >= 50, `esperava dezenas de funções, achei ${pastas.length}`);
  const md = renderizar(matriz);
  for (const f of pastas) assert.equal(md.split(`\n| \`${f}\` |`).length, 2, f);
  // Só invariantes: amostra presa ao código de uma função quebraria este teste (e o
  // estado-real.yml junto) na primeira mudança legítima daquela função.
  for (const tabelas of matriz.values()) {
    assert.deepEqual(tabelas, [...new Set(tabelas)].sort(), "tabelas únicas e ordenadas");
    for (const t of tabelas) assert.match(t, /^[A-Za-z_][\w.]*$/);
  }
});
