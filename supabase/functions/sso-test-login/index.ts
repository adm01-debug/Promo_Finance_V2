import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

interface ClaimMapping {
  email?: string;
  full_name?: string;
  groups?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const head = user.slice(0, 1);
  const tail = user.length > 2 ? user.slice(-1) : "";
  return `${head}${"*".repeat(Math.max(1, user.length - 2))}${tail}@${domain}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json() as {
      mock_claims: Record<string, unknown>;
      claim_mapping?: ClaimMapping;
      role_mappings?: Array<{ idp_group: string; app_role: string }>;
      default_role?: string;
      allowed_domains?: string[];
      provider_id?: string;
    };

    let claim_mapping = payload.claim_mapping ?? {};
    let role_mappings = payload.role_mappings ?? [];
    let default_role = payload.default_role ?? "visualizador";
    let allowed_domains = payload.allowed_domains ?? [];
    let auto_provision_users = true;
    let provider_nome: string | null = null;

    // Carrega config real do provider quando provider_id é fornecido (requer admin)
    if (payload.provider_id) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return json({ success: false, errors: ["Não autenticado"] }, 401);
      }
      const userClient = createClient(SUPABASE_URL, ANON, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
      if (claimsErr || !claimsData?.claims) {
        return json({ success: false, errors: ["Token inválido"] }, 401);
      }
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", claimsData.claims.sub)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) {
        return json({ success: false, errors: ["Acesso negado: requer papel admin"] }, 403);
      }
      const { data: provider, error: provErr } = await admin
        .from("sso_providers")
        .select("nome, claim_mapping, default_role, allowed_domains, auto_provision_users")
        .eq("id", payload.provider_id)
        .maybeSingle();
      if (provErr || !provider) {
        return json({ success: false, errors: ["Provider não encontrado"] }, 404);
      }
      const { data: maps } = await admin
        .from("sso_role_mappings")
        .select("idp_group, app_role")
        .eq("provider_id", payload.provider_id)
        .order("ordem");
      claim_mapping = (provider.claim_mapping ?? {}) as ClaimMapping;
      role_mappings = (maps ?? []) as Array<{ idp_group: string; app_role: string }>;
      default_role = provider.default_role ?? "visualizador";
      allowed_domains = (provider.allowed_domains ?? []) as string[];
      auto_provision_users = !!provider.auto_provision_users;
      provider_nome = provider.nome;
    }

    const mock_claims = payload.mock_claims ?? {};
    const email = String(mock_claims[claim_mapping.email ?? "email"] ?? "").toLowerCase();
    const full_name = String(mock_claims[claim_mapping.full_name ?? "name"] ?? "");
    const groupsRaw = mock_claims[claim_mapping.groups ?? "groups"];
    const groups: string[] = Array.isArray(groupsRaw) ? groupsRaw.map(String) : [];

    const errors: string[] = [];
    if (!email) errors.push("Claim de email não encontrada");
    else if (!email.includes("@")) errors.push("Email inválido");

    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    const domainAllowed = !allowed_domains.length
      || allowed_domains.map(d => d.toLowerCase()).includes(domain);
    if (!domainAllowed) errors.push(`Domínio "${domain}" não está na lista permitida`);

    let resolved_role = default_role;
    let matched_group: string | null = null;
    for (const m of role_mappings) {
      if (groups.includes(m.idp_group)) {
        resolved_role = m.app_role;
        matched_group = m.idp_group;
        break;
      }
    }

    // Verifica existência do usuário (requer service role; só roda se temos provider_id ou se for chamada admin)
    let user_exists = false;
    let would_jit_provision = false;
    let provision_blocked_reason: string | null = null;
    if (email && email.includes("@")) {
      try {
        const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
        const { data: list } = await admin.auth.admin.listUsers();
        const found = list?.users.find(u => u.email?.toLowerCase() === email);
        user_exists = !!found;
        if (!user_exists) {
          if (auto_provision_users) {
            would_jit_provision = true;
          } else {
            provision_blocked_reason = "auto_provision_users desabilitado no provider";
          }
        }
      } catch {
        // silently ignore — manteremos user_exists=false
      }
    }

    return json({
      success: errors.length === 0,
      preview: {
        email: email ? maskEmail(email) : null,
        email_raw_domain: domain || null,
        full_name,
        groups,
        domain,
        domain_allowed: domainAllowed,
        resolved_role,
        matched_group,
        user_exists,
        would_jit_provision,
        provision_blocked_reason,
        provider_nome,
        auto_provision_users,
      },
      errors,
    }, 200);
  } catch (e) {
    return json({ success: false, errors: [e instanceof Error ? e.message : "Erro"] }, 500);
  }
});

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
