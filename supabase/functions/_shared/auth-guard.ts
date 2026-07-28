/**
 * auth-guard.ts — porteiro único das Edge Functions.
 *
 * Contexto do problema que este módulo resolve:
 * as funções deste projeto rodam com `verify_jwt = false` (padrão do Lovable Cloud,
 * exigido pelo sistema de signing keys). Isso significa que a plataforma NÃO valida
 * ninguém por nós: qualquer requisição anônima da internet chega ao `serve()`.
 * Como muitas dessas funções instanciam o client com `SUPABASE_SERVICE_ROLE_KEY`,
 * a ausência de checagem em código transforma a função num bypass completo de RLS.
 *
 * Existem exatamente dois tipos legítimos de chamador, e cada um tem um guard:
 *
 *  1. Usuário logado no app  → `exigirUsuario(req)`
 *     Valida o JWT do header Authorization contra o Auth e devolve o user id.
 *
 *  2. Automação interna (pg_cron, triggers de banco, outra Edge Function)
 *     → `exigirChamadaInterna(req, chave)`
 *     Aceita o service role key OU um segredo rotacionável guardado em
 *     `integration_secrets` (tabela server-only) enviado em `x-cron-secret`.
 *
 * Nunca use o anon key como credencial de automação: ele é público por
 * definição (vai no bundle do frontend), então autenticar cron com anon key é
 * equivalente a não autenticar nada.
 */

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "./cors.ts";

/** Headers CORS acrescidos do header de segredo usado pelas automações. */
export const corsHeadersComSegredo: Record<string, string> = {
  ...corsHeaders,
  "Access-Control-Allow-Headers":
    `${corsHeaders["Access-Control-Allow-Headers"]}, x-cron-secret, x-internal-secret`,
};

function respostaErro(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ error: code, message }), {
    status,
    headers: { ...corsHeadersComSegredo, "Content-Type": "application/json" },
  });
}

function extrairBearer(req: Request): string | null {
  const raw = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!raw) return null;
  const [scheme, ...resto] = raw.trim().split(/\s+/);
  if (scheme.toLowerCase() !== "bearer") return null;
  const token = resto.join("");
  return token.length > 0 ? token : null;
}

/**
 * Comparação de segredos em tempo constante-ish sobre o comprimento do
 * candidato. Não protege contra oracle de tamanho — e não precisa: os segredos
 * aqui têm tamanho fixo conhecido.
 */
function segredosIguais(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface UsuarioAutenticado {
  userId: string;
  email: string | null;
  /** Token cru — útil para criar um client que respeita a RLS do usuário. */
  token: string;
  /** Client já vinculado ao usuário: toda query passa pela RLS dele. */
  clientDoUsuario: SupabaseClient;
}

export type ResultadoGuard<T> =
  | { ok: true; dados: T }
  | { ok: false; resposta: Response };

/**
 * Exige um usuário autenticado do app.
 *
 * Importante: validamos o token contra o serviço de Auth em vez de apenas
 * decodificar o JWT. Decodificar sem verificar assinatura aceitaria qualquer
 * token forjado — um erro comum e fatal nesse tipo de função.
 */
export async function exigirUsuario(req: Request): Promise<ResultadoGuard<UsuarioAutenticado>> {
  const token = extrairBearer(req);
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const url = Deno.env.get("SUPABASE_URL") ?? "";

  // O anon key também chega como Bearer quando o usuário está deslogado.
  // Tratamos isso como "sem sessão" e não como tentativa de fraude.
  if (!token || segredosIguais(token, anonKey)) {
    return {
      ok: false,
      resposta: respostaErro(401, "nao_autenticado", "Sessão ausente ou inválida."),
    };
  }

  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    return {
      ok: false,
      resposta: respostaErro(401, "nao_autenticado", "Sessão ausente ou inválida."),
    };
  }

  return {
    ok: true,
    dados: {
      userId: data.user.id,
      email: data.user.email ?? null,
      token,
      clientDoUsuario: client,
    },
  };
}

/**
 * Exige um papel específico (RBAC) além da autenticação.
 * Usa a função `has_role` do banco — a fonte de verdade — em vez de qualquer
 * claim vinda do cliente, que é manipulável.
 */
export async function exigirPapel(
  req: Request,
  papeis: readonly string[],
): Promise<ResultadoGuard<UsuarioAutenticado>> {
  const auth = await exigirUsuario(req);
  if (!auth.ok) return auth;

  const admin = clientDeServico();
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.dados.userId);

  if (error) {
    return { ok: false, resposta: respostaErro(500, "erro_autorizacao", "Falha ao validar permissões.") };
  }

  const possui = (data ?? []).some((linha: { role: string }) => papeis.includes(linha.role));
  if (!possui) {
    return {
      ok: false,
      resposta: respostaErro(403, "sem_permissao", "Permissão insuficiente para esta operação."),
    };
  }

  return auth;
}

/** Client com service role — só deve ser criado DEPOIS de um guard aprovar a chamada. */
export function clientDeServico(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

const cacheSegredos = new Map<string, { valor: string; expiraEm: number }>();
const TTL_SEGREDO_MS = 60_000;

async function segredoInterno(chave: string): Promise<string | null> {
  const agora = Date.now();
  const emCache = cacheSegredos.get(chave);
  if (emCache && emCache.expiraEm > agora) return emCache.valor;

  // Fallback por variável de ambiente antes do banco: permite operar mesmo se
  // a tabela estiver indisponível.
  const doAmbiente = Deno.env.get(`INTERNAL_SECRET_${chave.toUpperCase()}`);
  if (doAmbiente) {
    cacheSegredos.set(chave, { valor: doAmbiente, expiraEm: agora + TTL_SEGREDO_MS });
    return doAmbiente;
  }

  const { data, error } = await clientDeServico()
    .from("integration_secrets")
    .select("valor")
    .eq("chave", chave)
    .maybeSingle();

  if (error || !data?.valor) return null;
  cacheSegredos.set(chave, { valor: data.valor, expiraEm: agora + TTL_SEGREDO_MS });
  return data.valor;
}

export interface ChamadaInterna {
  /** Como o chamador provou ser interno. Útil para auditoria. */
  origem: "service_role" | "segredo_cron";
}

/**
 * Exige que a chamada venha de automação interna confiável.
 *
 * `chaveSegredo` é o nome da linha em `integration_secrets` (ex.: `conformidade_cron`).
 * Se a chave não existir no banco nem no ambiente, a função FALHA FECHADA (401):
 * um segredo ausente jamais deve virar "acesso liberado".
 */
export async function exigirChamadaInterna(
  req: Request,
  chaveSegredo = "internal_jobs",
): Promise<ResultadoGuard<ChamadaInterna>> {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const bearer = extrairBearer(req);
  const apikey = req.headers.get("apikey");

  if (serviceKey && (segredosIguais(bearer, serviceKey) || segredosIguais(apikey, serviceKey))) {
    return { ok: true, dados: { origem: "service_role" } };
  }

  const enviado = req.headers.get("x-cron-secret") ?? req.headers.get("x-internal-secret");
  if (enviado) {
    const esperado = await segredoInterno(chaveSegredo);
    if (esperado && segredosIguais(enviado, esperado)) {
      return { ok: true, dados: { origem: "segredo_cron" } };
    }
  }

  return {
    ok: false,
    resposta: respostaErro(401, "chamada_nao_autorizada", "Endpoint restrito a automações internas."),
  };
}

/**
 * Aceita QUALQUER um dos dois chamadores legítimos: automação interna ou
 * usuário logado. Para funções que o app dispara sob demanda e o cron também.
 */
export async function exigirInternaOuUsuario(
  req: Request,
  chaveSegredo = "internal_jobs",
): Promise<ResultadoGuard<{ origem: "interna" | "usuario"; userId: string | null }>> {
  const interna = await exigirChamadaInterna(req, chaveSegredo);
  if (interna.ok) return { ok: true, dados: { origem: "interna", userId: null } };

  const usuario = await exigirUsuario(req);
  if (usuario.ok) return { ok: true, dados: { origem: "usuario", userId: usuario.dados.userId } };

  return { ok: false, resposta: usuario.resposta };
}
