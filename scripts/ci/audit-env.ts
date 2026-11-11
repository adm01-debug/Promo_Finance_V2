#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env
/**
 * scripts/ci/audit-env.ts
 * Cruza env.manifest.json × estado real (Vercel, GitHub Actions, Supabase vault).
 * Reprova em 3 classes:
 *   1. declarada-e-não-cadastrada  — var do manifesto ausente no destino
 *   2. cadastrada-e-não-declarada  — var no destino sem entrada no manifesto
 *   3. ref-de-projeto-errada       — valor aponta para projeto diferente do config.toml
 * Destino com token mas que não respondeu (HTTP ≠ 2xx, rede) reprova como [READ-FAIL]:
 * leitura falhada não é "destino vazio".
 *
 * Uso:
 *   VERCEL_TOKEN=vcp_... SUPABASE_PAT=sbp_... GITHUB_TOKEN=ghp_... \
 *   deno run --allow-read --allow-net --allow-env scripts/ci/audit-env.ts
 *
 * Em CI: o workflow injeta os tokens via secrets.
 */

// `with`, não `assert`: o V8 removeu import assertions e o Deno 2 (v2.9.5 no CI) nem
// chega a parsear o arquivo com a forma antiga.
import manifest from '../../env.manifest.json' with { type: 'json' };

export type Var = { name: string; scope: string; required: boolean; dest: string };

/** Destino lido: `erro` preenchido = a leitura FALHOU (≠ destino vazio). */
export type Leitura<T> = { dados: T; erro: string | null };

export type Estado = {
  vercelEnvs: Leitura<Map<string, string>>;
  supabaseSecrets: Leitura<Set<string>>;
  githubSecrets: Leitura<Set<string>>;
  githubVariables: Leitura<Map<string, string>>;
  /** Token presente por destino: sem token a checagem é SKIP, não falha. */
  tokens: { vercel: boolean; supabase: boolean; github: boolean };
  supabaseRef: string;
};

type Resposta = { ok: boolean; erro: string; json: unknown };
export type Buscar = (url: string, headers: Record<string, string>) => Promise<Resposta>;

const TIMEOUT_MS = 20_000;
const POR_PAGINA = 100; // teto da API do GitHub (o padrão é 30 para secrets e 10 para variables)
const MAX_PAGINAS = 20;

// ---------- helpers ----------
export async function get(
  url: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
  timeoutMs: number = TIMEOUT_MS
): Promise<Resposta> {
  try {
    const r = await fetchImpl(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
    // Só o status vai para a mensagem: corpo de erro e cabeçalhos podem ecoar credencial.
    if (!r.ok) return { ok: false, erro: `HTTP ${r.status}`, json: null };
    return { ok: true, erro: '', json: await r.json() };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.name : 'erro de rede', json: null };
  }
}

const GH_HEADERS = (token: string) => ({
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github.v3+json',
});

/**
 * Lista paginada do GitHub (`{ total_count, <campo>: [...] }`). Sem paginar, o repo com
 * mais de 30 secrets (ou 10 variables) tinha o excedente reportado como [MISSING].
 */
async function listarGithub<T>(
  buscar: Buscar,
  urlBase: string,
  campo: string,
  token: string
): Promise<Leitura<T[]>> {
  const itens: T[] = [];
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const r = await buscar(`${urlBase}?per_page=${POR_PAGINA}&page=${pagina}`, GH_HEADERS(token));
    if (!r.ok) return { dados: itens, erro: r.erro };
    const corpo = (r.json ?? {}) as Record<string, unknown>;
    const lote = Array.isArray(corpo[campo]) ? (corpo[campo] as T[]) : [];
    itens.push(...lote);
    const total = typeof corpo.total_count === 'number' ? corpo.total_count : itens.length;
    if (lote.length < POR_PAGINA || itens.length >= total) break;
  }
  return { dados: itens, erro: null };
}

// ---------- leitura dos destinos ----------
export type Config = {
  vercelToken: string;
  vercelTeamId: string;
  vercelProject: string;
  supabasePat: string;
  supabaseRef: string;
  githubToken: string;
  githubRepo: string;
};

export async function fetchVercelEnvs(
  c: Config,
  buscar: Buscar
): Promise<Leitura<Map<string, string>>> {
  if (!c.vercelToken) return { dados: new Map(), erro: null };
  const r = await buscar(
    `https://api.vercel.com/v10/projects/${c.vercelProject}/env?teamId=${c.vercelTeamId}`,
    { Authorization: `Bearer ${c.vercelToken}` }
  );
  if (!r.ok) return { dados: new Map(), erro: r.erro };
  const d = r.json as { envs?: { key: string; value?: string; type?: string }[] } | null;
  // Só `plain` chega legível: 'secret'/'sensitive' vêm sem valor e 'encrypted' vem
  // cifrado — comparar texto cifrado com a ref do projeto daria [BAD-REF] falso.
  return {
    dados: new Map(
      (d?.envs ?? []).map((e) => [e.key, e.type && e.type !== 'plain' ? '' : (e.value ?? '')])
    ),
    erro: null,
  };
}

export async function fetchSupabaseSecrets(
  c: Config,
  buscar: Buscar
): Promise<Leitura<Set<string>>> {
  if (!c.supabasePat) return { dados: new Set(), erro: null };
  const r = await buscar(`https://api.supabase.com/v1/projects/${c.supabaseRef}/secrets`, {
    Authorization: `Bearer ${c.supabasePat}`,
  });
  if (!r.ok) return { dados: new Set(), erro: r.erro };
  if (!Array.isArray(r.json)) return { dados: new Set(), erro: 'resposta inesperada' };
  return { dados: new Set((r.json as { name: string }[]).map((s) => s.name)), erro: null };
}

/** Environments do repo: secret/variable de `Production` não aparece na listagem do repositório. */
async function ambientesGithub(c: Config, buscar: Buscar): Promise<Leitura<string[]>> {
  const r = await listarGithub<{ name: string }>(
    buscar,
    `https://api.github.com/repos/${c.githubRepo}/environments`,
    'environments',
    c.githubToken
  );
  return { dados: r.dados.map((a) => a.name), erro: r.erro };
}

export async function fetchGithubSecrets(c: Config, buscar: Buscar): Promise<Leitura<Set<string>>> {
  if (!c.githubToken) return { dados: new Set(), erro: null };
  const repo = `https://api.github.com/repos/${c.githubRepo}`;
  const nomes = new Set<string>();
  const doRepo = await listarGithub<{ name: string }>(
    buscar,
    `${repo}/actions/secrets`,
    'secrets',
    c.githubToken
  );
  if (doRepo.erro) return { dados: nomes, erro: doRepo.erro };
  for (const s of doRepo.dados) nomes.add(s.name);
  const ambientes = await ambientesGithub(c, buscar);
  if (ambientes.erro) return { dados: nomes, erro: `environments: ${ambientes.erro}` };
  for (const amb of ambientes.dados) {
    const r = await listarGithub<{ name: string }>(
      buscar,
      `${repo}/environments/${encodeURIComponent(amb)}/secrets`,
      'secrets',
      c.githubToken
    );
    if (r.erro) return { dados: nomes, erro: `environment ${amb}: ${r.erro}` };
    for (const s of r.dados) nomes.add(s.name);
  }
  return { dados: nomes, erro: null };
}

export async function fetchGithubVariables(
  c: Config,
  buscar: Buscar
): Promise<Leitura<Map<string, string>>> {
  if (!c.githubToken) return { dados: new Map(), erro: null };
  const repo = `https://api.github.com/repos/${c.githubRepo}`;
  const mapa = new Map<string, string>();
  type Variavel = { name: string; value: string };
  const ambientes = await ambientesGithub(c, buscar);
  if (ambientes.erro) return { dados: mapa, erro: `environments: ${ambientes.erro}` };
  for (const amb of ambientes.dados) {
    const r = await listarGithub<Variavel>(
      buscar,
      `${repo}/environments/${encodeURIComponent(amb)}/variables`,
      'variables',
      c.githubToken
    );
    if (r.erro) return { dados: mapa, erro: `environment ${amb}: ${r.erro}` };
    for (const v of r.dados) mapa.set(v.name, v.value);
  }
  // Repositório por último: é o valor que vale quando o job não declara environment.
  const doRepo = await listarGithub<Variavel>(
    buscar,
    `${repo}/actions/variables`,
    'variables',
    c.githubToken
  );
  if (doRepo.erro) return { dados: mapa, erro: doRepo.erro };
  for (const v of doRepo.dados) mapa.set(v.name, v.value);
  return { dados: mapa, erro: null };
}

// ---------- auditoria (pura: sem rede, sem ambiente) ----------
const REFS_PROJETO = new Set([
  'PROD_PROJECT_REF',
  'SUPABASE_PROJECT_ID',
  'VITE_SUPABASE_PROJECT_ID',
  'SUPABASE_REF',
]);

export function auditar(vars: Var[], estado: Estado): { linhas: string[]; failures: number } {
  const linhas: string[] = [];
  let failures = 0;
  const { vercelEnvs, supabaseSecrets, githubSecrets, githubVariables, tokens } = estado;

  // Classe 0: destino que não respondeu. Sem isto a falha de leitura (token expirado,
  // API fora) virava "destino vazio" e TODA var dele saía como [MISSING].
  const leituras: [string, string | null][] = [
    ['vercel', vercelEnvs.erro],
    ['supabase_vault', supabaseSecrets.erro],
    ['github_actions', githubSecrets.erro],
    ['github_actions_vars', githubVariables.erro],
  ];
  const ilegivel = new Set<string>();
  for (const [destino, erro] of leituras) {
    if (!erro) continue;
    linhas.push(`  ❌ [READ-FAIL] ${destino}: leitura do destino falhou (${erro})`);
    ilegivel.add(destino);
    failures++;
  }

  // Classe 1: declarada no manifesto mas ausente no destino
  for (const v of vars) {
    if (!v.required) continue;
    let present = false;
    if (v.dest === 'vercel') present = vercelEnvs.dados.has(v.name);
    if (v.dest === 'supabase_vault') present = supabaseSecrets.dados.has(v.name);
    if (v.dest === 'github_actions') present = githubSecrets.dados.has(v.name);
    if (v.dest === 'github_actions_vars') present = githubVariables.dados.has(v.name);
    if (v.dest === 'supabase_auto') continue; // injetadas pela plataforma
    if (!present) {
      if (v.dest === 'vercel' && !tokens.vercel) {
        linhas.push(`  ⚠️  SKIP ${v.name} (sem VERCEL_TOKEN)`);
        continue;
      }
      if (v.dest.startsWith('supabase') && !tokens.supabase) {
        linhas.push(`  ⚠️  SKIP ${v.name} (sem SUPABASE_PAT)`);
        continue;
      }
      if (v.dest.startsWith('github_actions') && !tokens.github) {
        linhas.push(`  ⚠️  SKIP ${v.name} (sem GITHUB_TOKEN)`);
        continue;
      }
      if (ilegivel.has(v.dest)) continue; // já contado em [READ-FAIL]
      linhas.push(`  ❌ [MISSING] ${v.name} → ${v.dest}`);
      failures++;
    }
  }

  // Classe 2: cadastrada no destino mas não declarada no manifesto (ruído)
  const manifestNames = new Set(vars.map((v) => v.name));
  for (const k of vercelEnvs.dados.keys())
    if (!manifestNames.has(k)) linhas.push(`  ⚠️  [ORPHAN-VERCEL]   ${k}`);
  for (const k of supabaseSecrets.dados)
    if (!manifestNames.has(k)) linhas.push(`  ⚠️  [ORPHAN-SUPABASE] ${k}`);
  for (const k of githubSecrets.dados)
    if (!manifestNames.has(k)) linhas.push(`  ⚠️  [ORPHAN-GITHUB]   ${k}`);
  for (const k of githubVariables.dados.keys())
    if (!manifestNames.has(k)) linhas.push(`  ⚠️  [ORPHAN-GH-VARS]  ${k}`);

  // Classe 3: referência de projeto cadastrada mas apontando para outro banco.
  // Uma var com o nome certo e valor errado passaria na checagem de presença e
  // faria o workflow semanal gerar types.ts do projeto errado.
  for (const [mapa, destino] of [
    [vercelEnvs.dados, 'vercel'],
    [githubVariables.dados, 'github_actions_vars'],
  ] as const) {
    for (const [k, v] of mapa) {
      if (REFS_PROJETO.has(k) && v && v !== estado.supabaseRef) {
        linhas.push(
          `  ❌ [BAD-REF] ${k} → ${destino} aponta para '${v}', esperado '${estado.supabaseRef}'`
        );
        failures++;
      }
    }
  }

  return { linhas, failures };
}

/** Lê os quatro destinos e audita. `buscar` é injetável: o teste não toca rede. */
export async function executar(
  vars: Var[],
  c: Config,
  buscar: Buscar = (url, headers) => get(url, headers)
): Promise<{ linhas: string[]; failures: number }> {
  const [vercelEnvs, supabaseSecrets, githubSecrets, githubVariables] = await Promise.all([
    fetchVercelEnvs(c, buscar),
    fetchSupabaseSecrets(c, buscar),
    fetchGithubSecrets(c, buscar),
    fetchGithubVariables(c, buscar),
  ]);
  return auditar(vars, {
    vercelEnvs,
    supabaseSecrets,
    githubSecrets,
    githubVariables,
    tokens: { vercel: !!c.vercelToken, supabase: !!c.supabasePat, github: !!c.githubToken },
    supabaseRef: c.supabaseRef,
  });
}

async function principal(): Promise<void> {
  const config: Config = {
    vercelToken: Deno.env.get('VERCEL_TOKEN') || '',
    vercelTeamId: Deno.env.get('VERCEL_TEAM_ID') || 'team_QyN41X0q8hrqhW80AwokbFLv',
    vercelProject: Deno.env.get('VERCEL_PROJECT') || 'prj_gUNGhJYrVY2mfQb6hWDffow04v2p',
    supabasePat: Deno.env.get('SUPABASE_PAT') || '',
    supabaseRef: Deno.env.get('SUPABASE_REF') || 'bwwbeyolnnzppeuhgkcd',
    githubToken: Deno.env.get('GITHUB_TOKEN') || '',
    githubRepo: Deno.env.get('GITHUB_REPO') || 'adm01-debug/Promo_Finance_V2',
  };
  const vars: Var[] = manifest.vars ?? [];

  console.log(`\n🔍 audit-env — ${vars.length} vars no manifesto\n`);
  const { linhas, failures } = await executar(vars, config);
  for (const linha of linhas) console.log(linha);

  if (failures > 0) {
    console.error(
      `\n✗ audit-env: ${failures} falha(s) — var obrigatória ausente, referência de projeto errada ou destino ilegível.`
    );
    Deno.exit(1);
  } else {
    console.log(`\n✓ audit-env: todas as vars obrigatórias estão cadastradas.`);
  }
}

// Só audita quando é o script invocado: importar o módulo (teste) não lê ambiente nem rede.
if (import.meta.main) await principal();
