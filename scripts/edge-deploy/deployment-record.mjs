// Porto de Zapp_Web_V2/scripts/edge-deploy/deployment-record.mjs (E60).
// Rastreabilidade do deploy de edge via GitHub Deployment.
//
// O Deployment criado pela plataforma (por `environment:`) aponta para a BRANCH,
// que anda. Em rollback, o que foi publicado é um ANCESTRAL, não a branch. Este
// módulo cria o Deployment que prende: `ref` = sha DEPLOYADO (não a branch),
// `payload` com run e escopo.

export const AMBIENTE_PADRAO = 'producao';

const SHA40 = /^[a-f0-9]{40}$/;

export function construirDeployment({ shaDeployado, ambiente = AMBIENTE_PADRAO, runId, runUrl, escopo }) {
  const sha = String(shaDeployado ?? '').trim().toLowerCase();
  if (!SHA40.test(sha)) {
    throw new Error(`shaDeployado precisa ser um sha de 40 hex: recebido "${shaDeployado}"`);
  }
  return {
    // `ref` é o sha deployado — NÃO a branch. É o único campo que prende o que
    // está no ar; se voltar a ser a branch, a etapa não entregou nada.
    ref: sha,
    environment: ambiente,
    description: `Deploy de edge functions — run ${runId}${escopo ? ` (escopo ${escopo})` : ''}`,
    // Sem `required_contexts: []` o GitHub recusa o deployment quando o sha não
    // tem todos os commit statuses (caso de um ancestral antigo, no rollback).
    required_contexts: [],
    auto_merge: false,
    transient_environment: false,
    production_environment: true,
    payload: {
      deployed_sha: sha,
      run_id: String(runId ?? ''),
      run_url: runUrl ?? '',
      escopo: escopo || 'all',
    },
  };
}

export function construirStatus({ id, estado = 'success', ambiente = AMBIENTE_PADRAO, runUrl, descricao }) {
  if (!id) throw new Error('status exige o id do deployment');
  return {
    deployment_id: id,
    state: estado,
    environment: ambiente,
    log_url: runUrl ?? '',
    description: descricao || `Deploy de edge functions (${estado})`,
    auto_inactive: false,
  };
}

export function resumirDeployment(d) {
  return `${d.environment} @ ${d.ref.slice(0, 8)} (run ${d.payload.run_id})`;
}
