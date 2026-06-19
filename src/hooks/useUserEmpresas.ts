
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

type AppRole = Extract<Database['public']['Enums']['app_role'], 'admin' | 'financeiro' | 'operacional' | 'visualizador'>;
type RawAppRole = Database['public']['Enums']['app_role'];
type ProvisionedVia = 'manual' | 'sso' | 'scim';

interface EmpresaSummary {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
}

interface UserEmpresaQueryRow {
  id: string;
  empresa_id: string;
  role: Database['public']['Enums']['app_role'];
  is_default: boolean;
  provisioned_via: string;
  ativo: boolean;
  empresa: EmpresaSummary | EmpresaSummary[] | null;
}

export interface UserEmpresaLink {
  id: string;
  empresa_id: string;
  role: AppRole;
  is_default: boolean;
  provisioned_via: ProvisionedVia;
  ativo: boolean;
  empresa: EmpresaSummary;
}

const APP_ROLES: readonly AppRole[] = ['admin', 'financeiro', 'operacional', 'visualizador'];
const PROVISIONING_MODES: readonly ProvisionedVia[] = ['manual', 'sso', 'scim'];
const ROLE_ALIASES: Partial<Record<RawAppRole, AppRole>> = {
  admin: 'admin',
  manager: 'financeiro',
  financeiro: 'financeiro',
  contador: 'financeiro',
  operator: 'operacional',
  operacional: 'operacional',
  viewer: 'visualizador',
  visualizador: 'visualizador',
};

function normalizeProvisionedVia(value: string): ProvisionedVia {
  return PROVISIONING_MODES.includes(value as ProvisionedVia) ? (value as ProvisionedVia) : 'manual';
}

function normalizeRole(value: RawAppRole): AppRole | null {
  return ROLE_ALIASES[value] ?? null;
}

function normalizeUserEmpresa(row: UserEmpresaQueryRow): UserEmpresaLink | null {
  const role = normalizeRole(row.role);
  if (!role || !APP_ROLES.includes(role)) return null;
  const empresa = Array.isArray(row.empresa) ? row.empresa[0] : row.empresa;
  if (!empresa) return null;

  return {
    id: row.id,
    empresa_id: row.empresa_id,
    role,
    is_default: row.is_default,
    provisioned_via: normalizeProvisionedVia(row.provisioned_via),
    ativo: row.ativo,
    empresa,
  };
}

export function useUserEmpresas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-empresas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_empresas')
        .select('id, empresa_id, role, is_default, provisioned_via, ativo, empresa:empresas(id,razao_social,nome_fantasia,cnpj)')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('is_default', { ascending: false });

      if (error) {
        logger.warn('[useUserEmpresas] Falha ao carregar vínculos de empresa', error);
        return [];
      }

      return ((data ?? []) as UserEmpresaQueryRow[])
        .map(normalizeUserEmpresa)
        .filter((link): link is UserEmpresaLink => link !== null);
    },
    enabled: !!user,
    retry: 1,
    staleTime: 60_000,
  });
}


const STORAGE_KEY = 'pf:current-empresa-id';

export function getCurrentEmpresaId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
export async function setCurrentEmpresaId(id: string) {
  const previousId = localStorage.getItem(STORAGE_KEY);
  if (previousId === id) return;

  localStorage.setItem(STORAGE_KEY, id);
  
  // Registrar auditoria de troca de empresa
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('nome_fantasia, razao_social')
        .eq('id', id)
        .maybeSingle();
      
      const nomeEmpresa = empresa?.nome_fantasia || empresa?.razao_social || 'Desconhecida';

      // Use safe RPC call with fallback
      try {
        await supabase.rpc('registrar_auditoria_config', {
          _tipo_acao: 'troca_empresa',
          _empresa_id: id,
          _detalhes: {
            previous_empresa_id: previousId,
            new_empresa_id: id,
            new_empresa_nome: nomeEmpresa,
            timestamp: new Date().toISOString(),
            context: 'EmpresaSwitcher QuickSwitch'
          } satisfies Json
        });
      } catch (rpcErr) {
        logger.warn('[useUserEmpresas] Auditoria de troca de empresa indisponível', rpcErr);
      }

      // Notificar o usuário sobre a mudança crítica
      toast.info(`Ambiente alterado para: ${nomeEmpresa}`, {
        description: 'Os dados foram sincronizados para a nova empresa.',
        action: {
          label: 'Ver Log',
          onClick: () => window.location.href = '/audit-logs'
        },
        duration: 5000
      });
    }
  } catch (err) {
    logger.error('[useUserEmpresas] Erro ao auditar troca de empresa', err);
  }

  // Notificar outras partes do sistema para manter filtros sincronizados
  window.dispatchEvent(new CustomEvent('current-empresa-changed', { 
    detail: id,
    bubbles: true,
    composed: true
  }));

  window.dispatchEvent(new CustomEvent('sync-financial-filters', { 
    detail: { empresaId: id },
    bubbles: true,
    composed: true
  }));
}

export function useDefinirEmpresaPadrao() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      if (!user) throw new Error('Usuário não autenticado');
      // Zera o flag para todos os vínculos do usuário
      const { error: e1 } = await supabase
        .from('user_empresas')
        .update({ is_default: false })
        .eq('user_id', user.id);
      if (e1) throw e1;
      // Marca o vínculo selecionado
      const { error: e2 } = await supabase
        .from('user_empresas')
        .update({ is_default: true })
        .eq('id', linkId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-empresas'] });
    },
    onError: (err: Error) => {
      toast.error('Não foi possível definir a empresa padrão: ' + err.message);
    },
  });
}
