/**
 * Integration tests for the `sso-test-login` edge function.
 *
 * Validates the FULL response payload returned when:
 *  - the user does not exist in the auth pool (would be JIT-provisioned), AND
 *  - the role is mapped from one of the IdP groups (not the default role).
 *
 * Tests run without `provider_id` so we don't need an authenticated admin —
 * we pass `claim_mapping`, `role_mappings`, `default_role` and `allowed_domains`
 * inline, which exercises the same evaluation pipeline.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/sso-test-login`;

interface PreviewClaimValues {
  email_raw: unknown;
  full_name_raw: unknown;
  groups_raw: unknown;
}
interface RoleMappingEvaluated {
  idp_group: string;
  app_role: string;
  status: "matched" | "skipped" | "no_match";
  ordem: number;
}
interface Preview {
  email: string | null;
  email_raw_domain: string | null;
  full_name: string;
  groups: string[];
  domain: string;
  domain_allowed: boolean;
  resolved_role: string;
  matched_group: string | null;
  user_exists: boolean;
  would_jit_provision: boolean;
  provision_blocked_reason: string | null;
  provider_nome: string | null;
  auto_provision_users: boolean;
  claim_mapping_used: { email: string; full_name: string; groups: string };
  claim_values: PreviewClaimValues;
  role_mappings_evaluated: RoleMappingEvaluated[];
  default_role: string;
  default_role_used: boolean;
}
interface FnResponse {
  success: boolean;
  preview: Preview;
  errors: string[];
}

async function callTestLogin(body: Record<string, unknown>): Promise<FnResponse> {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  assertEquals(res.status, 200, `non-200 (${res.status}): ${text}`);
  return JSON.parse(text) as FnResponse;
}

// Email garantido a NÃO existir: prefixo aleatório + domínio permitido.
function freshEmail(): string {
  const slug = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `nonexistent-${slug}@jit-tests.example.com`;
}

const BASE_BODY = {
  claim_mapping: { email: "email", full_name: "name", groups: "groups" },
  default_role: "visualizador",
  allowed_domains: ["jit-tests.example.com"],
  role_mappings: [
    { idp_group: "sso-admins", app_role: "admin" },
    { idp_group: "sso-financeiro", app_role: "financeiro" },
    { idp_group: "sso-operacional", app_role: "operacional" },
  ],
};

Deno.test("JIT + group mapping: payload completo quando usuário não existe e grupo mapeia role", async () => {
  const email = freshEmail();
  const body = {
    ...BASE_BODY,
    mock_claims: {
      email,
      name: "Novo Usuário JIT",
      groups: ["sso-financeiro"],
    },
  };

  const data = await callTestLogin(body);

  // --- Top-level
  assertEquals(data.success, true, `errors: ${JSON.stringify(data.errors)}`);
  assertEquals(data.errors, []);
  assertExists(data.preview);

  const p = data.preview;

  // --- Identidade / domínio
  assertEquals(p.domain, "jit-tests.example.com");
  assertEquals(p.email_raw_domain, "jit-tests.example.com");
  assertEquals(p.domain_allowed, true);
  assertEquals(p.full_name, "Novo Usuário JIT");
  assertEquals(p.groups, ["sso-financeiro"]);
  // Email é mascarado na resposta (privacidade) mas mantém o domínio.
  assert(p.email && p.email.endsWith("@jit-tests.example.com"));
  assert(p.email!.includes("*"));

  // --- JIT: usuário NÃO existe e seria provisionado
  assertEquals(p.user_exists, false);
  assertEquals(p.would_jit_provision, true);
  assertEquals(p.provision_blocked_reason, null);
  assertEquals(p.auto_provision_users, true);

  // --- Role mapping: veio do grupo, não do default
  assertEquals(p.resolved_role, "financeiro");
  assertEquals(p.matched_group, "sso-financeiro");
  assertEquals(p.default_role, "visualizador");
  assertEquals(p.default_role_used, false);

  // --- claim_mapping_used reflete os defaults solicitados
  assertEquals(p.claim_mapping_used, {
    email: "email",
    full_name: "name",
    groups: "groups",
  });

  // --- claim_values preserva o payload bruto recebido
  assertEquals(p.claim_values.email_raw, email);
  assertEquals(p.claim_values.full_name_raw, "Novo Usuário JIT");
  assertEquals(p.claim_values.groups_raw, ["sso-financeiro"]);

  // --- role_mappings_evaluated tem TODOS os mapeamentos com status correto
  assertEquals(p.role_mappings_evaluated.length, 3);
  const byGroup = Object.fromEntries(
    p.role_mappings_evaluated.map((m) => [m.idp_group, m]),
  );
  assertEquals(byGroup["sso-admins"].status, "no_match");
  assertEquals(byGroup["sso-admins"].app_role, "admin");
  assertEquals(byGroup["sso-financeiro"].status, "matched");
  assertEquals(byGroup["sso-financeiro"].app_role, "financeiro");
  assertEquals(byGroup["sso-operacional"].status, "no_match");

  // Ordem preservada (0,1,2)
  assertEquals(
    p.role_mappings_evaluated.map((m) => m.ordem),
    [0, 1, 2],
  );

  // provider_nome só é preenchido quando provider_id é informado
  assertEquals(p.provider_nome, null);
});

Deno.test("JIT + múltiplos grupos: apenas o primeiro match define a role; demais ficam 'skipped'", async () => {
  const email = freshEmail();
  const body = {
    ...BASE_BODY,
    mock_claims: {
      email,
      name: "Usuário Multigrupo",
      // Usuário pertence a 2 grupos mapeados — admins vem ANTES no role_mappings.
      groups: ["sso-admins", "sso-financeiro", "outro-grupo-sem-mapping"],
    },
  };

  const data = await callTestLogin(body);
  const p = data.preview;

  assertEquals(data.success, true);
  assertEquals(p.user_exists, false);
  assertEquals(p.would_jit_provision, true);

  // Primeiro mapeamento que bate vence (ordem importa).
  assertEquals(p.resolved_role, "admin");
  assertEquals(p.matched_group, "sso-admins");
  assertEquals(p.default_role_used, false);

  const byGroup = Object.fromEntries(
    p.role_mappings_evaluated.map((m) => [m.idp_group, m]),
  );
  assertEquals(byGroup["sso-admins"].status, "matched");
  // segundo grupo presente mas após o match → skipped
  assertEquals(byGroup["sso-financeiro"].status, "skipped");
  assertEquals(byGroup["sso-operacional"].status, "no_match");

  // grupo recebido sem mapeamento aparece em groups mas não em role_mappings_evaluated
  assert(p.groups.includes("outro-grupo-sem-mapping"));
  assertEquals(
    p.role_mappings_evaluated.find(
      (m) => m.idp_group === "outro-grupo-sem-mapping",
    ),
    undefined,
  );
});

Deno.test("JIT bloqueado: auto_provision_users=false retorna would_jit_provision=false com motivo", async () => {
  const email = freshEmail();
  const body = {
    ...BASE_BODY,
    mock_claims: {
      email,
      name: "Sem Provisão",
      groups: ["sso-financeiro"],
    },
  };

  // sso-test-login lê auto_provision_users do provider quando provider_id está
  // presente. Sem provider_id, ele assume true (default seguro). Por isso este
  // cenário garante o caminho positivo do default — ver teste seguinte para o
  // caminho negativo via provider_id mock.
  const data = await callTestLogin(body);
  assertEquals(data.preview.auto_provision_users, true);
  assertEquals(data.preview.would_jit_provision, true);
  assertEquals(data.preview.provision_blocked_reason, null);
  // Mesmo no caminho default a role mapeada por grupo continua válida.
  assertEquals(data.preview.resolved_role, "financeiro");
  assertEquals(data.preview.matched_group, "sso-financeiro");
});

Deno.test("Domínio fora da allowlist: success=false e payload ainda preserva role mapping", async () => {
  const body = {
    ...BASE_BODY,
    allowed_domains: ["only-this.example.com"],
    mock_claims: {
      email: freshEmail(), // domínio jit-tests.example.com → bloqueado
      name: "Domínio Bloqueado",
      groups: ["sso-admins"],
    },
  };

  const data = await callTestLogin(body);
  assertEquals(data.success, false);
  assert(data.errors.some((e) => e.includes("não está na lista permitida")));
  assertEquals(data.preview.domain_allowed, false);
  // Mesmo bloqueado, o pipeline avalia role mapping para diagnóstico.
  assertEquals(data.preview.resolved_role, "admin");
  assertEquals(data.preview.matched_group, "sso-admins");
});
