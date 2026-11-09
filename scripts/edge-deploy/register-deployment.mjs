#!/usr/bin/env node
// Porto de Zapp_Web_V2/scripts/edge-deploy/register-deployment.mjs (E60).
// Registra o Deployment de rastreabilidade do deploy de edge.
//
// Best-effort por decisão: falha ao registrar AVISA e não derruba o deploy (o
// código já está no ar quando este passo roda — falhar aqui não despublica nada
// e só esconde o resultado do operador).
import { appendFileSync } from 'node:fs';
import { construirDeployment, construirStatus, resumirDeployment } from './deployment-record.mjs';

const {
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
  GITHUB_RUN_ID,
  GITHUB_SERVER_URL = 'https://github.com',
  GITHUB_OUTPUT,
  DEPLOYED_GIT_SHA,
  ESCOPO,
} = process.env;

const api = process.env.GITHUB_API_URL || 'https://api.github.com';
const runUrl = `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;

/**
 * Monta o destino da requisição com allowlist de host.
 *
 * O `fetch` abaixo carrega `Authorization: Bearer <GITHUB_TOKEN>`. Aceitar o
 * destino cru de `GITHUB_API_URL` significa entregar o token para quem controlar
 * essa variável de ambiente no runner.
 *
 * Regras: https obrigatório (http entregaria o token em claro), host na allowlist
 * (api.github.com, ou o host do GitHub Enterprise vindo de GITHUB_SERVER_URL) e
 * caminho começando com '/' e sem travessia.
 */
/**
 * Neutraliza quebra de linha e caracteres de controle em valor vindo da API
 * antes de ele virar linha de log ou de GITHUB_OUTPUT.
 *
 * Duas razões distintas, e a segunda é a mais séria:
 *   - `::notice::` e `::warning::` são COMANDOS de workflow no Actions: uma quebra
 *     de linha no valor forja um comando novo, inclusive um `::error::`.
 *   - o protocolo de `GITHUB_OUTPUT` é `nome=valor` por linha: uma quebra de linha
 *     no valor abre VARIÁVEL NOVA no job seguinte.
 */
const semQuebra = (valor) => String(valor ?? '').replace(/[\r\n\u0000-\u001f\u007f]/g, ' ');

export function resolverDestino(apiUrl, caminho, serverUrl = process.env.GITHUB_SERVER_URL) {
  const base = String(apiUrl ?? '').trim().replace(/\/+$/, '');
  let destino;
  try {
    destino = new URL(base);
  } catch {
    throw new Error(`destino recusado (URL inválida): ${base}`);
  }
  if (destino.protocol !== 'https:') {
    throw new Error(`destino não permitido (exige https, recebido ${destino.protocol}, host ${destino.host}): ${base}`);
  }
  let hostEnterprise = null;
  if (serverUrl) {
    try {
      hostEnterprise = new URL(String(serverUrl)).host;
    } catch {
      hostEnterprise = null;
    }
  }
  const eApiPublica = destino.host === 'api.github.com' && (destino.pathname === '/' || destino.pathname === '');
  const eEnterprise = hostEnterprise !== null && destino.host === hostEnterprise;
  if (!eApiPublica && !eEnterprise) {
    throw new Error(`destino não permitido (allowlist): host ${destino.host}`);
  }
  const c = String(caminho ?? '');
  if (!c.startsWith('/') || c.includes('..')) {
    throw new Error(`caminho recusado (precisa começar com / e não conter ..): ${c}`);
  }
  return `${base}${c}`;
}

async function post(caminho, corpo) {
  const r = await fetch(resolverDestino(api, caminho, GITHUB_SERVER_URL), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(corpo),
  });
  if (!r.ok) throw new Error(`${caminho} -> ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

try {
  const dep = await post(
    `/repos/${GITHUB_REPOSITORY}/deployments`,
    construirDeployment({ shaDeployado: DEPLOYED_GIT_SHA, runId: GITHUB_RUN_ID, runUrl, escopo: ESCOPO }),
  );
  const st = await post(
    `/repos/${GITHUB_REPOSITORY}/deployments/${dep.id}/statuses`,
    construirStatus({ id: dep.id, runUrl }),
  );
  console.log(`::notice::Deployment registrado: ${semQuebra(resumirDeployment(dep))} (id=${semQuebra(dep.id)}, status=${semQuebra(st.state)})`);
  console.log(`deployment_id=${semQuebra(dep.id)}`);
  if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `deployment_id=${semQuebra(dep.id)}\n`);
} catch (e) {
  // Nunca derruba o deploy: o passo é best-effort desde a tag.
  console.log(`::warning::Falha ao registrar o Deployment (deploy não afetado): ${semQuebra(e.message)}`);
}
