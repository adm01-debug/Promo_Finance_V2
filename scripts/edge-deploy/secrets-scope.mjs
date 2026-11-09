#!/usr/bin/env node
// Porto de Zapp_Web_V2/scripts/edge-deploy/secrets-scope.mjs (E58), adaptado ao
// Promo_Finance_V2: os secrets de escopo vêm do env.manifest.json (dest
// supabase_vault, required=true), a mesma fonte do gate do migrate-functions.sh.
//
// Decisão desta etapa: reescrever APENAS quando
//   (a) o operador pediu (`rotate_secrets=true`), ou
//   (b) o `secrets list` do projeto divergir do que o escopo espera, ou
//   (c) a leitura do remoto falhar (cai no comportamento antigo, de propósito).
// Em rollback (`source_ref` preenchido) NUNCA reescrever. Em ensaio (dry_run)
// NUNCA reescrever.
//
// Limite assumido e declarado: a comparação é do CONJUNTO DE NOMES, não do
// valor. O `secrets list` do Supabase mostra NAME + DIGEST e nunca o valor. Um
// nome ausente é divergência que dá para medir sem adivinhar; para propagar a
// rotação de um VALOR existe o `rotate_secrets=true`, explícito.
import { appendFileSync, readFileSync } from 'node:fs';

/**
 * Lê os nomes esperados do env.manifest.json: entries `supabase_vault` com
 * `required=true`. Espelha a exclusão do gate do migrate-functions.sh:
 * `SUPABASE_*` é reservado pela plataforma e nunca aparece em `supabase secrets
 * list` — excluí-lo, senão o diff acusaria ausência eterna.
 */
export function nomesDeSecretsParaEscopo(fn, manifestPath = 'env.manifest.json') {
  const raw = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const nomes = (raw.vars ?? [])
    .filter((v) => v.dest === 'supabase_vault' && v.required === true)
    .map((v) => v.name)
    .filter((n) => !n.startsWith('SUPABASE_'));
  return [...nomes].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Decisão de reescrever. `nomesRemotos` pode ser `null` = leitura falhou.
 * Devolve `{ reescrever, motivo }` — o motivo vai para o log, sempre.
 */
export function decidirReescrita({ rotateSecrets = false, emRollback = false, emEnsaio = false, nomesRemotos = null, nomesEsperados = [] } = {}) {
  if (emEnsaio) {
    return { reescrever: false, motivo: 'ensaio (dry_run): decisão apenas registrada, nenhum secret será reescrito' };
  }
  if (emRollback) {
    return { reescrever: false, motivo: 'rollback (source_ref preenchido): secrets inalterados' };
  }
  if (rotateSecrets) {
    return { reescrever: true, motivo: 'rotate_secrets=true: reescrevendo os secrets do escopo' };
  }
  if (nomesRemotos === null) {
    // Fail-closed — não reescrever quando a listagem de secrets não está disponível.
    // Para forçar a reescrita mesmo sem confirmação, use rotate_secrets=true.
    return {
      reescrever: false,
      motivo: 'não foi possível ler os secrets do projeto: use rotate_secrets=true para forçar a reescrita',
      erroFatal: true,
    };
  }
  const remotos = new Set(nomesRemotos);
  const ausentes = nomesEsperados.filter((nome) => !remotos.has(nome));
  if (ausentes.length > 0) {
    return { reescrever: true, motivo: `secrets ausentes no projeto: ${ausentes.join(', ')}` };
  }
  return { reescrever: false, motivo: 'secrets inalterados: nenhum nome esperado está ausente' };
}

/**
 * Extrai APENAS os nomes do `secrets list`. Tolerante à forma (array de objetos,
 * objeto com `secrets`, ou a tabela NAME/DIGEST do modo texto). Não adivinha: o
 * que não casar devolve `null`, que a decisão trata como leitura falhada.
 */
export function extrairNomesDeSecrets(entrada) {
  const texto = String(entrada ?? '').trim();
  if (texto === '') return null;
  try {
    const dado = JSON.parse(texto);
    const lista = Array.isArray(dado) ? dado : (dado && Array.isArray(dado.secrets) ? dado.secrets : null);
    if (!lista) return null;
    const nomes = lista
      .map((item) => (typeof item === 'string' ? item : (item && (item.name ?? item.Name))))
      .filter((nome) => typeof nome === 'string' && /^[A-Z][A-Z0-9_]*$/.test(nome));
    return nomes.length > 0 ? nomes : null;
  } catch {
    // Tabela de texto: NAME seguido de DIGEST, cabeçalho NAME/DIGEST no topo.
    const linhas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const nomes = linhas
      .map((l) => l.split(/\s+/)[0])
      .filter((nome) => /^[A-Z][A-Z0-9_]*$/.test(nome) && !['NAME', 'DIGEST'].includes(nome));
    return nomes.length > 0 ? nomes : null;
  }
}

// --- CLI (usado pelo passo do workflow) ------------------------------------
if (process.argv[1]?.endsWith('secrets-scope.mjs')) {
  const args = process.argv.slice(2);
  const bandeira = (nome) => args.includes(nome);
  const valor = (nome) => {
    const i = args.indexOf(nome);
    return i === -1 ? undefined : args[i + 1];
  };
  const fn = valor('--fn') ?? '';
  const arquivo = valor('--lista');
  const manifestPath = valor('--manifest') ?? 'env.manifest.json';
  let nomesEsperados;
  try {
    nomesEsperados = nomesDeSecretsParaEscopo(fn, manifestPath);
  } catch (error) {
    console.error(`::error::env.manifest.json ilegível: ${error.message}`);
    process.exit(2);
  }
  let nomesRemotos = null;
  if (arquivo) {
    try {
      nomesRemotos = extrairNomesDeSecrets(readFileSync(arquivo, 'utf8'));
    } catch {
      nomesRemotos = null; // arquivo ausente = leitura falhada, não "vazio"
    }
  }
  const decisao = decidirReescrita({
    rotateSecrets: bandeira('--rotate'),
    emRollback: bandeira('--rollback'),
    emEnsaio: bandeira('--dry-run'),
    nomesRemotos,
    nomesEsperados,
  });
  console.log(`escopo="${fn || '(total)'}" esperados=${nomesEsperados.length} [${nomesEsperados.join(', ')}]`);
  console.log(`decisao=${decisao.reescrever ? 'REESCREVER' : 'MANTER'} — ${decisao.motivo}`);
  // A saída consumida pelo workflow é uma linha só, sem log junto.
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `reescrever=${decisao.reescrever}\nmotivo=${decisao.motivo}\n`);
  }
  // Fail-closed — aborta o passo para impedir deploy com secrets em estado incerto.
  if (decisao.erroFatal) {
    console.error(`::error::${decisao.motivo}`);
    process.exit(1);
  }
  process.exit(0);
}
