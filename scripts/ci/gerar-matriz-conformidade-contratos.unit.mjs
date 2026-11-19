import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { analisarFuncao, calcularResumo, montarMatriz, renderizarMd } from "./gerar-matriz-conformidade-contratos.mjs";

function criarDirFalso() {
  const dir = mkdtempSync(path.join(tmpdir(), "conformidade-"));
  mkdirSync(path.join(dir, "fn-ok"));
  mkdirSync(path.join(dir, "fn-sembody"));
  mkdirSync(path.join(dir, "fn-400"));
  mkdirSync(path.join(dir, "_shared"));
  // fn-ok: body + validação + 422 + guard + teste que cobre invalid_json
  writeFileSync(
    path.join(dir, "fn-ok", "index.ts"),
    `import { validateContract } from '../_shared/contract-validator.ts';\nimport { exigirUsuario } from '../_shared/auth-guard.ts';\nDeno.serve(async (req) => {\n  const u = await exigirUsuario(req);\n  if (!u.ok) return u.resposta;\n  let raw; try { raw = await req.json(); } catch { return createValidationErrorResponse([{ code: 'invalid_json', path: '$' }]); }\n  const v = await validateContract(Schema, raw);\n  if (!v.success) return v.response;\n  return new Response();\n});\n`,
  );
  writeFileSync(
    path.join(dir, "fn-ok", "index.test.ts"),
    `Deno.test('invalid_json vira 422', async () => { assertEquals((await handler('{')).status, 422); });\n`,
  );
  // fn-sembody: nenhum req.json/req.text
  writeFileSync(path.join(dir, "fn-sembody", "index.ts"), `Deno.serve(() => new Response('ok'));\n`);
  // fn-400: body com invalid_json 400 manual e sem validação
  writeFileSync(
    path.join(dir, "fn-400", "index.ts"),
    `Deno.serve(async (req) => {\n  let raw; try { raw = await req.json(); } catch { return new Response('bad', { status: 400 }); }\n  return new Response('ok');\n});\n`,
  );
  writeFileSync(path.join(dir, "_shared", "contrato.ts"), "req.json() nao conta");
  return dir;
}

test("analisarFuncao detecta body, validacao, 422, guard e teste", () => {
  const dir = criarDirFalso();
  const f = analisarFuncao(dir, "fn-ok");
  assert.equal(f.entradas.body, true);
  assert.equal(f.validacao.bodyCoberto, true);
  assert.equal(f.contrato.usa422, true);
  assert.equal(f.contrato.jsonMalformado, true);
  assert.ok(f.auth.guards.includes("exigirUsuario"));
  assert.equal(f.testes.existe, true);
  assert.equal(f.testes.cobremInvalidJson, true);
});

test("funcao sem body e detectada como sem consumidor", () => {
  const dir = criarDirFalso();
  const f = analisarFuncao(dir, "fn-sembody");
  assert.equal(f.entradas.body, false);
  assert.equal(f.validacao.semBodyDetectavel, true);
});

test("funcao com 400 manual nao conta como usa422", () => {
  const dir = criarDirFalso();
  const f = analisarFuncao(dir, "fn-400");
  assert.equal(f.contrato.usa422, false);
  assert.equal(f.testes.existe, false);
});

test("montarMatriz ignora _shared e resumo calcula percentuais", () => {
  const dir = criarDirFalso();
  const matriz = montarMatriz(dir);
  const nomes = matriz.funcoes.map((f) => f.funcao).sort();
  assert.deepEqual(nomes, ["fn-400", "fn-ok", "fn-sembody"]);
  const resumo = calcularResumo(matriz);
  assert.equal(resumo.total, 3);
  assert.equal(resumo.comBody, 2);
  assert.equal(resumo.bodyVal, 1);
  assert.equal(resumo.pctBodyValidado, 50);
});

test("renderizarMd lista as funcoes na tabela", () => {
  const dir = criarDirFalso();
  const matriz = montarMatriz(dir);
  const resumo = calcularResumo(matriz);
  const md = renderizarMd(matriz, resumo);
  assert.match(md, /\| `fn-ok` \| ✅ \| ✅ \| ✅ \| ✅ \|/);
  assert.match(md, /3 funções/);
});

test("arquivos de teste sao listados por nome", () => {
  const dir = criarDirFalso();
  const f = analisarFuncao(dir, "fn-ok");
  assert.deepEqual(f.testes.arquivos, ["index.test.ts"]);
});