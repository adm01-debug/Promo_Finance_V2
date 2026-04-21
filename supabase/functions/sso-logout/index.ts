import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) ?? null;

    const body = await safeJson(req);
    const providerId: string | undefined = body?.provider_id;
    const returnOrigin: string = body?.return_origin || new URL(req.url).origin;

    if (!providerId) return json({ error: "provider_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: provider } = await admin
      .from("sso_providers")
      .select("id, nome, tipo, slo_url, discovery_url, client_id")
      .eq("id", providerId)
      .maybeSingle();

    if (!provider) return json({ error: "provider_not_found" }, 404);

    // Resolve end_session_endpoint
    let endSessionEndpoint: string | null = provider.slo_url;
    if (!endSessionEndpoint && provider.tipo === "oidc" && provider.discovery_url) {
      try {
        const meta = await (await fetch(provider.discovery_url)).json();
        endSessionEndpoint = meta.end_session_endpoint ?? null;
      } catch { /* ignore */ }
    }

    const postLogoutRedirect = `${returnOrigin}/auth?slo=ok`;

    let logoutUrl: string | null = null;
    if (endSessionEndpoint) {
      const url = new URL(endSessionEndpoint);
      url.searchParams.set("post_logout_redirect_uri", postLogoutRedirect);
      if (provider.client_id) url.searchParams.set("client_id", provider.client_id);
      logoutUrl = url.toString();
    }

    // Audit
    await admin.from("sso_login_attempts").insert({
      provider_id: providerId,
      email: userEmail,
      success: true,
      error_code: "slo_initiated",
      error_message: null,
      duration_ms: 0,
    });
    await admin.from("audit_logs").insert({
      user_id: userId,
      user_email: userEmail,
      action: "LOGOUT",
      table_name: "auth.users",
      record_id: userId,
      details: `SSO Single Logout via ${provider.nome}${logoutUrl ? "" : " (sem end_session_endpoint — apenas local)"}`,
    });

    return json({ logout_url: logoutUrl, provider_nome: provider.nome });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unexpected" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
async function safeJson(req: Request) {
  try { return await req.clone().json(); } catch { return null; }
}
