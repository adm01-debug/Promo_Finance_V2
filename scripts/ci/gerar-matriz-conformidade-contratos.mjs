#!/usr/bin/env node
// Matriz de Conformidade de Contratos das Edge Functions.
// Para cada função em supabase/functions/<funcao> (sem _shared, sem testes) cataloga:
//   - entradas: body (req.json, req.text, req.arrayBuffer, parseJsonBody, readJson), query, headers
//   - validação: uso de validatePayload / validateContract / validateVersionedContract / safeParse
//   - contrato: response 422 canônica (createValidationErrorResponse ou parseJsonBody — que já a emite),
//     tratamento de JSON malformado (invalid_json), contrato versionado
//   - auth: guards usados (exigirUsuario / exigirVinculoEmpresa / guardInternal / segredo) e verify_jwt
//   - testes: busca recursiva (inclui __tests__/); cobertura de JSON malformado só quando há evidência
//     real no corpo do teste (resposta esperada com invalid_json / JSON malformado)
// Saída: docs/contract-conformance.json + resumo em docs/contract-conformance-summary.md
// Uso: node scripts/ci/gerar-matriz-conformidade-contratos.mjs [--check]
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SAIDA_JSON = "docs/contract-conformance.json";
const SAIDA_MD = "docs/contract-conformance-summary.md";

export const PADRAO_BODY = /req\.json\s*\(|req\.text\s*\(|req\.arrayBuffer\s*\(|parseJsonBody\s*\(|readJson\s*\(/;
export const PADRAO_VALIDACAO = /validatePayload\s*\(|validateContract\s*\(|validateVersionedContract\s*\(|\.safeParse\s*\(/;
export const PADRAO_INVALID_JSON = /invalid_json|JSON malformado|JSON malformado/;
export const PADRAO_BODY_HELPER = /parseJsonBody\s*\(|readJson\s*\(/;
export const PADRAO_422 = /createValidationErrorResponse\s*\(|parseJsonBody\s*\(/;
export const PADRAO_VERSION = /x-contract-version|versioned-contract/;
export const PADRAO_QUERY = /URLSearchParams|searchParams|req\.url/;
export const PADRAO_EVIDENCIA_TESTS = /invalid_json|JSON malformado|malformado/;
export const GUARDS = ["exigirUsuario", "exigirVinculoEmpresa", "guardInternal", "authorizeSharedSecret", "requireAuth"];

export function extrairDirFuncoes(dirFuncoes) {
  return readdirSync(dirFuncoes, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name)
    .sort();
}

function listarTsRecursivo(dir) {
  const saida = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) saida.push(...listarTsRecursivo(p));
    else if (e.name.endsWith(".ts")) saida.push(p);
  }
  return saida;
}

function listarTestes(dir) {
  const todos = listarTsRecursivo(dir);
  return todos
    .filter((p) => p.endsWith("_test.ts") || p.endsWith(".test.ts"))
    .map((p) => path.relative(dir, p).split(path.sep).join("/"))
    .sort();
}

export function analisarFuncao(dir, nome) {
  const pasta = path.join(dir, nome);
  const arquivosFonte = listarTsRecursivo(pasta).filter((p) => !/_test\.ts$|\.test\.ts$/.test(p));
  const fonte = arquivosFonte.map((a) => readFileSync(a, "utf8")).join("\n");
  const arquivosTests = listarTestes(pasta);
  const conteudoTests = arquivosTests.map((t) => readFileSync(path.join(pasta, t), "utf8")).join("\n");
  const temTeste = arquivosTests.length > 0;
  const temBody = PADRAO_BODY.test(fonte);
  const temValidacao = PADRAO_VALIDACAO.test(fonte);
  const temJsonMalformado = PADRAO_INVALID_JSON.test(fonte) || PADRAO_BODY_HELPER.test(fonte);
  const usa422 = PADRAO_422.test(fonte);
  const usaVersao = PADRAO_VERSION.test(fonte);
  const usaQuery = PADRAO_QUERY.test(fonte);
  const guards = GUARDS.filter((g) => fonte.includes(g));
  const corpoCoberto = !temBody || temValidacao;
  const semConsumidor = fonte.includes("Deno.serve") && !temBody;
  const evidenciaTests = PADRAO_EVIDENCIA_TESTS.test(conteudoTests);
  const cobremInvalidJson = temTeste && temJsonMalformado && evidenciaTests
    ? "evidenciado"
    : temTeste && temJsonMalformado
      ? "sem-evidencia"
      : "sem-teste";

  return {
    funcao: nome,
    entradas: {
      body: temBody,
      queryOuUrl: usaQuery,
      header: fonte.includes("req.headers"),
    },
    validacao: {
      declaraSchema: temValidacao,
      bodyCoberto: corpoCoberto,
      semBodyDetectavel: semConsumidor,
    },
    auth: { guards, quantos: guards.length },
    contrato: {
      usa422,
      jsonMalformado: temJsonMalformado,
      versionado: usaVersao,
    },
    testes: { existe: temTeste, cobremInvalidJson, arquivos: arquivosTests },
  };
}

export function montarMatriz(dirFuncoes) {
  const linhas = [];
  for (const f of extrairDirFuncoes(dirFuncoes)) {
    try {
      linhas.push(analisarFuncao(dirFuncoes, f));
    } catch {
      linhas.push({ funcao: f, erro: true });
    }
  }
  return { gerado: new Date().toISOString(), funcoes: linhas };
}

export function calcularResumo(matriz) {
  const total = matriz.funcoes.length;
  const comBody = matriz.funcoes.filter((f) => f.entradas?.body).length;
  const bodyVal = matriz.funcoes.filter((f) => f.entradas?.body && f.validacao?.bodyCoberto).length;
  const comTeste = matriz.funcoes.filter((f) => f.testes?.existe).length;
  const jsonMalformado = matriz.funcoes.filter((f) => f.contrato?.jsonMalformado).length;
  const semBody = matriz.funcoes.filter((f) => f.validacao?.semBodyDetectavel).length;
  const cobremEvidenciado = matriz.funcoes.filter((f) => f.testes?.cobremInvalidJson === "evidenciado").length;
  return {
    total, comBody, bodyVal, comTeste, jsonMalformado, semBody, cobremEvidenciado,
    pctBodyValidado: comBody ? Math.round((bodyVal / comBody) * 1000) / 10 : 100,
    pctComTeste: total ? Math.round((comTeste / total) * 1000) / 10 : 0,
  };
}

export function renderizarJson(matriz) {
  return JSON.stringify(matriz, null, 2) + "\n";
}

export function renderizarMd(matriz, resumo) {
  const linhas = [
    "# Conformidade de Contratos — Edge Functions",
    "",
    "> Gerado por `node scripts/ci/gerar-matriz-conformidade-contratos.mjs` — não editar à mão.",
    "> Detalhe completo: `docs/contract-conformance.json`.",
    "",
    `**${resumo.total} funções · ${resumo.comBody} consomem body · ${resumo.bodyVal} com validação (${resumo.pctBodyValidado}%) · ${resumo.comTeste} com teste local (${resumo.pctComTeste}%) · ${resumo.jsonMalformado} tratam \`invalid_json\` · ${resumo.cobremEvidenciado} com cobertura evidenciada de JSON malformado · ${resumo.semBody} sem body detectável.**`,
    "",
    "## Por função",
    "",
    "| Função | Body | Valida | 422 | invalid_json | Cobertura json inv. | Guard(s) | Teste |",
    "|---|---|---|---|---|---|---|---|",
  ];
  for (const f of matriz.funcoes) {
    if (f.erro) {
      linhas.push(`| \`${f.funcao}\` | — | erro de leitura | — | — | — | — | — |`);
      continue;
    }
    const sim = "✅", nao = "—";
    const guards = f.auth.guards.length ? f.auth.guards.join(", ") : "—";
    const cov = f.testes.cobremInvalidJson === "evidenciado" ? sim : f.testes.cobremInvalidJson === "sem-evidencia" ? "?" : nao;
    linhas.push(
      `| \`${f.funcao}\` | ${f.entradas.body ? sim : nao} | ${f.validacao.bodyCoberto ? sim : nao} | ${f.contrato.usa422 ? sim : nao} | ${f.contrato.jsonMalformado ? sim : nao} | ${cov} | ${guards} | ${f.testes.existe ? sim : nao} |`,
    );
  }
  return linhas.join("\n") + "\n";
}

function normalizarParaComparacao(conteudo) {
  const obj = JSON.parse(conteudo);
  delete obj.gerado;
  return JSON.stringify(obj, null, 2) + "\n";
}

export function main(argv = process.argv.slice(2)) {
  if (argv.includes("-h") || argv.includes("--help")) {
    console.log("Uso: node scripts/ci/gerar-matriz-conformidade-contratos.mjs [--check]");
    console.log(`  (sem argumento)  escreve ${SAIDA_JSON} e ${SAIDA_MD}`);
    console.log(`  --check          sai 1 se ${SAIDA_JSON} ou ${SAIDA_MD} estiverem desatualizados`);
    return 0;
  }
  const desconhecido = argv.find((a) => a !== "--check");
  if (desconhecido !== undefined) {
    console.error(`argumento desconhecido: ${desconhecido} (use --check ou --help)`);
    return 2;
  }
  const matriz = montarMatriz(path.join(RAIZ, "supabase/functions"));
  const resumo = calcularResumo(matriz);
  const json = renderizarJson(matriz);
  const md = renderizarMd(matriz, resumo);
  const destJson = path.join(RAIZ, SAIDA_JSON);
  const destMd = path.join(RAIZ, SAIDA_MD);
  if (argv.includes("--check")) {
    const ok =
      existsSync(destJson) &&
      normalizarParaComparacao(readFileSync(destJson, "utf8")) === normalizarParaComparacao(json) &&
      existsSync(destMd) &&
      readFileSync(destMd, "utf8") === md;
    if (!ok) {
      console.error(`${SAIDA_JSON}/${SAIDA_MD} desatualizados: rode node scripts/ci/gerar-matriz-conformidade-contratos.mjs`);
      return 1;
    }
    console.log(`OK: ${SAIDA_JSON} e ${SAIDA_MD} em dia.`);
    return 0;
  }
  mkdirSync(path.dirname(destJson), { recursive: true });
  writeFileSync(destJson, json);
  writeFileSync(destMd, md);
  console.log(`${SAIDA_JSON} e ${SAIDA_MD} gerados`);
  return 0;
}

function invocadoDireto() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (invocadoDireto()) {
  process.exitCode = main();
}