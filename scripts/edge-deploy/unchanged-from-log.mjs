#!/usr/bin/env node
// Porto de Zapp_Web_V2/scripts/edge-deploy/unchanged-from-log.mjs (E56).
// Extrator testável de "No change found in Function: X", com fixture do log real.
//
// Por que as duas propriedades abaixo importam:
//  - o CLI marca "No change found" quando o bundle local bate byte a byte com o
//    publicado e não bumpa a versão. Âncoras ^...$ não casavam a linha porque o
//    CLI emite ANSI mesmo com `tee` — o unchangedSet ficava vazio.
//  - sem âncoras, `\S+` captura também o eco do próprio script (o runner imprime
//    o comando com ANSI), que virava uma "função sem mudança" inexistente.
//
// Este módulo casa a linha com ANSI, em qualquer posição, e devolve o que a
// âncora dava (só saída do CLI vira slug): strip de ANSI, a frase precisa abrir
// a linha e o slug precisa ter forma de nome de função.

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ANSI = /\x1b\[[0-9;]*[A-Za-z]/g;
// A frase abre a linha; o resto tem de ser forma de slug. `\s*$` tolera \r de
// barra de progresso e espaço de alinhamento.
const LINHA = /^No change found in Function:\s+([A-Za-z0-9][A-Za-z0-9._-]*)\s*$/;
// Nome de função no projeto: minúsculo, dígitos e hífen.
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export function stripAnsi(texto) {
  return String(texto).replace(ANSI, '');
}

export function extractUnchangedSlugs(logBruto) {
  const vistos = new Set();
  const saida = [];
  for (const linha of stripAnsi(logBruto).split('\n')) {
    const m = linha.match(LINHA);
    if (!m) continue;
    const slug = m[1];
    if (!SLUG.test(slug)) continue;
    if (vistos.has(slug)) continue;
    vistos.add(slug);
    saida.push(slug);
  }
  return saida;
}

// Uso pelo workflow: node unchanged-from-log.mjs <log-do-deploy> <saida.json>
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [entrada, saida] = process.argv.slice(2);
  if (!entrada || !saida) {
    console.error('Uso: node unchanged-from-log.mjs <log-do-deploy> <saida.json>');
    process.exitCode = 1;
  } else {
    const slugs = extractUnchangedSlugs(readFileSync(entrada, 'utf8'));
    writeFileSync(saida, `${JSON.stringify(slugs)}\n`);
    console.log(`Funções sem mudança de bundle: ${slugs.length ? slugs.join(', ') : 'nenhuma'}`);
  }
}
