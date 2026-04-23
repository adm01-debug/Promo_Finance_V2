/**
 * Lógica pura de avaliação de claims SSO — sem `fetch`, sem Supabase, sem `Deno.env`.
 *
 * Isso permite testes 100% determinísticos e offline. O handler HTTP em `index.ts`
 * apenas resolve a configuração (provider/admin) e injeta um `userLookup` que
 * encapsula a chamada ao `auth.admin.listUsers()`.
 */

export interface ClaimMapping {
  email?: string;
  full_name?: string;
  groups?: string;
}

export interface RoleMapping {
  idp_group: string;
  app_role: string;
}

export interface RoleMappingEvaluated extends RoleMapping {
  status: "matched" | "skipped" | "no_match";
  ordem: number;
}

export interface PipelineConfig {
  claim_mapping?: ClaimMapping;
  role_mappings?: RoleMapping[];
  default_role?: string;
  allowed_domains?: string[];
  auto_provision_users?: boolean;
  provider_nome?: string | null;
}

export interface PipelineInput {
  mock_claims: Record<string, unknown>;
  config: PipelineConfig;
  /** Resolve se o e-mail já existe no pool de auth. Retorne `null` se a verificação falhou. */
  userLookup?: (email: string) => Promise<boolean | null>;
}

export interface Preview {
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
  claim_values: {
    email_raw: unknown;
    full_name_raw: unknown;
    groups_raw: unknown;
  };
  role_mappings_evaluated: RoleMappingEvaluated[];
  default_role: string;
  default_role_used: boolean;
}

export interface PipelineResult {
  success: boolean;
  preview: Preview;
  errors: string[];
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const head = user.slice(0, 1);
  const tail = user.length > 2 ? user.slice(-1) : "";
  return `${head}${"*".repeat(Math.max(1, user.length - 2))}${tail}@${domain}`;
}

export async function evaluateClaims(
  input: PipelineInput,
): Promise<PipelineResult> {
  const {
    claim_mapping = {},
    role_mappings = [],
    default_role = "visualizador",
    allowed_domains = [],
    auto_provision_users = true,
    provider_nome = null,
  } = input.config;

  const mock_claims = input.mock_claims ?? {};

  const claim_mapping_used = {
    email: claim_mapping.email ?? "email",
    full_name: claim_mapping.full_name ?? "name",
    groups: claim_mapping.groups ?? "groups",
  };

  const email_raw = mock_claims[claim_mapping_used.email];
  const full_name_raw = mock_claims[claim_mapping_used.full_name];
  const groups_raw = mock_claims[claim_mapping_used.groups];

  const email = String(email_raw ?? "").toLowerCase();
  const full_name = String(full_name_raw ?? "");
  const groups: string[] = Array.isArray(groups_raw)
    ? groups_raw.map(String)
    : [];

  const errors: string[] = [];
  if (!email) errors.push("Claim de email não encontrada");
  else if (!email.includes("@")) errors.push("Email inválido");

  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const domainAllowed =
    !allowed_domains.length ||
    allowed_domains.map((d) => d.toLowerCase()).includes(domain);
  if (!domainAllowed)
    errors.push(`Domínio "${domain}" não está na lista permitida`);

  let resolved_role = default_role;
  let matched_group: string | null = null;
  const role_mappings_evaluated: RoleMappingEvaluated[] = [];

  let alreadyMatched = false;
  role_mappings.forEach((m, i) => {
    const groupPresent = groups.includes(m.idp_group);
    let status: RoleMappingEvaluated["status"];
    if (groupPresent && !alreadyMatched) {
      status = "matched";
      resolved_role = m.app_role;
      matched_group = m.idp_group;
      alreadyMatched = true;
    } else if (groupPresent && alreadyMatched) {
      status = "skipped";
    } else {
      status = "no_match";
    }
    role_mappings_evaluated.push({
      idp_group: m.idp_group,
      app_role: m.app_role,
      status,
      ordem: i,
    });
  });

  const default_role_used = !matched_group;

  let user_exists = false;
  let would_jit_provision = false;
  let provision_blocked_reason: string | null = null;
  if (email && email.includes("@") && input.userLookup) {
    const exists = await input.userLookup(email);
    if (exists !== null) {
      user_exists = exists;
      if (!user_exists) {
        if (auto_provision_users) {
          would_jit_provision = true;
        } else {
          provision_blocked_reason =
            "auto_provision_users desabilitado no provider";
        }
      }
    }
  }

  return {
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
      claim_mapping_used,
      claim_values: {
        email_raw: email_raw ?? null,
        full_name_raw: full_name_raw ?? null,
        groups_raw: groups_raw ?? null,
      },
      role_mappings_evaluated,
      default_role,
      default_role_used,
    },
    errors,
  };
}
