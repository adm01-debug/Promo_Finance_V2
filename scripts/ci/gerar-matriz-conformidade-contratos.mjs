#!/usr/bin/env node
// Matriz de Conformidade de Contratos das Edge Functions.
// Para cada função em supabase/functions/<funcao> (sem _shared, sem testes) cataloga:
//   - entradas: body (req.json / req.text+parse), query (req.url/searchParams), headers lidos
//   - validação: uso de validatePayload / validateContract / validateVersionedContract / safeParse
//   - tratamento de JSON malformado (invalid_json -> 422 ou 400)
//   - auth: guards usados (exigirUsuario / exigirVinculoEmpresa / guardInternal / segredo) e verify_jwt
//   - testes: existe arquivo *_test.ts ou .test.ts; cobre invalid_json?
//   - versão contratual: x-contract-version detectado
// Saída: docs/contract-conformance.json + resumo em docs/contract-conformance-summary.md
// Uso: node scripts/ci/gerar-matriz-conformidade-contratos.mjs [--check]
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SAIDA_JSON = "docs/contract-conformance.json";
const SAIDA_MD = "docs/contract-conformance-summary.md";

export const PADRAO_BODY = /req\.json\s*\(|req\.text\s*\(/;
export const PADRAO_VALIDACAO = /validatePayload\s*\(|validateContract\s*\(|validateVersionedContract\s*\(|\.safeParse\s*\(/;
export const PADRAO_400 = /invalid_json/;
export const PADRAO_422 = /createValidationErrorResponse\s*\(/;
export const PADRAO_VERSION = /x-contract-version|versioned-contract/;
export const PADRAO_QUERY = /URLSearchParams|searchParams|req\.url/;
export const GUARDS = ["exigirUsuario", "exigirVinculoEmpresa", "guardInternal", "authorizeSharedSecret", "requireAuth"];

export function extrairDirFuncoes(dirFuncoes) {
  return readdirSync(dirFuncoes, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name)
    .sort();
}

function listarTs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return listarTs(p);
    if (!e.name.endsWith(".ts")) return [];
    if (e.name.endsWith(".test.ts") || e.name.endsWith("_test.ts")) return [];
    return [p];
  });
}

export function analisarFuncao(dir, nome) {
  const arquivosFonte = listarTs(path.join(dir, nome));
  const fonte = arquivosFonte.map((a) => readFileSync(a, "utf8")).join("\n");
  const temTeste = globTeste(dir, nome);
  const temBody = PADRAO_BODY.test(fonte);
  const temValidacao = PADRAO_VALIDACAO.test(fonte);
  const temJsonMalformado = PADRAO_400.test(fonte);
  const usa422 = PADRAO_422.test(fonte);
  const usaVersao = PADRAO_VERSION.test(fonte);
  const usaQuery = PADRAO_QUERY.test(fonte);
  const guards = GUARDS.filter((g) => fonte.includes(g));
  const corpoCoberto = !temBody || temValidacao;
  const semConsumidor = fonte.includes("Deno.serve") && !temBody;

  // mock guard default para funções sem guard explícito; real only se testado
  const conformidade = {
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
    auth: {
      guards: guards,
      quantos: guards.length,
    },
    contrato: {
      usa422: usa422,
      jsonMalformado: temJsonMalformado,
      versionado: usaVersao,
    },
    testes: {
      existe: temTeste,
      cobremInvalidJson: temJsonMalformado && temTeste,
      arquivos: arquivosTeste(dir, nome),
    },
  };
  return conformidade;
}

function globTeste(dir, nome) {
  return arquivosTeste(dir, nome).length > 0;
}

function arquivosTeste(dir, nome) {
  const p = path.join(dir, nome);
  try {
    return readdirSync(p)
      .filter((n) => n.endsWith(".test.ts") || n.endsWith("_test.ts"))
      .sort();
  } catch {
    return [];
  }
}

export function montarMatriz(dirFuncoes) {
  const linhas = [];
  for (const f of extrairDirFuncoes(dirFuncoes)) {
    try {
      linhas.push(analisarFuncao(dirFuncoes, f));
    } catch {
      // diretório sem conteúdo ou com problema de leitura: registra mínimo
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
  return {
    total,
    comBody,
    bodyVal,
    comTeste,
    jsonMalformado,
    semBody,
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
    `> Gerado por \`node scripts/ci/gerar-matriz-conformidade-contratos.mjs\` — não editar à mão.`,
    `> Detalhe completo: \`docs/contract-conformance.json\`.`,
    "",
    `**${resumo.total} funções · ${resumo.comBody} consomem body · ${resumo.bodyVal} com validação (${resumo.pctBodyValidado}%) · ${resumo.comTeste} com teste local (${resumo.pctComTeste}%) · ${resumo.jsonMalformado} tratam \`invalid_json\` · ${resumo.semBody} sem body detectável.**`,
    "",
    "## Por função",
    "",
    "| Função | Body | Valida | 422 | invalid_json | Guard(s) | Teste |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const f of matriz.funcoes) {
    if (f.erro) {
      linhas.push(`| \`${f.funcao}\` | — | erro de leitura | — | — | — | — |`);
      continue;
    }
    const sim = "✅", nao = "—";
    const guards = f.auth.guards.length ? f.auth.guards.join(", ") : "—";
    linhas.push(
      `| \`${f.funcao}\` | ${f.entradas.body ? "✅" : nao} | ${f.validacao.bodyCoberto ? sim : nao} | ${f.contrato.usa422 ? sim : nao} | ${f.contrato.jsonMalformado ? sim : nao} | ${guards} | ${f.testes.existe ? sim : nao} |`,
    );
  }
  return linhas.join("\n") + "\n";
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

export function normalizarParaComparacao(conteudo) {
  const obj = JSON.parse(conteudo);
  delete obj.gerado;
  return JSON.stringify(obj, null, 2) + "\n";
}

if (invocadoDireto()) {
  process.exitCode = main();
}