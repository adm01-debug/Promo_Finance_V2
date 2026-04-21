import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserEmpresaLink {
  id: string;
  empresa_id: string;
  role: 'admin' | 'financeiro' | 'operacional' | 'visualizador';
  is_default: boolean;
  provisioned_via: 'manual' | 'sso' | 'scim';
  ativo: boolean;
  empresa: { id: string; razao_social: string; nome_fantasia: string | null; cnpj: string };
}

export function useUserEmpresas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-empresas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('user_empresas')
        .select('id, empresa_id, role, is_default, provisioned_via, ativo, empresa:empresas(id,razao_social,nome_fantasia,cnpj)')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserEmpresaLink[];
    },
    enabled: !!user,
  });
}

const STORAGE_KEY = 'pf:current-empresa-id';

export function getCurrentEmpresaId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
export function setCurrentEmpresaId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent('current-empresa-changed', { detail: id }));
}
