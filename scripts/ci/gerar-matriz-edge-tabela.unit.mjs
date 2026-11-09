import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
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

test("matriz de funcoes falsas lista as tabelas certas", () => {
  const matriz = montarMatriz(criarFuncoesFalsas());
  assert.deepEqual(
    [...matriz],
    [
      ["fn-a", ["contas_pagar", "empresas"]],
      ["fn-b", ["empresas", "profiles"]],
      ["fn-c", []],
    ],
  );
});

test("markdown cruza funcao x tabela nos dois sentidos", () => {
  const md = renderizar(montarMatriz(criarFuncoesFalsas()));
  assert.match(md, /\| `fn-a` \| `contas_pagar`, `empresas` \|/);
  assert.match(md, /\| `empresas` \| `fn-a`, `fn-b` \|/);
  assert.match(md, /\| `fn-c` \| — \|/);
  assert.match(md, /3 edge functions · 3 tabelas citadas · 1 funções sem/);
  assert.doesNotMatch(md, /ignorada|shared_nao_conta|financeiro/);
});
