import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function base64url(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { provider_id, redirect_to } = await req.json();
    if (!provider_id) return json({ error: "provider_id obrigatório" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: provider, error } = await admin
      .from("sso_providers")
      .select("*")
      .eq("id", provider_id)
      .eq("ativo", true)
      .maybeSingle();

    if (error || !provider) return json({ error: "Provedor não encontrado ou inativo" }, 404);

    if (provider.tipo === "saml") {
      // Supabase nativo cuida do SAML — devolve URL pronta
      const url = `${SUPABASE_URL}/auth/v1/sso?provider=${provider.id}&redirect_to=${encodeURIComponent(redirect_to || "")}`;
      return json({ redirect_url: url, type: "saml" }, 200);
    }

    // OIDC: descobre endpoints + monta authorize com PKCE
    let authEndpoint = provider.authorization_endpoint;
    let scopes = provider.scopes ?? ["openid", "profile", "email"];
    if (!authEndpoint && provider.discovery_url) {
      const r = await fetch(provider.discovery_url);
      if (!r.ok) return json({ error: "Falha ao descobrir endpoints OIDC" }, 502);
      const meta = await r.json();
      authEndpoint = meta.authorization_endpoint;
    }
    if (!authEndpoint) return json({ error: "authorization_endpoint indisponível" }, 400);

    const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
    const challenge = base64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    const state = base64url(crypto.getRandomValues(new Uint8Array(24)));
    const verifierHash = await sha256(verifier);

    const expires_at = new Date(Date.now() + 5 * 60_000).toISOString();
    await admin.from("sso_login_attempts").insert({
      provider_id: provider.id,
      empresa_id: provider.empresa_id,
      success: false,
      state,
      code_verifier_hash: verifierHash,
      expires_at,
      app_redirect: redirect_to ?? null,
    });

    const callback = `${SUPABASE_URL}/functions/v1/sso-callback`;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: provider.client_id || "",
      redirect_uri: callback,
      scope: scopes.join(" "),
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    if (redirect_to) params.set("app_redirect", redirect_to);

    return json({
      redirect_url: `${authEndpoint}?${params.toString()}`,
      verifier, // cliente armazena em sessionStorage para devolver no callback
      state,
      type: "oidc",
    }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
