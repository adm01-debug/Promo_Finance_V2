import { corsHeaders } from "@supabase/supabase-js/cors";

interface ValidationResult {
  valid: boolean;
  message: string;
  discovered?: Record<string, unknown>;
  errors?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { tipo, discovery_url, metadata_xml, metadata_url, sso_url, x509_cert } = await req.json();

    const result: ValidationResult = { valid: false, message: "" };

    if (tipo === "oidc") {
      if (!discovery_url) {
        return json({ valid: false, message: "discovery_url é obrigatório" }, 400);
      }
      const res = await fetch(discovery_url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) {
        return json({ valid: false, message: `Falha ao buscar discovery: HTTP ${res.status}` }, 200);
      }
      const config = await res.json();
      const required = ["issuer", "authorization_endpoint", "token_endpoint", "jwks_uri"];
      const missing = required.filter((k) => !config[k]);
      if (missing.length) {
        return json({ valid: false, message: `Campos ausentes no discovery: ${missing.join(", ")}` }, 200);
      }
      result.valid = true;
      result.message = "Discovery OIDC válido";
      result.discovered = {
        authorization_endpoint: config.authorization_endpoint,
        token_endpoint: config.token_endpoint,
        userinfo_endpoint: config.userinfo_endpoint,
        jwks_uri: config.jwks_uri,
        issuer: config.issuer,
        scopes_supported: config.scopes_supported,
      };
      return json(result, 200);
    }

    if (tipo === "saml") {
      let xml = metadata_xml;
      if (!xml && metadata_url) {
        const res = await fetch(metadata_url, { signal: AbortSignal.timeout(10_000) });
        if (!res.ok) return json({ valid: false, message: `Falha metadata HTTP ${res.status}` }, 200);
        xml = await res.text();
      }
      if (xml) {
        const ssoMatch = xml.match(/<[^>]*SingleSignOnService[^>]*Location="([^"]+)"/i);
        const certMatch = xml.match(/<[^>]*X509Certificate[^>]*>([\s\S]*?)<\/[^>]*X509Certificate>/i);
        const entityMatch = xml.match(/entityID="([^"]+)"/i);
        if (!ssoMatch || !certMatch) {
          return json({ valid: false, message: "Metadata SAML inválida (faltam SSO URL ou certificado)" }, 200);
        }
        result.valid = true;
        result.message = "Metadata SAML válida";
        result.discovered = {
          sso_url: ssoMatch[1],
          x509_cert: certMatch[1].replace(/\s+/g, ""),
          entity_id_idp: entityMatch?.[1],
        };
        return json(result, 200);
      }
      // Validação manual
      if (!sso_url || !x509_cert) {
        return json({ valid: false, message: "sso_url e x509_cert obrigatórios" }, 400);
      }
      try {
        new URL(sso_url);
      } catch {
        return json({ valid: false, message: "sso_url inválido" }, 200);
      }
      if (x509_cert.replace(/[\s\-]/g, "").length < 100) {
        return json({ valid: false, message: "Certificado X.509 muito curto" }, 200);
      }
      result.valid = true;
      result.message = "Configuração SAML manual válida";
      return json(result, 200);
    }

    return json({ valid: false, message: "tipo deve ser 'oidc' ou 'saml'" }, 400);
  } catch (e) {
    return json({ valid: false, message: e instanceof Error ? e.message : "Erro desconhecido" }, 500);
  }
});

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
