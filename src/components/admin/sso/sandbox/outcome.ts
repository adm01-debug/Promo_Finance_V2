export type SandboxOutcome = 'bloqueado' | 'seria_jit' | 'usuario_existente' | 'sem_email';

export interface SandboxResultPreview {
  email: string | null;
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
  claim_mapping_used?: { email: string; full_name: string; groups: string };
  claim_values?: { email_raw: unknown; full_name_raw: unknown; groups_raw: unknown };
  role_mappings_evaluated?: Array<{
    idp_group: string;
    app_role: string;
    status: 'matched' | 'skipped' | 'no_match';
    ordem: number;
  }>;
  default_role?: string;
  default_role_used?: boolean;
}

export interface SandboxResult {
  success: boolean;
  preview: SandboxResultPreview;
  errors: string[];
}

export function computeOutcome(result: SandboxResult): SandboxOutcome {
  const p = result.preview;
  if (!p.email) return 'sem_email';
  const blocked =
    !p.domain_allowed ||
    !!p.provision_blocked_reason ||
    (result.errors?.length ?? 0) > 0;
  if (blocked) return 'bloqueado';
  if (p.user_exists) return 'usuario_existente';
  if (p.would_jit_provision) return 'seria_jit';
  return 'bloqueado';
}

export const OUTCOME_META: Record<SandboxOutcome, { label: string; className: string; emoji: string }> = {
  bloqueado: {
    label: 'Bloqueado',
    className: 'border-destructive/40 text-destructive bg-destructive/5',
    emoji: '⛔',
  },
  seria_jit: {
    label: 'Seria JIT',
    className: 'border-secondary/40 text-secondary bg-secondary/5',
    emoji: '✨',
  },
  usuario_existente: {
    label: 'Usuário existente',
    className: 'border-success/40 text-success bg-success/5',
    emoji: '✓',
  },
  sem_email: {
    label: 'Sem email',
    className: 'text-muted-foreground',
    emoji: '∅',
  },
};
