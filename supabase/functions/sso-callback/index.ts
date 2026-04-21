import { corsHeaders } from "npm:@supabase/supabase-js/cors";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") ?? "";

type Admin = SupabaseClient;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const part = jwt.split(".")[1] || "";
  const pad = "=".repeat((4 - (part.length % 4)) % 4);
  const json = atob(part.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return JSON.parse(json);
}

function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

/**
 * Lookup determinístico por email (não depende de paginação).
 * 1) tenta admin.auth.admin.listUsers com filter (Supabase >= 2.x suporta query)
 * 2) fallback: profiles.email -> id (profiles é mantido em sync por trigger handle_new_user)
 */
async function findUserByEmail(admin: Admin, email: string) {
  try {
    const { data } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      // @ts-expect-error filter é suportado em runtime mas não tipado
      filter: `email.eq.${email}`,
    });
    const u = data?.users?.find((x) => x.email?.toLowerCase() === email);
    if (u) return u;
  } catch {
    /* falha silenciosa, vamos pro fallback */
  }
  // Fallback via profiles (id == auth.users.id)
  const { data: prof } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .ilike("email", email)
    .maybeSingle();
  if (!prof) return null;
  const { data: full } = await admin.auth.admin.getUserById(prof.id);
  return full?.user ?? null;
}

/** Garante que apenas o vínculo recém-marcado fique como is_default. */
async function vincularEmpresaComoPadrao(
  admin: Admin,
  userId: string,
  empresaId: string,
  role: string,
) {
  // Zera default em todos os outros vínculos do usuário
  await admin
    .from("user_empresas")
    .update({ is_default: false })
    .eq("user_id", userId)
    .neq("empresa_id", empresaId);

  // Upsert do vínculo alvo como padrão e ativo
  await admin.from("user_empresas").upsert(
    {
      user_id: userId,
      empresa_id: empresaId,
      role,
      provisioned_via: "sso",
      is_default: true,
      ativo: true,
    },
    { onConflict: "user_id,empresa_id" },
  );
}

async function logAttempt(args: {
  admin: Admin | null;
  providerId: string | null;
  email: string | null;
  success: boolean;
  errCode: string | null;
  errMsg: string | null;
  t0: number;
  ip?: string | null;
  ua?: string | null;
  appRedirect?: string | null;
}) {
  const admin = args.admin ?? createClient(SUPABASE_URL, SERVICE_ROLE);
  try {
    await admin.from("sso_login_attempts").insert({
      provider_id: args.providerId,
      email: args.email,
      success: args.success,
      error_code: args.errCode,
      error_message: args.errMsg,
      duration_ms: Date.now() - args.t0,
      ip_address: args.ip ?? null,
      user_agent: args.ua ?? null,
      app_redirect: args.appRedirect ?? null,
    });
  } catch {
    /* não propagar */
  }
}

function safeOrigin(req: Request, fallback?: string | null): string {
  if (fallback && /^https?:\/\//.test(fallback)) {
    try {
      return new URL(fallback).origin;
    } catch {
      /* ignore */
    }
  }
  if (PUBLIC_APP_URL) {
    try {
      return new URL(PUBLIC_APP_URL).origin;
    } catch {
      /* ignore */
    }
  }
  // Origem do referer/origin do request, NÃO do hostname do Supabase
  const referer = req.headers.get("referer") || req.headers.get("origin");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      /* ignore */
    }
  }
  return new URL(req.url).origin;
}

function redirectErr(req: Request, code: string, appRedirect?: string | null) {
  const origin = safeOrigin(req, appRedirect);
  return Response.redirect(`${origin}/auth?sso_error=${code}`, 302);
}

async function safeJson(req: Request) {
  try {
    return await req.clone().json();
  } catch {
    return null;
  }
}

/**
 * Aplica o pipeline pós-autenticação (provisioning + vínculo + roles + audit).
 * Compartilhado entre OIDC callback e SAML finalize.
 */
/**
 * Normaliza valor de claim: trim, vazio vira null, valores idênticos ao email
 * são descartados (heurística para evitar fallback "name=email").
 */
function normalizeClaim(v: unknown, email: string): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s.toLowerCase() === email.toLowerCase()) return null;
  return s;
}

/**
 * Calcula o delta entre o estado atual do perfil e os claims recebidos.
 * Só inclui campos cujo valor incoming é não-nulo E diferente do current.
 * Nunca sobrescreve com vazio.
 */
function buildProfileSyncDelta(
  current: { full_name: string | null; avatar_url: string | null; telefone: string | null },
  incoming: { full_name?: string | null; avatar_url?: string | null; telefone?: string | null },
): {
  changes: Record<string, { from: unknown; to: unknown }>;
  updates: Record<string, string>;
} {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const updates: Record<string, string> = {};
  const fields: Array<keyof typeof incoming> = ["full_name", "avatar_url", "telefone"];
  for (const f of fields) {
    const next = incoming[f];
    if (next === null || next === undefined) continue;
    const curr = current[f] ?? null;
    if (curr === next) continue;
    changes[f] = { from: curr, to: next };
    updates[f] = next;
  }
  return { changes, updates };
}

async function applyPipeline(opts: {
  admin: Admin;
  provider: Record<string, unknown>;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  telefone?: string | null;
  groups: string[];
  existingUserId?: string | null; // SAML: já existe (broker criou); OIDC: descoberto/criado aqui
  allowJit: boolean;
}): Promise<{
  userId: string;
  role: string;
  matchedGroup: string | null;
  jitCreated: boolean;
} | { error: string; details?: string }> {
  const { admin, provider, email, fullName, avatarUrl, telefone, groups, existingUserId, allowJit } = opts;
  const providerId = provider.id as string;
  const providerNome = provider.nome as string;
  const empresaId = (provider.empresa_id as string | null) ?? null;
  const defaultRole = (provider.default_role as string) || "visualizador";
  const allowedDomains = (provider.allowed_domains as string[]) ?? [];

  // Domínio
  if (allowedDomains.length) {
    const dom = email.split("@")[1];
    if (!allowedDomains.includes(dom)) {
      return { error: "domain_not_allowed", details: dom };
    }
  }

  // Normaliza claims recebidos (vazio/email → null)
  const incomingFullName = normalizeClaim(fullName, email);
  const incomingAvatarUrl = normalizeClaim(avatarUrl, email);
  const incomingTelefone = normalizeClaim(telefone, email);

  // Resolve usuário (SAML traz existingUserId; OIDC busca/cria)
  let userId: string | null = existingUserId ?? null;
  let jitCreated = false;
  let existingAuthUser: { user_metadata?: Record<string, unknown> | null } | null = null;

  if (!userId) {
    const found = await findUserByEmail(admin, email);
    if (found) {
      userId = found.id;
      existingAuthUser = found;
    } else if (allowJit) {
      const jitMeta: Record<string, unknown> = { sso_provider_id: providerId };
      if (incomingFullName) jitMeta.full_name = incomingFullName;
      if (incomingAvatarUrl) jitMeta.avatar_url = incomingAvatarUrl;
      if (incomingTelefone) jitMeta.phone = incomingTelefone;
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: jitMeta,
      });
      if (created.error || !created.data.user) {
        return { error: "create_user_failed", details: created.error?.message };
      }
      userId = created.data.user.id;
      jitCreated = true;

      // Persiste avatar/telefone em profiles (handle_new_user só preenche full_name)
      const jitProfileUpdates: Record<string, string> = {};
      if (incomingFullName) jitProfileUpdates.full_name = incomingFullName;
      if (incomingAvatarUrl) jitProfileUpdates.avatar_url = incomingAvatarUrl;
      if (incomingTelefone) jitProfileUpdates.telefone = incomingTelefone;
      if (Object.keys(jitProfileUpdates).length > 0) {
        await admin.from("profiles").update(jitProfileUpdates).eq("id", userId);
      }
    } else {
      return { error: "user_not_provisioned" };
    }
  } else {
    // SAML: usuário já existe (broker criou)
    const { data: u } = await admin.auth.admin.getUserById(userId);
    if (u?.user) {
      existingAuthUser = u.user;
      // Heurística JIT-via-SAML: usuário criado pelo broker SAML há < 60s
      const createdAtStr = (u.user as { created_at?: string }).created_at;
      if (createdAtStr) {
        const createdMs = Date.parse(createdAtStr);
        if (!Number.isNaN(createdMs) && Date.now() - createdMs < 60_000) {
          jitCreated = true;
        }
      }
    }
  }

  // Sincronização de perfil para usuários existentes (não-JIT)
  // Compara claims do IdP com profiles atuais e atualiza apenas o que mudou.
  if (userId && !jitCreated && existingAuthUser) {
    const { data: currentProfile } = await admin
      .from("profiles")
      .select("full_name, avatar_url, telefone")
      .eq("id", userId)
      .maybeSingle();

    const current = {
      full_name: (currentProfile?.full_name ?? null) as string | null,
      avatar_url: (currentProfile?.avatar_url ?? null) as string | null,
      telefone: (currentProfile?.telefone ?? null) as string | null,
    };
    const { changes, updates } = buildProfileSyncDelta(current, {
      full_name: incomingFullName,
      avatar_url: incomingAvatarUrl,
      telefone: incomingTelefone,
    });

    const meta = (existingAuthUser.user_metadata || {}) as Record<string, unknown>;
    const metaProviderId = meta.sso_provider_id as string | undefined;
    const needsMetaSync = metaProviderId !== providerId || Object.keys(updates).length > 0;

    if (needsMetaSync) {
      const newMeta: Record<string, unknown> = { ...meta, sso_provider_id: providerId };
      if (updates.full_name) newMeta.full_name = updates.full_name;
      if (updates.avatar_url) newMeta.avatar_url = updates.avatar_url;
      if (updates.telefone) newMeta.phone = updates.telefone;
      await admin.auth.admin.updateUserById(userId, { user_metadata: newMeta });
    }
    if (Object.keys(updates).length > 0) {
      await admin.from("profiles").update(updates).eq("id", userId);

      // Trilha de auditoria — só quando houve alteração real
      try {
        const fieldsChanged = Object.keys(changes);
        await admin.from("audit_logs").insert({
          user_id: userId,
          user_email: email,
          action: "UPDATE",
          table_name: "sso_profile_sync",
          record_id: userId,
          new_data: {
            provider_id: providerId,
            provider_nome: providerNome,
            provider_tipo: (provider.tipo as string) ?? null,
            changes,
            fields_changed: fieldsChanged,
          },
          details: `Sincronização SSO (${providerNome}): ${fieldsChanged.length} campo(s) atualizado(s) — ${fieldsChanged.join(", ")}`,
        });
      } catch (err) {
        console.warn(
          "[sso-callback] falha ao registrar audit_logs sso_profile_sync:",
          err instanceof Error ? err.message : String(err)
        );
      }
    }
  }

  // Role mapping
  let role = defaultRole;
  let matchedGroup: string | null = null;
  if (groups.length) {
    const { data: maps } = await admin
      .from("sso_role_mappings")
      .select("idp_group, app_role")
      .eq("provider_id", providerId)
      .order("ordem");
    const match = maps?.find((m: { idp_group: string }) => groups.includes(m.idp_group));
    if (match) {
      role = match.app_role;
      matchedGroup = match.idp_group;
    }
  }

  // Vínculo em user_empresas (com default exclusivo)
  if (empresaId) {
    await vincularEmpresaComoPadrao(admin, userId!, empresaId, role);
  }

  // Compat user_roles global
  await admin
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

  // Audit — trilha estruturada
  const providerTipo = (provider.tipo as string) ?? null;
  if (jitCreated) {
    // OIDC: createUser rodou aqui; SAML: broker criou nos últimos 60s.
    // Em ambos os casos, gravamos um evento dedicado e filtrável.
    const isOidc = providerTipo === "oidc";
    const via = isOidc ? "oidc-jit" : "saml-broker-jit";
    try {
      await admin.from("audit_logs").insert({
        user_id: userId,
        user_email: email,
        action: "INSERT",
        table_name: "sso_jit_provisioning",
        record_id: userId,
        new_data: {
          provider_id: providerId,
          provider_nome: providerNome,
          provider_tipo: providerTipo,
          empresa_id: empresaId,
          role,
          default_role: defaultRole,
          matched_group: matchedGroup,
          groups_received: groups,
          full_name: fullName,
          via,
        },
        details: `JIT via ${providerNome}: role=${role}${
          matchedGroup ? ` (grupo ${matchedGroup})` : " (default)"
        }`,
      });
    } catch (err) {
      console.warn(
        "[sso-callback] falha ao registrar audit_logs sso_jit_provisioning:",
        err instanceof Error ? err.message : String(err)
      );
    }
  } else if (matchedGroup) {
    try {
      await admin.from("audit_logs").insert({
        user_id: userId,
        user_email: email,
        action: "UPDATE",
        table_name: "user_roles",
        record_id: userId,
        new_data: { role, matched_group: matchedGroup, provider_id: providerId },
        details: `SSO role mapping aplicado (${providerNome}): ${matchedGroup} → ${role}`,
      });
    } catch (err) {
      console.warn(
        "[sso-callback] falha ao registrar audit_logs user_roles:",
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  return { userId: userId!, role, matchedGroup, jitCreated };
}

/* =============================================================================
 * Branch: SAML finalize
 * Frontend chama POST sso-callback com { kind:'saml-finalize', provider_id }
 * + Authorization: Bearer <jwt do usuário recém autenticado pelo broker SAML>.
 * Aplica o mesmo pipeline para criar/atualizar vínculo, role, audit.
 * ============================================================================= */
async function handleSamlFinalize(req: Request): Promise<Response> {
  const t0 = Date.now();
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResp({ error: "unauthorized" }, 401);
  }
  const token = authHeader.slice("Bearer ".length);

  // Valida JWT
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claimsResp, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsResp?.claims) {
    return jsonResp({ error: "invalid_token" }, 401);
  }
  const userId = claimsResp.claims.sub as string;

  const body = (await safeJson(req)) ?? {};
  const providerId = body.provider_id as string | undefined;
  if (!providerId) return jsonResp({ error: "provider_id_required" }, 400);

  // Busca provider
  const { data: provider } = await admin
    .from("sso_providers")
    .select("*")
    .eq("id", providerId)
    .eq("tipo", "saml")
    .maybeSingle();
  if (!provider) {
    await logAttempt({
      admin, providerId, email: null, success: false,
      errCode: "provider_missing", errMsg: null, t0, ip, ua,
    });
    return jsonResp({ error: "provider_missing" }, 404);
  }

  // Busca o user completo (precisamos de email + identities + app_metadata.groups)
  const { data: u } = await admin.auth.admin.getUserById(userId);
  if (!u?.user || !u.user.email) {
    await logAttempt({
      admin, providerId, email: null, success: false,
      errCode: "user_not_found", errMsg: null, t0, ip, ua,
    });
    return jsonResp({ error: "user_not_found" }, 404);
  }
  const email = u.user.email.toLowerCase();
  const cm = (provider.claim_mapping || {}) as Record<string, string>;

  // Em SAML pelo broker do Supabase, claims SAML chegam em user_metadata e app_metadata
  const meta = (u.user.user_metadata || {}) as Record<string, unknown>;
  const appMeta = (u.user.app_metadata || {}) as Record<string, unknown>;
  const fullName =
    String(
      meta[cm.full_name || "name"] ??
        meta.full_name ??
        meta.name ??
        appMeta[cm.full_name || "name"] ??
        email,
    ) || email;

  const rawGroups =
    meta[cm.groups || "groups"] ??
    appMeta[cm.groups || "groups"] ??
    appMeta.groups ??
    [];
  const groups: string[] = Array.isArray(rawGroups)
    ? (rawGroups as unknown[]).map(String)
    : typeof rawGroups === "string"
    ? [rawGroups]
    : [];

  const result = await applyPipeline({
    admin,
    provider,
    email,
    fullName,
    groups,
    existingUserId: userId, // SAML: usuário já existe (broker criou)
    allowJit: false,
  });

  if ("error" in result) {
    await logAttempt({
      admin, providerId, email, success: false,
      errCode: result.error, errMsg: result.details ?? null, t0, ip, ua,
    });
    return jsonResp({ error: result.error, details: result.details }, 400);
  }

  await logAttempt({
    admin, providerId, email, success: true,
    errCode: null, errMsg: "saml_finalized", t0, ip, ua,
  });

  return jsonResp({
    ok: true,
    role: result.role,
    matched_group: result.matchedGroup,
    empresa_id: provider.empresa_id ?? null,
  }, 200);
}

function jsonResp(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* =============================================================================
 * Handler principal
 * ============================================================================= */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Roteia POST com body { kind: 'saml-finalize' } para o branch SAML
  if (req.method === "POST") {
    const peek = await safeJson(req);
    if (peek && (peek.kind === "saml-finalize" || peek.kind === "saml_finalize")) {
      // restitui body para o handler
      const reused = new Request(req.url, {
        method: "POST",
        headers: req.headers,
        body: JSON.stringify(peek),
      });
      return handleSamlFinalize(reused);
    }
  }

  // ============= OIDC callback (GET com code/state vindo do IdP) =============
  const t0 = Date.now();
  const ip = getClientIp(req);
  const ua = req.headers.get("user-agent");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const verifier = url.searchParams.get("verifier") || (await safeJson(req))?.verifier;

  if (!code || !state) {
    await logAttempt({
      admin, providerId: null, email: null, success: false,
      errCode: "missing_code_or_state", errMsg: null, t0, ip, ua,
    });
    return redirectErr(req, "missing_code_or_state");
  }

  let appRedirect: string | null = null;

  try {
    const { data: attempt } = await admin
      .from("sso_login_attempts")
      .select("*")
      .eq("state", state)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    appRedirect = attempt?.app_redirect ?? null;

    if (!attempt || (attempt.expires_at && new Date(attempt.expires_at) < new Date())) {
      await logAttempt({
        admin, providerId: attempt?.provider_id ?? null, email: null, success: false,
        errCode: "state_invalid_or_expired", errMsg: null, t0, ip, ua, appRedirect,
      });
      return redirectErr(req, "state_invalid_or_expired", appRedirect);
    }
    if (attempt.code_verifier_hash && verifier) {
      const h = await sha256(verifier);
      if (h !== attempt.code_verifier_hash) {
        await logAttempt({
          admin, providerId: attempt.provider_id, email: null, success: false,
          errCode: "pkce_mismatch", errMsg: null, t0, ip, ua, appRedirect,
        });
        return redirectErr(req, "pkce_mismatch", appRedirect);
      }
    }

    const { data: provider } = await admin
      .from("sso_providers").select("*").eq("id", attempt.provider_id).maybeSingle();
    if (!provider) {
      await logAttempt({
        admin, providerId: attempt.provider_id, email: null, success: false,
        errCode: "provider_missing", errMsg: null, t0, ip, ua, appRedirect,
      });
      return redirectErr(req, "provider_missing", appRedirect);
    }

    // Discovery
    let tokenEndpoint = provider.token_endpoint;
    let userinfoEndpoint = provider.userinfo_endpoint;
    if ((!tokenEndpoint || !userinfoEndpoint) && provider.discovery_url) {
      const meta = await (await fetch(provider.discovery_url)).json();
      tokenEndpoint ??= meta.token_endpoint;
      userinfoEndpoint ??= meta.userinfo_endpoint;
    }

    const clientSecret = provider.client_secret_ref ? Deno.env.get(provider.client_secret_ref) : null;

    // Exchange code → tokens
    const callback = `${SUPABASE_URL}/functions/v1/sso-callback`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callback,
      client_id: provider.client_id || "",
      ...(clientSecret ? { client_secret: clientSecret } : {}),
      ...(verifier ? { code_verifier: verifier } : {}),
    });
    const tokRes = await fetch(tokenEndpoint!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tokRes.ok) {
      await logAttempt({
        admin, providerId: provider.id, email: null, success: false,
        errCode: "token_exchange_failed", errMsg: await tokRes.text(), t0, ip, ua, appRedirect,
      });
      return redirectErr(req, "token_exchange_failed", appRedirect);
    }
    const tokens = await tokRes.json();

    let claims: Record<string, unknown> = {};
    if (tokens.id_token) {
      try { claims = decodeJwtPayload(tokens.id_token); } catch { /* ignore */ }
    }
    if (!claims.email && tokens.access_token && userinfoEndpoint) {
      const ui = await fetch(userinfoEndpoint, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (ui.ok) claims = { ...claims, ...(await ui.json()) };
    }

    const cm = (provider.claim_mapping || {}) as Record<string, string>;
    const email = String(claims[cm.email || "email"] || claims.email || "").toLowerCase();
    const fullName = String(claims[cm.full_name || "name"] || claims.name || email);
    const groups: string[] = Array.isArray(claims[cm.groups || "groups"])
      ? (claims[cm.groups || "groups"] as string[])
      : [];

    if (!email) {
      await logAttempt({
        admin, providerId: provider.id, email: null, success: false,
        errCode: "no_email_claim", errMsg: null, t0, ip, ua, appRedirect,
      });
      return redirectErr(req, "no_email_claim", appRedirect);
    }

    const result = await applyPipeline({
      admin,
      provider,
      email,
      fullName,
      groups,
      existingUserId: null,
      allowJit: !!provider.auto_provision_users,
    });

    if ("error" in result) {
      await logAttempt({
        admin, providerId: provider.id, email, success: false,
        errCode: result.error, errMsg: result.details ?? null, t0, ip, ua, appRedirect,
      });
      return redirectErr(req, result.error, appRedirect);
    }

    await logAttempt({
      admin, providerId: provider.id, email, success: true,
      errCode: null, errMsg: result.jitCreated ? "jit_provisioned" : null,
      t0, ip, ua, appRedirect,
    });

    // Magic link e redirect para o app
    const redirectTo = appRedirect || safeOrigin(req, null);
    const link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (link.error || !link.data.properties?.action_link) {
      return redirectErr(req, "magiclink_failed", appRedirect);
    }
    return Response.redirect(link.data.properties.action_link, 302);
  } catch (e) {
    await logAttempt({
      admin, providerId: null, email: null, success: false,
      errCode: "unexpected", errMsg: e instanceof Error ? e.message : String(e),
      t0, ip, ua, appRedirect,
    });
    return redirectErr(req, "unexpected", appRedirect);
  }
});
