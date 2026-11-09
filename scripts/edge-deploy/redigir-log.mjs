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
import { resolve, relative, isAbsolute } from 'node:path';

const CHAVE_ALVO = /access[_%-]?token/gi;

export function redigir(texto, segredos = []) {
  let saida = texto;
  // 1. o valor literal, quando conhecido: é a remoção que de fato protege.
  for (const valor of segredos) {
    const v = String(valor ?? '').trim();
    if (v.length < 8) continue; // valor curto demais não é token; evita trocar texto comum
    saida = saida.split(v).join('***');
  }
  // 2. a chave, com o que sobrou de valor à direita (`access_token=abc`, `&access_token: x`).
  saida = saida.replace(new RegExp(`${CHAVE_ALVO.source}([=:])([^\\s"'&\\\\]*)`, 'gi'), 'token$1***');
  // 3. o nome da chave sem valor (ex.: "campo access_token ausente").
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
export function confinar(arquivo, base) {
  const raiz = resolve(base);
  const alvo = resolve(arquivo);
  const rel = relative(raiz, alvo);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`caminho fora da base permitida (${raiz}): ${arquivo}`);
  }
  // symlink: o alvo REAL também precisa estar dentro da base
  const raizReal = existsSync(raiz) ? realpathSync(raiz) : raiz;
  const alvoReal = existsSync(alvo) ? realpathSync(alvo) : alvo;
  const relReal = relative(raizReal, alvoReal);
  if (relReal === '' || relReal.startsWith('..') || isAbsolute(relReal)) {
    throw new Error(`caminho resolve para fora da base via link (${raizReal}): ${arquivo}`);
  }
  return alvo;
}

/** Base autorizada: explícita no CI, com RUNNER_TEMP como padrão do runner. */
function baseAutorizada() {
  return process.env.REDIGIR_LOG_BASE || process.env.RUNNER_TEMP || process.cwd();
}

function principal(argv) {
  const arquivo = argv[2];
  const nomes = argv.slice(3).filter((a) => a.startsWith('--segredo-env=')).map((a) => a.split('=')[1]);
  if (!arquivo) {
    console.error('::error::log de deploy não informado');
    process.exit(2);
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
  const original = readFileSync(caminho, 'utf8');
  const segredos = nomes.map((n) => process.env[n]).filter(Boolean);
  const limpo = redigir(original, segredos);
  const removidos = (original.match(CHAVE_ALVO) || []).length;
  writeFileSync(caminho, limpo);
  console.log(`log redigido: ${removidos} ocorrência(s) de chave de token, ${segredos.length} valor(es) literal(is) removido(s)`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) principal(process.argv);
