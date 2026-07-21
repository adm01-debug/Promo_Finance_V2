export type FocusClaim = 'all' | 'email' | 'name' | 'groups' | 'domain';
export type MappingFilter = 'all' | 'matched' | 'skipped' | 'no_match';

export interface RoleMappingEval {
  idp_group: string;
  app_role: string;
  status: 'matched' | 'skipped' | 'no_match';
  ordem: number;
}

export interface SimulationResult {
  success: boolean;
  preview: {
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
    role_mappings_evaluated?: RoleMappingEval[];
    default_role?: string;
    default_role_used?: boolean;
  };
  errors: string[];
}

export const MOCK_PRESETS: Record<string, Record<string, unknown>> = {
  azure: {
    preferred_username: 'joao.silva@empresa.com.br',
    email: 'joao.silva@empresa.com.br',
    name: 'João Silva',
    oid: '00000000-0000-0000-0000-000000000001',
    groups: ['Admins-Financeiro', 'Todos-Funcionarios'],
    tid: '00000000-0000-0000-0000-aaaaaaaaaaaa',
  },
  okta: {
    email: 'maria.souza@empresa.com.br',
    name: 'Maria Souza',
    groups: ['Operacional', 'Todos'],
    sub: 'okta|abc123',
  },
  google: {
    email: 'carlos@empresa.com.br',
    name: 'Carlos Pereira',
    hd: 'empresa.com.br',
    picture: 'https://lh3.googleusercontent.com/a/xyz',
    email_verified: true,
  },
  custom: {
    email: 'usuario@empresa.com.br',
    name: 'Usuário Teste',
    groups: ['grupo-padrao'],
  },
};

export const FOCUS_CHIPS: Array<{ id: FocusClaim; label: string }> = [
  { id: 'all', label: 'Tudo' },
  { id: 'email', label: 'email' },
  { id: 'name', label: 'name' },
  { id: 'groups', label: 'groups' },
  { id: 'domain', label: 'domain' },
];

export const FILTER_CHIPS: Array<{ id: MappingFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'matched', label: 'Aplicadas' },
  { id: 'skipped', label: 'Ignoradas' },
  { id: 'no_match', label: 'Sem match' },
];
