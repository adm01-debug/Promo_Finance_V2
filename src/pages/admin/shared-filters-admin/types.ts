export type AppRole = 'admin' | 'financeiro' | 'operacional' | 'visualizador';

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Administrador',
  financeiro: 'Financeiro',
  operacional: 'Operacional',
  visualizador: 'Visualizador',
};

export const ROLE_OPTIONS: AppRole[] = [
  'admin',
  'financeiro',
  'operacional',
  'visualizador',
];

export interface SharedFilterRow {
  id: string;
  user_id: string;
  created_by: string | null;
  entity_type: string;
  name: string;
  is_default: boolean;
  is_shared: boolean;
  empresa_id: string | null;
  shared_with_roles: AppRole[];
  created_at: string;
  updated_at: string;
}

export interface ProfileLite {
  id: string;
  email: string | null;
  full_name: string | null;
}

export interface EmpresaLite {
  id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
}
