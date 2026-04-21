import { corsHeaders } from "@supabase/supabase-js/cors";

interface ClaimMapping {
  email?: string;
  full_name?: string;
  groups?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { mock_claims, claim_mapping, role_mappings, default_role, allowed_domains } = await req.json() as {
      mock_claims: Record<string, unknown>;
      claim_mapping: ClaimMapping;
      role_mappings: Array<{ idp_group: string; app_role: string }>;
      default_role: string;
      allowed_domains: string[];
    };

    const email = String(mock_claims[claim_mapping.email ?? "email"] ?? "");
    const full_name = String(mock_claims[claim_mapping.full_name ?? "name"] ?? "");
    const groupsRaw = mock_claims[claim_mapping.groups ?? "groups"];
    const groups: string[] = Array.isArray(groupsRaw) ? groupsRaw.map(String) : [];

    const errors: string[] = [];
    if (!email) errors.push("Claim de email não encontrada");
    if (!email.includes("@")) errors.push("Email inválido");

    const domain = email.split("@")[1]?.toLowerCase();
    const domainAllowed = !allowed_domains.length || allowed_domains.map(d => d.toLowerCase()).includes(domain);
    if (!domainAllowed) errors.push(`Domínio "${domain}" não está na lista permitida`);

    let resolvedRole = default_role;
    let matchedGroup: string | null = null;
    for (const mapping of role_mappings ?? []) {
      if (groups.includes(mapping.idp_group)) {
        resolvedRole = mapping.app_role;
        matchedGroup = mapping.idp_group;
        break;
      }
    }

    return json({
      success: errors.length === 0,
      preview: {
        email, full_name, groups,
        domain, domain_allowed: domainAllowed,
        resolved_role: resolvedRole,
        matched_group: matchedGroup,
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
