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
  mkdirSync(path.join(dir, "fn-helper"));
  mkdirSync(path.join(dir, "fn-subtests"));
  mkdirSync(path.join(dir, "fn-subtests", "__tests__"));
  mkdirSync(path.join(dir, "_shared"));
  // fn-ok: body + validação + 422 + guard + teste que cobre invalid_json (evidência: 422 invalid_json no teste)
  writeFileSync(
    path.join(dir, "fn-ok", "index.ts"),
    `import { validateContract } from '../_shared/contract-validator.ts';\nimport { exigirUsuario } from '../_shared/auth-guard.ts';\nDeno.serve(async (req) => {\n  const u = await exigirUsuario(req);\n  if (!u.ok) return u.resposta;\n  let raw; try { raw = await req.json(); } catch { return createValidationErrorResponse([{ code: 'invalid_json', path: '$' }]); }\n  const v = await validateContract(Schema, raw);\n  if (!v.success) return v.response;\n  return new Response();\n});\n`,
  );
  writeFileSync(
    path.join(dir, "fn-ok", "index.test.ts"),
    `Deno.test('invalid_json vira 422', async () => { assertEquals(await handler('{'), 422); });\n`,
  );
  // fn-sembody: nenhum req.json/req.text
  writeFileSync(path.join(dir, "fn-sembody", "index.ts"), `Deno.serve(() => new Response('ok'));\n`);
  // fn-400: body com invalid_json 400 manual e sem validação
  writeFileSync(
    path.join(dir, "fn-400", "index.ts"),
    `Deno.serve(async (req) => {\n  let raw; try { raw = await req.json(); } catch { return new Response('bad', { status: 400 }); }\n  return new Response('ok');\n});\n`,
  );
  // fn-helper: consome body via parseJsonBody (helper que já emite 422 invalid_json)
  writeFileSync(
    path.join(dir, "fn-helper", "index.ts"),
    `import { parseJsonBody } from '../_shared/validation.ts';\nDeno.serve(async (req) => {\n  const b = await parseJsonBody(req, 'fn-helper');\n  if (!b.success) return b.response;\n  return new Response('ok');\n});\n`,
  );
  // fn-subtests: teste em __tests__/ (descoberta recursiva)
  writeFileSync(path.join(dir, "fn-subtests", "index.ts"), `Deno.serve(async (req) => { await req.json(); return new Response('ok'); });\n`);
  writeFileSync(
    path.join(dir, "fn-subtests", "__tests__", "payload_test.ts"),
    `Deno.test('payload', () => {});\n`,
  );
  writeFileSync(path.join(dir, "_shared", "contrato.ts"), "req.json() nao conta");
  return dir;
}

test("analisarFuncao detecta body, validacao, 422 (evidenciado) e guard", () => {
  const dir = criarDirFalso();
  const f = analisarFuncao(dir, "fn-ok");
  assert.equal(f.entradas.body, true);
  assert.equal(f.validacao.bodyCoberto, true);
  assert.equal(f.contrato.usa422, true);
  assert.equal(f.contrato.jsonMalformado, true);
  assert.ok(f.auth.guards.includes("exigirUsuario"));
  assert.equal(f.testes.existe, true);
  assert.equal(f.testes.cobremInvalidJson, "evidenciado");
  assert.ok(f.testes.arquivos.includes("index.test.ts"));
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

test("parseJsonBody conta como body e 422 (helper ja emite 422 invalid_json)", () => {
  const dir = criarDirFalso();
  const f = analisarFuncao(dir, "fn-helper");
  assert.equal(f.entradas.body, true);
  assert.equal(f.contrato.usa422, true);
  assert.equal(f.contrato.jsonMalformado, true);
});

test("testes em __tests__ sao descobertos recursivamente", () => {
  const dir = criarDirFalso();
  const f = analisarFuncao(dir, "fn-subtests");
  assert.equal(f.testes.existe, true);
  assert.deepEqual(f.testes.arquivos, ["__tests__/payload_test.ts"]);
});

test("montarMatriz ignora _shared e resumo calcula percentuais", () => {
  const dir = criarDirFalso();
  const matriz = montarMatriz(dir);
  const nomes = matriz.funcoes.map((f) => f.funcao).sort();
  assert.deepEqual(nomes, ["fn-400", "fn-helper", "fn-ok", "fn-sembody", "fn-subtests"]);
  const resumo = calcularResumo(matriz);
  assert.equal(resumo.total, 5);
  assert.equal(resumo.comBody, 4);
  assert.equal(resumo.bodyVal, 1);
  assert.equal(resumo.pctBodyValidado, 25);
});

test("renderizarMd lista as funcoes na tabela", () => {
  const dir = criarDirFalso();
  const matriz = montarMatriz(dir);
  const resumo = calcularResumo(matriz);
  const md = renderizarMd(matriz, resumo);
  assert.match(md, /\| `fn-ok` \| ✅ \| ✅ \| ✅ \| ✅ \| ✅ \|/);
  assert.match(md, /5 funções/);
});

test("cobremInvalidJson e sem-evidencia quando teste existe mas nao exercita parsing", () => {
  const dir = criarDirFalso();
  mkdirSync(path.join(dir, "fn-semevid"));
  writeFileSync(
    path.join(dir, "fn-semevid", "index.ts"),
    `Deno.serve(async (req) => { let raw; try { raw = await req.json(); } catch { return new Response('bad', { status: 400, headers: { 'x-code': 'invalid_json' } }); } return new Response('ok'); });\n`,
  );
  writeFileSync(path.join(dir, "fn-semevid", "index.test.ts"), `Deno.test('metodo', () => {});\n`);
  const f = analisarFuncao(dir, "fn-semevid");
  assert.equal(f.testes.existe, true);
  assert.equal(f.testes.cobremInvalidJson, "sem-evidencia");
  rmSync(dir, { recursive: true });
});