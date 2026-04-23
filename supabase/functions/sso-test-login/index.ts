import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import {
  type ClaimMapping,
  evaluateClaims,
  type RoleMapping,
} from "./pipeline.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json() as {
      mock_claims: Record<string, unknown>;
      claim_mapping?: ClaimMapping;
      role_mappings?: RoleMapping[];
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
      role_mappings = (maps ?? []) as RoleMapping[];
      default_role = provider.default_role ?? "visualizador";
      allowed_domains = (provider.allowed_domains ?? []) as string[];
      auto_provision_users = !!provider.auto_provision_users;
      provider_nome = provider.nome;
    }

    // userLookup encapsulado para permitir injeção/mock em testes.
    const userLookup = async (email: string): Promise<boolean | null> => {
      try {
        const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
        const { data: list } = await admin.auth.admin.listUsers();
        return !!list?.users.find((u) => u.email?.toLowerCase() === email);
      } catch {
        return null;
      }
    };

    const result = await evaluateClaims({
      mock_claims: payload.mock_claims ?? {},
      config: {
        claim_mapping,
        role_mappings,
        default_role,
        allowed_domains,
        auto_provision_users,
        provider_nome,
      },
      userLookup,
    });

    return json(result, 200);
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
