import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const part = jwt.split(".")[1] || "";
  const pad = "=".repeat((4 - (part.length % 4)) % 4);
  const json = atob(part.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return JSON.parse(json);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const verifier = url.searchParams.get("verifier") || (await safeJson(req))?.verifier;

  if (!code || !state) return redirectErr(req, "missing_code_or_state");

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const t0 = Date.now();

  try {
    const { data: attempt } = await admin
      .from("sso_login_attempts")
      .select("*")
      .eq("state", state)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!attempt || (attempt.expires_at && new Date(attempt.expires_at) < new Date())) {
      return redirectErr(req, "state_invalid_or_expired");
    }
    if (attempt.code_verifier_hash && verifier) {
      const h = await sha256(verifier);
      if (h !== attempt.code_verifier_hash) return redirectErr(req, "pkce_mismatch");
    }

    const { data: provider } = await admin
      .from("sso_providers").select("*").eq("id", attempt.provider_id).maybeSingle();
    if (!provider) return redirectErr(req, "provider_missing");

    // Discovery
    let tokenEndpoint = provider.token_endpoint;
    let userinfoEndpoint = provider.userinfo_endpoint;
    if ((!tokenEndpoint || !userinfoEndpoint) && provider.discovery_url) {
      const meta = await (await fetch(provider.discovery_url)).json();
      tokenEndpoint ??= meta.token_endpoint;
      userinfoEndpoint ??= meta.userinfo_endpoint;
    }

    // Client secret resolved via Deno.env using client_secret_ref (e.g. SSO_AZURE_SECRET)
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
      await logAttempt(admin, provider.id, null, false, "token_exchange_failed", await tokRes.text(), t0);
      return redirectErr(req, "token_exchange_failed");
    }
    const tokens = await tokRes.json();

    // Claims a partir do id_token (preferido) ou userinfo
    let claims: Record<string, unknown> = {};
    if (tokens.id_token) {
      try { claims = decodeJwtPayload(tokens.id_token); } catch { /* ignore */ }
    }
    if (!claims.email && tokens.access_token && userinfoEndpoint) {
      const ui = await fetch(userinfoEndpoint, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
      if (ui.ok) claims = { ...claims, ...(await ui.json()) };
    }

    const cm = (provider.claim_mapping || {}) as Record<string, string>;
    const email = String(claims[cm.email || "email"] || claims.email || "").toLowerCase();
    const fullName = String(claims[cm.full_name || "name"] || claims.name || email);
    const groups: string[] = Array.isArray(claims[cm.groups || "groups"])
      ? (claims[cm.groups || "groups"] as string[])
      : [];

    if (!email) {
      await logAttempt(admin, provider.id, null, false, "no_email_claim", null, t0);
      return redirectErr(req, "no_email_claim");
    }

    // Domínio permitido
    if (provider.allowed_domains?.length) {
      const dom = email.split("@")[1];
      if (!provider.allowed_domains.includes(dom)) {
        await logAttempt(admin, provider.id, email, false, "domain_not_allowed", dom, t0);
        return redirectErr(req, "domain_not_allowed");
      }
    }

    // JIT provisioning: cria/atualiza usuário
    let userId: string | null = null;
    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing.users.find(u => u.email?.toLowerCase() === email);
    if (found) {
      userId = found.id;
    } else if (provider.auto_provision_users) {
      const created = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName, sso_provider_id: provider.id },
      });
      if (created.error) {
        await logAttempt(admin, provider.id, email, false, "create_user_failed", created.error.message, t0);
        return redirectErr(req, "create_user_failed");
      }
      userId = created.data.user!.id;
    } else {
      await logAttempt(admin, provider.id, email, false, "user_not_provisioned", null, t0);
      return redirectErr(req, "user_not_provisioned");
    }

    // Resolve papel via sso_role_mappings
    let role = provider.default_role || "visualizador";
    if (groups.length) {
      const { data: maps } = await admin.from("sso_role_mappings")
        .select("idp_group, app_role").eq("provider_id", provider.id).order("ordem");
      const match = maps?.find(m => groups.includes(m.idp_group));
      if (match) role = match.app_role;
    }

    // Vincula à empresa do provedor (se houver)
    if (provider.empresa_id && userId) {
      await admin.from("user_empresas").upsert({
        user_id: userId,
        empresa_id: provider.empresa_id,
        role,
        provisioned_via: "sso",
        is_default: true,
      }, { onConflict: "user_id,empresa_id" });
    }

    // Garante user_roles compat (papel global = papel mais alto)
    await admin.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

    await logAttempt(admin, provider.id, email, true, null, null, t0);

    // Gera magic link e redireciona
    const link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: url.origin },
    });
    if (link.error || !link.data.properties?.action_link) {
      return redirectErr(req, "magiclink_failed");
    }
    return Response.redirect(link.data.properties.action_link, 302);
  } catch (e) {
    await logAttempt(admin, null, null, false, "unexpected", e instanceof Error ? e.message : String(e), t0);
    return redirectErr(req, "unexpected");
  }
});

async function logAttempt(admin: ReturnType<typeof createClient>, providerId: string | null,
  email: string | null, success: boolean, errCode: string | null, errMsg: string | null, t0: number) {
  await admin.from("sso_login_attempts").insert({
    provider_id: providerId, email, success,
    error_code: errCode, error_message: errMsg,
    duration_ms: Date.now() - t0,
  });
}

async function safeJson(req: Request) {
  try { return await req.clone().json(); } catch { return null; }
}

function redirectErr(req: Request, code: string) {
  const origin = new URL(req.url).origin;
  return Response.redirect(`${origin.replace(".supabase.co", ".lovable.app")}/auth?sso_error=${code}`, 302);
}
