// ============================================
// Validação de consistência da configuração SSO
// ============================================
// Função pura usada pelo editor para alertar conflitos entre
// claim_mapping, allowed_domains, role_mappings e default_role.

export type AppRole = 'admin' | 'financeiro' | 'operacional' | 'visualizador';
export type Severity = 'error' | 'warning' | 'info';
export type Scope =
  | 'claim_mapping'
  | 'allowed_domains'
  | 'role_mappings'
  | 'default_role'
  | 'global';

export interface SSOConfigInput {
  preset?: string | null;
  claim_mapping?: { email?: string; full_name?: string; groups?: string } | null;
  allowed_domains?: string[] | null;
  role_mappings?: Array<{ idp_group: string; app_role: string }> | null;
  default_role?: string | null;
  auto_provision_users?: boolean | null;
  force_sso_for_domains?: boolean | null;
}

export interface AutoFix {
  label: string;
  patch: Partial<SSOConfigInput>;
}

export interface ConsistencyIssue {
  id: string;
  severity: Severity;
  scope: Scope;
  field?: string;
  message: string;
  hint?: string;
  autofix?: AutoFix;
}

const VALID_ROLES: ReadonlySet<string> = new Set([
  'admin',
  'financeiro',
  'operacional',
  'visualizador',
]);

const PRIVILEGED_ROLES: ReadonlySet<string> = new Set(['admin', 'financeiro']);

// Claims aceitas como “seguras” por preset
const PRESET_EMAIL_CLAIMS: Record<string, string[]> = {
  azure: ['email', 'preferred_username', 'upn'],
  okta: ['email'],
  google: ['email'],
  custom: [],
};

// Grupos comuns esperados (orientativo) — falta de cobertura vira warning
const PRESET_EXPECTED_GROUPS: Record<string, string[]> = {
  azure: ['Admins-Financeiro', 'Todos-Funcionarios'],
  okta: ['Operacional', 'Todos'],
  google: [],
  custom: [],
};

const DOMAIN_REGEX =
  /^(?!-)[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63})+$/;

function normalizeDomain(d: string): string {
  return d.trim().toLowerCase().replace(/^@/, '');
}

export function validateSSOConfig(input: SSOConfigInput): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  const cm = input.claim_mapping ?? {};
  const domains = input.allowed_domains ?? [];
  const mappings = input.role_mappings ?? [];
  const defaultRole = input.default_role ?? '';
  const autoProvision = !!input.auto_provision_users;
  const forceSso = !!input.force_sso_for_domains;
  const preset = input.preset ?? '';

  // ----- claim_mapping -----
  if (!cm.email || !cm.email.trim()) {
    issues.push({
      id: 'cm.email.missing',
      severity: 'error',
      scope: 'claim_mapping',
      field: 'claim_mapping.email',
      message: 'Claim de e-mail não definida.',
      hint: 'Sem essa claim, nenhum login conseguirá ser identificado.',
    });
  } else if (preset && PRESET_EMAIL_CLAIMS[preset]?.length) {
    const expected = PRESET_EMAIL_CLAIMS[preset];
    if (!expected.includes(cm.email)) {
      issues.push({
        id: 'cm.email.unknown_for_preset',
        severity: 'warning',
        scope: 'claim_mapping',
        field: 'claim_mapping.email',
        message: `Claim "${cm.email}" não é típica do preset ${preset}.`,
        hint: `Esperado: ${expected.join(', ')}.`,
      });
    }
  }

  if (cm.groups && cm.groups.trim() && mappings.length === 0) {
    issues.push({
      id: 'cm.groups.unused',
      severity: 'warning',
      scope: 'claim_mapping',
      field: 'claim_mapping.groups',
      message: 'Claim de grupos definida mas nenhum mapeamento grupo→papel.',
      hint: 'Os grupos vindos do IdP serão ignorados; todos cairão no papel padrão.',
    });
  }

  // ----- allowed_domains -----
  const seenDomains = new Set<string>();
  let hasCaseOrWhitespace = false;
  domains.forEach((raw, i) => {
    const norm = normalizeDomain(raw);
    if (norm !== raw) hasCaseOrWhitespace = true;
    if (!norm || !DOMAIN_REGEX.test(norm)) {
      issues.push({
        id: 'dom.invalid',
        severity: 'error',
        scope: 'allowed_domains',
        field: `allowed_domains[${i}]`,
        message: `Domínio inválido: "${raw}".`,
        hint: 'Use o formato "empresa.com.br" sem @ ou espaços.',
      });
      return;
    }
    if (seenDomains.has(norm)) {
      issues.push({
        id: 'dom.duplicate',
        severity: 'warning',
        scope: 'allowed_domains',
        field: `allowed_domains[${i}]`,
        message: `Domínio duplicado: "${norm}".`,
        autofix: {
          label: 'Remover duplicados',
          patch: { allowed_domains: Array.from(new Set(domains.map(normalizeDomain))) },
        },
      });
    }
    seenDomains.add(norm);
  });

  if (hasCaseOrWhitespace && domains.length) {
    issues.push({
      id: 'dom.case_or_whitespace',
      severity: 'info',
      scope: 'allowed_domains',
      message: 'Algum domínio tem espaços ou letras maiúsculas.',
      hint: 'A normalização evita falsos negativos no allowlist.',
      autofix: {
        label: 'Normalizar domínios',
        patch: { allowed_domains: domains.map(normalizeDomain).filter(Boolean) },
      },
    });
  }

  if (autoProvision && domains.length === 0) {
    issues.push({
      id: 'dom.empty_with_jit',
      severity: 'error',
      scope: 'allowed_domains',
      message: 'Auto-provisionamento ativo sem allowlist de domínios.',
      hint: 'Qualquer e-mail validado pelo IdP poderia entrar via JIT. Restrinja os domínios ou desative o auto-provision.',
    });
  }

  if (forceSso && domains.length === 0) {
    issues.push({
      id: 'dom.force_without_domains',
      severity: 'warning',
      scope: 'allowed_domains',
      message: '"Forçar SSO" está ligado mas não há domínios definidos.',
      hint: 'A flag não terá efeito até cadastrar pelo menos um domínio.',
    });
  }

  // ----- role_mappings -----
  const seenGroups = new Map<string, number>();
  mappings.forEach((m, i) => {
    if (!m.idp_group || !m.idp_group.trim()) {
      issues.push({
        id: 'rm.empty_group',
        severity: 'error',
        scope: 'role_mappings',
        field: `role_mappings[${i}].idp_group`,
        message: 'Mapeamento com grupo IdP em branco.',
      });
    } else {
      const key = m.idp_group.trim();
      if (seenGroups.has(key)) {
        issues.push({
          id: 'rm.duplicate_group',
          severity: 'error',
          scope: 'role_mappings',
          field: `role_mappings[${i}].idp_group`,
          message: `Grupo "${key}" mapeado mais de uma vez.`,
          hint: `Já definido na linha ${(seenGroups.get(key) ?? 0) + 1}. Mantenha apenas um.`,
        });
      } else {
        seenGroups.set(key, i);
      }
    }
    if (!VALID_ROLES.has(m.app_role)) {
      issues.push({
        id: 'rm.unknown_role',
        severity: 'error',
        scope: 'role_mappings',
        field: `role_mappings[${i}].app_role`,
        message: `Papel "${m.app_role}" não existe no sistema.`,
        hint: `Use um de: ${Array.from(VALID_ROLES).join(', ')}.`,
      });
    }
  });

  if (preset && PRESET_EXPECTED_GROUPS[preset]?.length && mappings.length > 0) {
    const expected = PRESET_EXPECTED_GROUPS[preset];
    const mapped = new Set(mappings.map((m) => m.idp_group.trim()));
    const missing = expected.filter((g) => !mapped.has(g));
    if (missing.length === expected.length) {
      issues.push({
        id: 'rm.coverage_missing',
        severity: 'warning',
        scope: 'role_mappings',
        message: `Nenhum dos grupos típicos do preset ${preset} foi mapeado.`,
        hint: `Comuns: ${expected.join(', ')}. Sem cobertura, todos caem no papel padrão.`,
      });
    }
  }

  if (mappings.length > 0 && !mappings.some((m) => m.app_role === 'admin')) {
    issues.push({
      id: 'rm.no_admin_route',
      severity: 'info',
      scope: 'role_mappings',
      message: 'Nenhum mapeamento resolve para o papel admin.',
      hint: 'Confirme que isso é intencional — admins precisarão ser promovidos manualmente.',
    });
  }

  // ----- default_role -----
  if (!defaultRole) {
    issues.push({
      id: 'default.missing',
      severity: 'error',
      scope: 'default_role',
      field: 'default_role',
      message: 'Papel padrão não definido.',
    });
  } else if (!VALID_ROLES.has(defaultRole)) {
    issues.push({
      id: 'default.unknown',
      severity: 'error',
      scope: 'default_role',
      field: 'default_role',
      message: `Papel padrão "${defaultRole}" não existe.`,
      hint: `Use um de: ${Array.from(VALID_ROLES).join(', ')}.`,
    });
  } else if (PRIVILEGED_ROLES.has(defaultRole)) {
    issues.push({
      id: 'default.privileged',
      severity: 'warning',
      scope: 'default_role',
      field: 'default_role',
      message: `Papel padrão "${defaultRole}" é privilegiado.`,
      hint: 'Usuários sem grupo correspondente entrarão com privilégios elevados. Prefira "visualizador".',
    });
  }

  // ----- global -----
  if (mappings.length === 0 && PRIVILEGED_ROLES.has(defaultRole)) {
    issues.push({
      id: 'global.no_routes',
      severity: 'warning',
      scope: 'global',
      message: 'Sem mapeamentos de grupo + papel padrão privilegiado.',
      hint: 'Toda pessoa que logar via SSO receberá o papel padrão. Confirme ou adicione mapeamentos.',
    });
  }

  return issues;
}

export function summarizeIssues(issues: ConsistencyIssue[]) {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');
  return {
    issues,
    errors,
    warnings,
    infos,
    hasBlocker: errors.length > 0,
    total: issues.length,
  };
}
