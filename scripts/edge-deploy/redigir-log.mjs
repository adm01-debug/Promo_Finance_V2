#!/usr/bin/env node
// Porto de Zapp_Web_V2/scripts/edge-deploy/redigir-log.mjs (E74).
// O log do deploy vai para o artifact do GitHub. A saída do CLI Supabase carrega
// URL com `access_token=` embutido — publicar isso num storage de terceiro é
// publicar credencial. Este módulo reescreve o arquivo removendo o valor do
// segredo e a própria chave antes do upload.
//
// O valor NUNCA entra no código nem na saída: vem do ambiente pelo nome da
// variável (--segredo-env=SUPABASE_ACCESS_TOKEN). O que este módulo imprime é
// somente a contagem.
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHAVE_ALVO = /access(?:%5F|[_%-])?token/gi;

// Sequência ANSI (CSI) — o CLI colore a saída mesmo com `tee`.
const ANSI = String.raw`\x1b\[[0-9;?]*[ -/]*[@-~]`;
// O que pode aparecer NO MEIO de um valor sem deixar de ser o mesmo valor:
// cor ANSI e quebra de linha com recuo (log dobrado em 80 colunas).
const MEIO = `(?:${ANSI}|\\r?\\n[ \\t]*)*`;
const LIMITE_TOLERANTE = 512; // acima disso a regex por caractere deixa de valer o custo

// Credenciais reconhecíveis pela FORMA, mesmo sem o valor literal em mãos.
const FORMATOS = [
  // JWT (anon/service_role do Supabase, id tokens): header e payload começam por `{"` → eyJ
  /eyJ[A-Za-z0-9_-]{8,8192}\.eyJ[A-Za-z0-9_-]{8,}(?:\.[A-Za-z0-9_-]*)?/g,
  // PAT do Supabase (sbp_…), chaves novas sb_secret_…
  /\bsbp_[A-Za-z0-9_]{8,}/g,
  /\bsb_secret_[A-Za-z0-9_-]{8,}/g,
  // tokens do GitHub
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  // webhook do Slack: a URL inteira é a credencial
  /(?<=https:\/\/hooks\.slack\.com\/services\/)[A-Za-z0-9/_-]+/g,
];
// `Bearer <credencial>` solto (16+ para não trocar prosa como "Bearer authentication").
const BEARER = /\b(Bearer)([ \t]+)[A-Za-z0-9._~+/=-]{16,}/gi;
// Senha embutida em URL: postgres://usuario:SENHA@host. Guloso até o último `@`
// da autoridade — senha com `@` sem escape não pode sobrar pela metade.
// Quantificadores limitados ({0,31}, {0,40}) de propósito: sem teto, uma linha longa de
// `a.a.a.` ou de `-----` custava tempo quadrático.
const URL_COM_SENHA = /\b([a-z][a-z0-9+.-]{0,31}:\/\/[^\s:/@]*):[^\s/]+@/gi;
// Em URL de banco a senha pode trazer `/` cru; ali vale ir até o último `@` da palavra.
const URL_BANCO_COM_SENHA = /\b((?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|rediss|amqps?):\/\/[^\s:/@]*):\S+@/gi;
// Flag de CLI com o valor no argumento seguinte: `--password S3nh4`, `--token "x y"`.
const FLAG_SENSIVEL = /(--[a-z0-9-]{0,40}(?:token|password|secret|key))([ \t]+)(?!-)(?:"[^"\r\n]*"|'[^'\r\n]*'|\S+)/gi;
// `curl -u usuario:senha` / `--user usuario:senha`.
const USUARIO_SENHA = /(\s(?:-u|--user)[ \t]+[^\s:]+):\S+/g;
// Chave sensível + separador + valor, nas formas que aparecem em log:
// `k=v`, `k: v`, `k = "v"`, `"k":"v"`, `\"k\":\"v\"`, `k => v`, `k%3Dv`, `k: Bearer v`.
// `[_-]key` cobre os nomes do env.manifest.json (NFE_CERT_MASTER_KEY, *_SERVICE_KEY…).
const SENSIVEL = new RegExp(
  '((?:token|secret|password|passwd|senha|apikey|authorization' +
    '|(?:api|anon|service[_-]?role|role|private|signing|encryption|access)key|[_-]key)' +
    '(?:[_-](?:prev|old|new|next|v?\\d+))?)' +
    `((?:${ANSI})*\\\\*["']?(?:${ANSI})*[ \\t]*(?:=>|%3[Dd]|[=:])[ \\t]*(?:${ANSI})*)` +
    '(' +
    '"(?:[^"\\\\\\r\\n]|\\\\.)*"' +
    "|'(?:[^'\\\\\\r\\n]|\\\\.)*'" +
    '|\\\\+"[^"\\r\\n]*?\\\\+"' +
    // aspa aberta e nunca fechada (linha de log truncada): o valor vai até o primeiro espaço
    "|\\\\*[\"'][^\\s\"'&\\\\]*" +
    "|(?:(?:bearer|basic|token)[ \\t]+)?[^\\s\"'&]+" +
    ')',
  'gi',
);

const escaparRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Formas em que o MESMO valor aparece num log: cru, percent-encoded (URL),
// escapado de JSON e, se multilinha (PEM, JSON de service account), linha a linha.
function variantes(valor) {
  const v = String(valor ?? '').trim();
  if (v.length < 8) return []; // valor curto demais não é token; evita trocar texto comum
  const formas = new Set([v]);
  try {
    formas.add(encodeURIComponent(v));
  } catch {
    /* surrogate solto: sem forma percent-encoded */
  }
  formas.add(JSON.stringify(v).slice(1, -1));
  for (const linha of v.split(/\r?\n/)) {
    const l = linha.trim();
    if (l.length >= 8) formas.add(l);
  }
  // a mais longa primeiro: a forma inteira sai antes dos pedaços dela
  return [...formas].sort((a, b) => b.length - a.length);
}

export function redigir(texto, segredos = []) {
  let saida = texto;
  // 1. o valor literal, quando conhecido: é a remoção que de fato protege.
  for (const valor of segredos) {
    for (const v of variantes(valor)) {
      saida = saida.split(v).join('***');
      // o mesmo valor cortado por cor ANSI ou por quebra de linha do log
      if (v.length <= LIMITE_TOLERANTE) {
        saida = saida.replace(new RegExp([...v].map(escaparRegex).join(MEIO), 'g'), '***');
      }
    }
  }
  // 2. credencial reconhecível pela forma (JWT, sbp_, sb_secret_, gh*_), Bearer e senha em URL.
  for (const formato of FORMATOS) saida = saida.replace(formato, '***');
  saida = saida.replace(BEARER, '$1$2***');
  saida = saida.replace(URL_BANCO_COM_SENHA, '$1:***@');
  saida = saida.replace(URL_COM_SENHA, '$1:***@');
  // 3. a chave sensível, com o que sobrou de valor à direita (`access_token=abc`,
  //    `"access_token":"abc"`, `access_token: abc`, `Authorization: Bearer abc`).
  saida = saida.replace(FLAG_SENSIVEL, '$1$2***');
  saida = saida.replace(USUARIO_SENHA, '$1:***');
  saida = saida.replace(SENSIVEL, (_m, chave, separador, valorBruto) => {
    const aspa = /^\\*["']/.exec(valorBruto)?.[0] ?? '';
    return `${chave}${separador}${aspa}***${aspa}`;
  });
  // 4. o nome da chave sem valor (ex.: "campo access_token ausente").
  saida = saida.replace(CHAVE_ALVO, (m) => (m === 'token' ? m : 'token'));
  return saida;
}

/**
 * Confina o caminho de escrita ao diretório-base autorizado.
 *
 * O caminho chega por argumento de CLI e o módulo ESCREVE nele. Sem confinamento,
 * `..` ou um caminho absoluto fora da base fazem o script sobrescrever arquivo
 * arbitrário. A base vem de REDIGIR_LOG_BASE, com RUNNER_TEMP como padrão no CI.
 */
// `..` exato ou `../algo` — um arquivo chamado `..rascunho.log` está DENTRO da base.
const foraDaBase = (rel) => rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel);

export function confinar(arquivo, base) {
  const raiz = resolve(base);
  const alvo = resolve(arquivo);
  const rel = relative(raiz, alvo);
  if (rel === '' || foraDaBase(rel)) {
    throw new Error(`caminho fora da base permitida (${raiz}): ${arquivo}`);
  }
  // symlink: o alvo REAL também precisa estar dentro da base
  const raizReal = existsSync(raiz) ? realpathSync(raiz) : raiz;
  const alvoReal = existsSync(alvo) ? realpathSync(alvo) : alvo;
  const relReal = relative(raizReal, alvoReal);
  if (relReal === '' || foraDaBase(relReal)) {
    throw new Error(`caminho resolve para fora da base via link (${raizReal}): ${arquivo}`);
  }
  return alvo;
}

/** Base autorizada: explícita no CI, com RUNNER_TEMP como padrão do runner. */
function baseAutorizada() {
  return process.env.REDIGIR_LOG_BASE || process.env.RUNNER_TEMP || process.cwd();
}

const USO = 'Uso: node scripts/edge-deploy/redigir-log.mjs <log> [--segredo-env=NOME_DA_VARIAVEL ...]';

function principal(argv) {
  const extras = argv.slice(2);
  if (extras.includes('-h') || extras.includes('--help')) {
    console.log(USO);
    console.log('Reescreve <log> sem credenciais. O log precisa estar dentro de REDIGIR_LOG_BASE (padrão: RUNNER_TEMP, senão o diretório atual).');
    console.log('Exit: 0 redigido | 2 log ausente, fora da base ou argumento inválido (o log NÃO foi redigido — não publique).');
    return;
  }
  const arquivo = argv[2];
  if (!arquivo || arquivo.startsWith('--')) {
    console.error('::error::log de deploy não informado');
    console.error(USO);
    process.exit(2);
  }
  // Argumento que não é `--segredo-env=NOME` aborta: `--segredo-env NOME` (sem `=`)
  // passava calado e o valor literal ficava no artifact.
  const nomes = [];
  for (const a of argv.slice(3)) {
    const m = /^--segredo-env=([A-Za-z_][A-Za-z0-9_]*)$/.exec(a);
    if (!m) {
      console.error(`::error::argumento não reconhecido: ${a}`);
      console.error(USO);
      process.exit(2);
    }
    nomes.push(m[1]);
  }
  let caminho;
  try {
    caminho = confinar(arquivo, baseAutorizada());
  } catch (erro) {
    console.error(`::error::${erro.message}`);
    process.exit(2);
  }
  if (!existsSync(caminho)) {
    console.error(`::error::log de deploy não encontrado: ${caminho}`);
    process.exit(2);
  }
  let original;
  try {
    original = readFileSync(caminho, 'utf8');
  } catch (erro) {
    console.error(`::error::log de deploy ilegível (${erro.code ?? erro.message}): ${caminho}`);
    process.exit(2);
  }
  const segredos = [];
  for (const n of nomes) {
    const valor = process.env[n];
    if (!valor || valor.trim().length < 8) {
      // Só o NOME vai para o log. Sem o valor, sobra a redação por forma e por chave.
      console.error(`::warning::${n} ausente ou curto demais: o valor literal dele não será procurado no log`);
      continue;
    }
    segredos.push(valor);
  }
  const limpo = redigir(original, segredos);
  const removidos = (original.match(CHAVE_ALVO) || []).length;
  writeFileSync(caminho, limpo);
  console.log(`log redigido: ${removidos} ocorrência(s) de chave de token, ${segredos.length} valor(es) literal(is) removido(s)`);
}

// realpath + pathToFileURL: comparar com `file://${argv[1]}` cru falhava com espaço,
// acento ou symlink no caminho — o script saía 0 SEM redigir nada.
function invocadoDireto() {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (invocadoDireto()) principal(process.argv);
